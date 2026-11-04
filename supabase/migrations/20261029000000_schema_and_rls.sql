-- ====================================================================
-- KHTN THẦY HOÀNG - PHÒNG THÍ NGHIỆM KHOA HỌC SỐ
-- Supabase Schema & Row Level Security (RLS) Migration
-- Target: PostgreSQL 15+ (Supabase Free Tier)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('student', 'teacher', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subject_domain_enum AS ENUM ('hoa-hoc', 'vat-li', 'sinh-hoc', 'trai-dat-vu-tru');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Public user profile info editable by user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  grade INT CHECK (grade BETWEEN 6 AND 9),
  school TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. USER_ROLES TABLE (Separated from profiles to prevent self-elevation)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- 5. TOPICS TABLE (Chuyên đề KHTN GDPT 2018)
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INT NOT NULL CHECK (grade BETWEEN 6 AND 9),
  domain subject_domain_enum NOT NULL,
  title TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. LESSONS TABLE (Bài học chi tiết)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  grade INT NOT NULL CHECK (grade BETWEEN 6 AND 9),
  domain subject_domain_enum NOT NULL,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  view_count INT NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. LESSON_ASSETS TABLE (Tài liệu PPT, PDF, DOCX đính kèm)
CREATE TABLE IF NOT EXISTS public.lesson_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pptx', 'pdf', 'docx', 'xlsx', 'zip', 'png', 'jpg')),
  type TEXT NOT NULL,
  file_size TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  downloads_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. SIMULATIONS TABLE (Mô phỏng 3D WebGL / Three.js)
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  domain subject_domain_enum NOT NULL,
  grade INT NOT NULL CHECK (grade BETWEEN 6 AND 9),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Cơ bản', 'Trung bình', 'Nâng cao')),
  description TEXT NOT NULL,
  learning_goal TEXT NOT NULL,
  key_concepts TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. LESSON_SIMULATIONS TABLE (N-N giữa bài học và trạm thực hành 3D)
CREATE TABLE IF NOT EXISTS public.lesson_simulations (
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, simulation_id)
);

-- 10. QUIZZES TABLE (Bộ câu hỏi luyện tập & kiểm tra)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  grade INT NOT NULL CHECK (grade BETWEEN 6 AND 9),
  domain subject_domain_enum NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 15,
  pass_score INT NOT NULL DEFAULT 6,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. QUESTIONS TABLE (Câu hỏi trắc nghiệm)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  explanation TEXT,
  points INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. QUESTION_OPTIONS TABLE (Các phương án lựa chọn A, B, C, D)
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

-- 13. ANSWER_KEYS TABLE (BẢNG BẢO MẬT: Chứa đáp án chính xác)
-- Học sinh TUYỆT ĐỐI không có quyền SELECT trực tiếp bảng này
CREATE TABLE IF NOT EXISTS public.answer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL UNIQUE REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. QUIZ_ATTEMPTS TABLE (Lịch sử làm bài thi của học sinh)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 10,
  passed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. ATTEMPT_ANSWERS TABLE (Chi tiết từng câu trả lời trong lượt làm bài)
CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

-- 16. LESSON_PROGRESS TABLE (Tiến độ học tập và bài học đã lưu)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id)
);

-- ====================================================================
-- SECURITY FUNCTIONS (SECURITY DEFINER + search_path pinned)
-- ====================================================================

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Check if current user is teacher or admin
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  );
END;
$$;

-- Get role of a user
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'teacher' THEN 2 ELSE 3 END
  LIMIT 1;
  RETURN COALESCE(v_role, 'student');
END;
$$;

-- ====================================================================
-- AUTOMATIC USER REGISTRATION TRIGGER
-- When a user signs up via Supabase Auth, automatically creates:
-- 1. Profile entry
-- 2. User_roles entry with role = 'student' (ENFORCED, cannot self-elevate)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, avatar_url, grade, school)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Học viên KHTN'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE((NEW.raw_user_meta_data->>'grade')::int, 8),
    COALESCE(NEW.raw_user_meta_data->>'school', 'THCS')
  );

  -- ALWAYS default to student role.
  -- Even if client injects role='admin' in metadata, it will be IGNORED here.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- SECURE QUIZ SUBMISSION RPC (CHẤM ĐIỂM BẢO MẬT)
-- Compares answers against answer_keys without ever exposing the keys table to the client!
-- ====================================================================
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id UUID,
  p_answers JSONB -- format: [{"question_id": "...", "selected_option_id": "..."}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_attempt_id UUID;
  v_total_questions INT;
  v_correct_count INT := 0;
  v_score NUMERIC(5,2);
  v_pass_score INT;
  v_passed BOOLEAN;
  v_answer JSONB;
  v_q_id UUID;
  v_opt_id UUID;
  v_is_correct BOOLEAN;
  v_details JSONB := '[]'::jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để nộp bài kiểm tra.';
  END IF;

  -- Get quiz pass score
  SELECT pass_score INTO v_pass_score
  FROM public.quizzes
  WHERE id = p_quiz_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bài kiểm tra không tồn tại.';
  END IF;

  -- Total questions in quiz
  SELECT count(*) INTO v_total_questions
  FROM public.questions
  WHERE quiz_id = p_quiz_id;

  IF v_total_questions = 0 THEN
    RAISE EXCEPTION 'Bộ câu hỏi trống.';
  END IF;

  -- Create attempt record
  INSERT INTO public.quiz_attempts (user_id, quiz_id, score, max_score, passed, started_at, completed_at)
  VALUES (v_user_id, p_quiz_id, 0, 10, false, now(), now())
  RETURNING id INTO v_attempt_id;

  -- Evaluate each answer
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_q_id := (v_answer->>'question_id')::uuid;
    v_opt_id := NULLIF(v_answer->>'selected_option_id', '')::uuid;

    -- Verify answer against answer_keys table safely
    SELECT (ak.correct_option_id = v_opt_id) INTO v_is_correct
    FROM public.answer_keys ak
    WHERE ak.question_id = v_q_id;

    v_is_correct := COALESCE(v_is_correct, false);

    IF v_is_correct THEN
      v_correct_count := v_correct_count + 1;
    END IF;

    -- Insert individual answer result
    INSERT INTO public.attempt_answers (attempt_id, question_id, selected_option_id, is_correct)
    VALUES (v_attempt_id, v_q_id, v_opt_id, v_is_correct);

    -- Append to return details (explaining whether correct after submission)
    v_details := v_details || jsonb_build_object(
      'question_id', v_q_id,
      'is_correct', v_is_correct
    );
  END LOOP;

  -- Calculate score on 10-point scale
  v_score := ROUND((v_correct_count::numeric / v_total_questions::numeric) * 10, 2);
  v_passed := v_score >= v_pass_score;

  -- Update attempt final score
  UPDATE public.quiz_attempts
  SET score = v_score, passed = v_passed
  WHERE id = v_attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'score', v_score,
    'max_score', 10,
    'correct_count', v_correct_count,
    'total_questions', v_total_questions,
    'passed', v_passed,
    'details', v_details
  );
END;
$$;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- 2. USER_ROLES (Strict Protection: Non-admins cannot edit)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can insert user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update user_roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. TOPICS
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are viewable by everyone"
  ON public.topics FOR SELECT
  USING (true);

CREATE POLICY "Admins/Teachers can manage topics"
  ON public.topics FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 4. LESSONS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published lessons are viewable by everyone"
  ON public.lessons FOR SELECT
  USING (is_published = true OR public.is_teacher_or_admin());

CREATE POLICY "Admins/Teachers can manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 5. LESSON_ASSETS
ALTER TABLE public.lesson_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lesson assets are viewable by authenticated users"
  ON public.lesson_assets FOR SELECT
  USING (true);

CREATE POLICY "Admins/Teachers can manage lesson assets"
  ON public.lesson_assets FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 6. SIMULATIONS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Simulations are viewable by everyone"
  ON public.simulations FOR SELECT
  USING (is_published = true OR public.is_teacher_or_admin());

CREATE POLICY "Admins/Teachers can manage simulations"
  ON public.simulations FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 7. LESSON_SIMULATIONS
ALTER TABLE public.lesson_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lesson simulations are viewable by everyone"
  ON public.lesson_simulations FOR SELECT
  USING (true);

CREATE POLICY "Admins/Teachers can manage lesson simulations"
  ON public.lesson_simulations FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 8. QUIZZES
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published quizzes are viewable by authenticated users"
  ON public.quizzes FOR SELECT
  USING (is_published = true OR public.is_teacher_or_admin());

CREATE POLICY "Admins/Teachers can manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 9. QUESTIONS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (true);

CREATE POLICY "Admins/Teachers can manage questions"
  ON public.questions FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 10. QUESTION_OPTIONS
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question options are viewable by everyone"
  ON public.question_options FOR SELECT
  USING (true);

CREATE POLICY "Admins/Teachers can manage options"
  ON public.question_options FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- 11. ANSWER_KEYS (CRITICAL: ZERO ACCESS FOR STUDENTS)
ALTER TABLE public.answer_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only teachers and admins can view answer keys"
  ON public.answer_keys FOR SELECT
  TO authenticated
  USING (public.is_teacher_or_admin());

CREATE POLICY "Only teachers and admins can insert answer keys"
  ON public.answer_keys FOR INSERT
  TO authenticated
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Only teachers and admins can update answer keys"
  ON public.answer_keys FOR UPDATE
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Only teachers and admins can delete answer keys"
  ON public.answer_keys FOR DELETE
  TO authenticated
  USING (public.is_teacher_or_admin());

-- 12. QUIZ_ATTEMPTS (Students only view their own)
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());

CREATE POLICY "Users can create their own quiz attempt"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 13. ATTEMPT_ANSWERS (Students only view answers of their own attempts)
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempt answers"
  ON public.attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id AND (qa.user_id = auth.uid() OR public.is_teacher_or_admin())
    )
  );

CREATE POLICY "Users can insert attempt answers for their attempt"
  ON public.attempt_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id AND qa.user_id = auth.uid()
    )
  );

-- 14. LESSON_PROGRESS (Students manage their own progress)
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());

CREATE POLICY "Users can insert their own lesson progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
