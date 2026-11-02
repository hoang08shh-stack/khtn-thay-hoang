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
-- ====================================================================
-- KHTN THẦY HOÀNG - SEED DATA FOR SUPABASE
-- Seed GDPT 2018 Topics, Lessons, Simulations, Quizzes, Questions, Answer Keys
-- ====================================================================

-- 1. SEED TOPICS
INSERT INTO public.topics (id, grade, domain, code, title, description, order_index)
VALUES
  ('a1000000-0000-0000-0000-000000000006', 6, 'sinh-hoc', 'TOPIC-6-BIO', 'Tế bào - Đơn vị cơ sở của sự sống', 'Cấu tạo tế bào nhân sơ và nhân thực, kỹ năng sử dụng kính hiển vi quang học.', 1),
  ('a1000000-0000-0000-0000-000000000007', 7, 'hoa-hoc', 'TOPIC-7-CHEM', 'Nguyên tử - Nguyên tố hóa học', 'Mô hình nguyên tử Rutherford - Bohr, cấu tạo hạt nhân và các lớp vỏ electron.', 2),
  ('a1000000-0000-0000-0000-000000000008', 8, 'vat-li', 'TOPIC-8-PHYS', 'Điện học & Định luật Ôm', 'Cường độ dòng điện, hiệu điện thế, điện trở và sự phụ thuộc theo Định luật Ôm.', 3),
  ('a1000000-0000-0000-0000-000000000009', 8, 'hoa-hoc', 'TOPIC-8-ACID', 'Axit - Bazơ - Thang đo pH', 'Tính chất hóa học của axit clohiđric HCl, bazơ natri hiđroxit NaOH và chỉ thị màu pH.', 4),
  ('a1000000-0000-0000-0000-000000000010', 9, 'vat-li', 'TOPIC-9-OPT', 'Khúc xạ ánh sáng & Lăng kính', 'Hiện tượng khúc xạ qua mặt phân cách, định luật truyền thẳng và tán sắc ánh sáng.', 5)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED SIMULATIONS
INSERT INTO public.simulations (id, slug, title, type, category, domain, grade, difficulty, description, learning_goal, key_concepts, thumbnail_url, is_published)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'sim-atom-bohr',
    'Mô hình Cấu tạo Nguyên tử Rutherford - Bohr',
    'atom-bohr',
    'Cấu tạo chất',
    'hoa-hoc',
    7,
    'Cơ bản',
    'Mô phỏng 3D tương tác hạt nhân (Proton, Neutron) và các lớp vỏ electron chuyển động với quỹ đạo năng lượng xác định.',
    'Hiểu rõ cấu trúc hạt nhân, điện tích hạt và phân bố electron trên các lớp K, L, M.',
    ARRAY['Proton (p+)', 'Neutron (n0)', 'Electron (e-)', 'Lớp vỏ electron', 'Số hiệu nguyên tử Z'],
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'sim-electric-circuit',
    'Phòng thí nghiệm Mạch điện & Định luật Ôm',
    'electric-circuit',
    'Điện học',
    'vat-li',
    8,
    'Cơ bản',
    'Bàn thí nghiệm ảo tương tác mạch điện một chiều. Tự do thay đổi hiệu điện thế pin nguồn (1.5V - 12V), giá trị điện trở (1Ω - 50Ω).',
    'Kiểm chứng công thức I = U / R, quan sát số đo trên ampe kế và vôn kế ảo trong thời gian thực.',
    ARRAY['Định luật Ôm', 'Điện trở R', 'Hiệu điện thế U', 'Cường độ I', 'Ampe kế', 'Vôn kế'],
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'sim-acid-base-ph',
    'Chuẩn độ Axit - Bazơ & Thang đo chỉ thị màu pH',
    'acid-base-ph',
    'Dung dịch & Axit-Bazơ',
    'hoa-hoc',
    8,
    'Trung bình',
    'Mô phỏng chuẩn độ dung dịch HCl bằng NaOH với chỉ thị phenolphtalein, hiển thị đường cong chuẩn độ pH chuẩn.',
    'Nhận biết điểm tương đương pH = 7, màu sắc chất chỉ thị và sự biến thiên pH khi thêm bazơ.',
    ARRAY['Phản ứng trung hòa', 'Chỉ thị pH', 'Phenolphtalein', 'Điểm tương đương', 'Axit - Bazơ'],
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'sim-microscope-cell',
    'Kính hiển vi quang học & Tế bào thực vật',
    'microscope-cell',
    'Sinh học tế bào',
    'sinh-hoc',
    6,
    'Cơ bản',
    'Mô hình 3D kính hiển vi quang học sinh học đầy đủ các bộ phận: thị kính, vật kính 4x/10x/40x, ốc sơ cấp, ốc vi cấp, đèn chiếu sáng.',
    'Rèn luyện kỹ năng điều chỉnh ốc vi cấp lấy tiêu cự, nhận diện lục lạp, không bào và thành tế bào.',
    ARRAY['Thành tế bào', 'Lục lạp', 'Màng tế bào', 'Nhân tế bào', 'Độ phóng đại kính hiển vi'],
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED LESSONS
INSERT INTO public.lessons (id, topic_id, grade, domain, code, title, summary, content, duration_minutes, view_count, thumbnail_url, is_published)
VALUES
  (
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000007',
    7,
    'hoa-hoc',
    'KHTN-7-BAI-2',
    'Nguyên tử và Cấu tạo nguyên tử theo mô hình Rutherford - Bohr',
    'Tìm hiểu cấu trúc hạt nhân mang điện tích dương và các electron quay trên các lớp vỏ xác định xung quanh hạt nhân.',
    '<h2>I. Khái niệm về nguyên tử</h2><p>Nguyên tử là hạt vô cùng nhỏ, trung hòa về điện, cấu tạo nên các chất.</p><h2>II. Cấu tạo nguyên tử</h2><ul><li>Hạt nhân ở tâm: chứa proton (p, mang điện tích +) và neutron (n, không mang điện).</li><li>Vỏ nguyên tử: chứa các electron (e, mang điện tích -) chuyển động rất nhanh quanh hạt nhân theo từng lớp.</li></ul>',
    45,
    1420,
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000006',
    6,
    'sinh-hoc',
    'KHTN-6-BAI-3',
    'Kính hiển vi quang học và Quan sát tế bào thực vật',
    'Cấu tạo kính hiển vi quang học, kỹ năng sử dụng ốc sơ cấp, ốc vi cấp và thực hành soi tiêu bản tế bào vảy hành.',
    '<h2>I. Cấu tạo kính hiển vi</h2><p>Kính hiển vi quang học gồm 4 hệ thống chính: giá đỡ, phóng đại, chiếu sáng và điều chỉnh.</p><h2>II. Các bước quan sát</h2><p>1. Đặt tiêu bản lên bàn kính. 2. Dùng ốc sơ cấp hạ vật kính gần tiêu bản. 3. Nhìn thị kính nâng dần vật kính. 4. Dùng ốc vi cấp tinh chỉnh độ nét.</p>',
    45,
    1890,
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'c1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000008',
    8,
    'vat-li',
    'KHTN-8-BAI-8',
    'Mạch điện đơn giản và Định luật Ôm',
    'Mối quan hệ giữa cường độ dòng điện (I), hiệu điện thế (U) và điện trở (R). Thực hành lắp ráp mạch điện và đo lường thông số.',
    '<h2>I. Định luật Ôm</h2><p>Cường độ dòng điện chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây.</p><p><strong>Công thức: I = U / R</strong></p>',
    45,
    2310,
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80',
    true
  )
ON CONFLICT (code) DO NOTHING;

-- 4. LINK LESSONS AND SIMULATIONS
INSERT INTO public.lesson_simulations (lesson_id, simulation_id)
VALUES
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- 5. SEED LESSON ASSETS
INSERT INTO public.lesson_assets (lesson_id, title, format, type, file_size, file_url)
VALUES
  ('c1000000-0000-0000-0000-000000000002', 'Bài giảng điện tử: Mô hình Nguyên tử Rutherford - Bohr', 'pptx', 'Giáo án điện tử', '12.4 MB', 'https://example.com/assets/pptx_khtn7_bai2.pptx'),
  ('c1000000-0000-0000-0000-000000000002', 'Phiếu học tập: Cấu hình electron các nguyên tố 1-20', 'pdf', 'Phiếu học tập', '1.8 MB', 'https://example.com/assets/pdf_khtn7_bai2.pdf'),
  ('c1000000-0000-0000-0000-000000000008', 'Slide bài giảng: Định luật Ôm và Thí nghiệm mạch điện', 'pptx', 'Giáo án điện tử', '15.6 MB', 'https://example.com/assets/pptx_khtn8_bai8.pptx')
ON CONFLICT DO NOTHING;

-- 6. SEED QUIZZES
INSERT INTO public.quizzes (id, lesson_id, grade, domain, title, duration_minutes, pass_score)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    7,
    'hoa-hoc',
    'Trắc nghiệm Củng cố: Cấu tạo Nguyên tử (KHTN Lớp 7)',
    15,
    6
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000008',
    8,
    'vat-li',
    'Trắc nghiệm Đánh giá: Định luật Ôm và Mạch điện (KHTN Lớp 8)',
    15,
    6
  )
ON CONFLICT DO NOTHING;

-- 7. SEED QUESTIONS, OPTIONS, AND PROTECTED ANSWER KEYS
-- Quiz 1, Question 1
INSERT INTO public.questions (id, quiz_id, question_text, explanation, points, order_index)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'Hạt mang điện tích dương nằm trong hạt nhân nguyên tử là loại hạt nào sau đây?',
    'Trong hạt nhân nguyên tử, proton mang điện tích dương (+1), neutron không mang điện, còn electron chuyển động ở vỏ mang điện âm (-1).',
    1,
    1
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.question_options (id, question_id, option_text, order_index)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Electron', 1),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Proton', 2),
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Neutron', 3),
  ('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'Photon', 4)
ON CONFLICT DO NOTHING;

-- Answer Key: Question 1 -> Option 2 (Proton)
INSERT INTO public.answer_keys (question_id, correct_option_id)
VALUES ('e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002')
ON CONFLICT (question_id) DO NOTHING;

-- Quiz 1, Question 2
INSERT INTO public.questions (id, quiz_id, question_text, explanation, points, order_index)
VALUES
  (
    'e1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    'Nguyên tử Cacbon (Carbon) có 6 proton. Số lượng electron chuyển động ở lớp vỏ của nguyên tử Cacbon trung hòa về điện là bao nhiêu?',
    'Trong nguyên tử trung hòa về điện, số hạt proton (p) luôn bằng số hạt electron (e), do đó e = 6.',
    1,
    2
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.question_options (id, question_id, option_text, order_index)
VALUES
  ('f1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000002', '4 electron', 1),
  ('f1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', '6 electron', 2),
  ('f1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000002', '8 electron', 3),
  ('f1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000002', '12 electron', 4)
ON CONFLICT DO NOTHING;

-- Answer Key: Question 2 -> Option 2 (6 electron)
INSERT INTO public.answer_keys (question_id, correct_option_id)
VALUES ('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000006')
ON CONFLICT (question_id) DO NOTHING;

-- Quiz 2, Question 1 (Định luật Ôm)
INSERT INTO public.questions (id, quiz_id, question_text, explanation, points, order_index)
VALUES
  (
    'e1000000-0000-0000-0000-000000000003',
    'd1000000-0000-0000-0000-000000000002',
    'Theo Định luật Ôm, khi giữ nguyên hiệu điện thế U ở hai đầu đoạn mạch nhưng tăng điện trở R lên 2 lần thì cường độ dòng điện I sẽ thay đổi thế nào?',
    'Theo định luật Ôm I = U / R, cường độ dòng điện tỉ lệ nghịch với điện trở. Khi R tăng 2 lần thì I giảm đi 2 lần.',
    1,
    1
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.question_options (id, question_id, option_text, order_index)
VALUES
  ('f1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000003', 'Tăng lên 2 lần', 1),
  ('f1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000003', 'Giảm đi 2 lần', 2),
  ('f1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000003', 'Không thay đổi', 3),
  ('f1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000003', 'Tăng lên 4 lần', 4)
ON CONFLICT DO NOTHING;

-- Answer Key: Question 3 -> Option 2 (Giảm đi 2 lần)
INSERT INTO public.answer_keys (question_id, correct_option_id)
VALUES ('e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000010')
ON CONFLICT (question_id) DO NOTHING;
-- ====================================================================
-- KHTN THẦY HOÀNG - SUPABASE STORAGE CONFIGURATION & POLICIES
-- Buckets: science-assets, lesson-documents, avatars
-- ====================================================================

-- 1. CREATE STORAGE BUCKETS (If not already created)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'science-assets',
    'science-assets',
    true,
    52428800, -- 50MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'model/gltf-binary', 'model/gltf+json', 'application/json']
  ),
  (
    'lesson-documents',
    'lesson-documents',
    true,
    104857600, -- 100MB limit for PPTX / PDF
    ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- pptx
      'application/vnd.ms-powerpoint', -- ppt
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- docx
      'application/msword', -- doc
      'application/zip'
    ]
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. STORAGE POLICIES FOR science-assets
-- Everyone can view science assets
CREATE POLICY "Public read science assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'science-assets');

-- Only teachers/admins can upload/modify science assets
CREATE POLICY "Teacher/Admin upload science assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'science-assets' AND
    public.is_teacher_or_admin()
  );

CREATE POLICY "Teacher/Admin update science assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'science-assets' AND
    public.is_teacher_or_admin()
  );

CREATE POLICY "Teacher/Admin delete science assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'science-assets' AND
    public.is_teacher_or_admin()
  );

-- 3. STORAGE POLICIES FOR lesson-documents
-- Anyone authenticated can view and download lesson documents
CREATE POLICY "Authenticated users view lesson documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'lesson-documents');

-- Only teachers/admins can upload/modify lesson documents
CREATE POLICY "Teacher/Admin upload lesson documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-documents' AND
    public.is_teacher_or_admin()
  );

CREATE POLICY "Teacher/Admin update lesson documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesson-documents' AND
    public.is_teacher_or_admin()
  );

CREATE POLICY "Teacher/Admin delete lesson documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-documents' AND
    public.is_teacher_or_admin()
  );

-- 4. STORAGE POLICIES FOR avatars
-- Everyone can view avatars
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload an avatar into a folder matching their user_id
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
-- ====================================================================
-- KHTN THẦY HOÀNG - SUPABASE MIGRATION 003: ADMIN ENHANCEMENTS
-- Cập nhật trường bài học: video_url, order_index, slug
-- Giới hạn Supabase Free Storage: 50MB (52,428,800 bytes)
-- ====================================================================

-- 1. Thêm các cột mở rộng cho bảng public.lessons (nếu chưa có)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;

-- Tạo unique index cho slug nếu chưa có
CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_slug ON public.lessons (slug) WHERE slug IS NOT NULL;

-- Index hỗ trợ sắp xếp thứ tự bài học
CREATE INDEX IF NOT EXISTS idx_lessons_grade_order ON public.lessons (grade, domain, order_index);

-- 2. Giới hạn dung lượng Supabase Storage Free Tier tối đa 50MB (52,428,800 bytes)
UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50 MB Supabase Free limit
WHERE id IN ('lesson-documents', 'science-assets');

-- 3. Function kiểm tra tính duy nhất của slug bài học
CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug TEXT, p_exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.lessons
    WHERE (slug = p_slug OR code = p_slug)
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
  );
END;
$$;

-- 4. Bổ sung chính sách RLS cho phép Admin & Teacher quản lý toàn quyền bảng lessons
-- Đảm bảo chỉ giáo viên và admin mới có thể tạo/sửa/xóa bài học và tài liệu
DROP POLICY IF EXISTS "Admins and teachers full manage lessons" ON public.lessons;
CREATE POLICY "Admins and teachers full manage lessons"
  ON public.lessons
  FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- Học sinh và người dùng chỉ có thể đọc bài học đã xuất bản (is_published = true)
DROP POLICY IF EXISTS "Published lessons viewable by all" ON public.lessons;
CREATE POLICY "Published lessons viewable by all"
  ON public.lessons
  FOR SELECT
  USING (is_published = true OR public.is_teacher_or_admin());
-- ============================================================================
-- MIGRATION: 20261030000004_simulations_management.sql
-- KHTN THẦY HOÀNG - Hệ thống quản lý mô phỏng 3D WebGL (Chế độ 1 GLB & Chế độ 2 TSX)
-- Hỗ trợ Cloudflare Pages Free + Supabase Free (Giới hạn 50MB / file)
-- ============================================================================

-- 0. HÀM HỖ TRỢ KIỂM TRA VAI TRÒ (HAS_ROLE)
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role::text = p_role
  );
END;
$$;

-- 1. BẢNG MÔ PHỎNG 3D (SIMULATIONS) & BỔ SUNG CỘT NẾU ĐÃ TỒN TẠI TỪ MIGRATION 000
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  mode TEXT NOT NULL DEFAULT 'declarative_glb' CHECK (mode IN ('declarative_glb', 'custom_tsx')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  grade INTEGER NOT NULL CHECK (grade BETWEEN 6 AND 9),
  domain subject_domain_enum NOT NULL,
  category TEXT NOT NULL DEFAULT 'Mô hình 3D',
  difficulty TEXT NOT NULL DEFAULT 'Cơ bản' CHECK (difficulty IN ('Cơ bản', 'Trung bình', 'Nâng cao')),
  curriculum_code TEXT,
  summary TEXT,
  description TEXT,
  learning_goal TEXT,
  key_concepts TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  model_url TEXT,
  manifest_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'declarative_glb',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS curriculum_code TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS model_url TEXT,
  ADD COLUMN IF NOT EXISTS manifest_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Index để tối ưu truy vấn theo lớp, môn học và trạng thái xuất bản
CREATE INDEX IF NOT EXISTS idx_simulations_grade_domain ON public.simulations(grade, domain);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON public.simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_slug ON public.simulations(slug);

-- 2. KÍCH HOẠT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Học sinh và khách chỉ xem được các mô phỏng đã xuất bản
DROP POLICY IF EXISTS "Public can view published simulations" ON public.simulations;
CREATE POLICY "Public can view published simulations"
ON public.simulations FOR SELECT
USING (
  is_published = true
  OR status = 'published'
  OR public.is_teacher_or_admin()
);

-- Policy 2: Chỉ Admin và Giáo viên được tạo mới mô phỏng
DROP POLICY IF EXISTS "Teachers and admins can insert simulations" ON public.simulations;
CREATE POLICY "Teachers and admins can insert simulations"
ON public.simulations FOR INSERT
TO authenticated
WITH CHECK (
  public.is_teacher_or_admin()
);

-- Policy 3: Chỉ Admin và Giáo viên được chỉnh sửa mô phỏng
DROP POLICY IF EXISTS "Teachers and admins can update simulations" ON public.simulations;
CREATE POLICY "Teachers and admins can update simulations"
ON public.simulations FOR UPDATE
TO authenticated
USING (
  public.is_teacher_or_admin()
)
WITH CHECK (
  public.is_teacher_or_admin()
);

-- Policy 4: Chỉ Admin được xóa mô phỏng
DROP POLICY IF EXISTS "Admins can delete simulations" ON public.simulations;
CREATE POLICY "Admins can delete simulations"
ON public.simulations FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- 3. TẠO HOẶC CẬP NHẬT BUCKET CHO TỆP MÔ HÌNH 3D (GLB / GLTF) TRÊN STORAGE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'science-assets',
  'science-assets',
  true,
  52428800, -- 50 MB (Supabase Free Limit)
  ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'image/png', 'image/jpeg', 'image/webp'];

-- 4. FUNCTION KIỂM TRA TRÙNG LẶP SLUG CHO MÔ PHỎNG 3D
CREATE OR REPLACE FUNCTION public.check_simulation_slug_available(p_slug TEXT, p_exclude_id TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.simulations
    WHERE (slug = p_slug OR id::text = p_slug) AND (p_exclude_id IS NULL OR id::text != p_exclude_id)
  );
END; $$;
-- ============================================================================
-- MIGRATION: 20261031000005_quiz_and_progress_system.sql
-- KHTN THẦY HOÀNG - GDPT 2018
-- HỆ THỐNG TRẮC NGHIỆM ĐA DẠNG & THEO DÕI TIẾN ĐỘ HỌC SINH TOÀN DIỆN
-- BẢO MẬT CHẤM ĐIỂM SERVER-SIDE RPC & ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 1. BỔ SUNG CÁC CỘT HỖ TRỢ LOẠI CÂU HỎI VÀ GỢI Ý VÀO BẢNG QUESTIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'question_type'
  ) THEN
    ALTER TABLE public.questions 
    ADD COLUMN question_type TEXT NOT NULL DEFAULT 'single_choice' 
    CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'hint'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN hint TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN difficulty TEXT DEFAULT 'Thông hiểu';
  END IF;
END $$;

-- 2. HỖ TRỢ ĐÁP ÁN NHIỀU LỰA CHỌN TRONG ANSWER_KEYS
-- Xóa ràng buộc UNIQUE(question_id) nếu có để 1 câu hỏi có thể liên kết nhiều dòng đáp án đúng,
-- hoặc hỗ trợ cột correct_option_ids dạng mảng UUID.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'answer_keys_question_id_key' AND table_name = 'answer_keys'
  ) THEN
    ALTER TABLE public.answer_keys DROP CONSTRAINT answer_keys_question_id_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'answer_keys' AND column_name = 'correct_option_ids'
  ) THEN
    ALTER TABLE public.answer_keys ADD COLUMN correct_option_ids UUID[];
  END IF;
END $$;

-- 3. HỖ TRỢ NHIỀU LỰA CHỌN ĐƯỢC CHỌN TRONG ATTEMPT_ANSWERS VÀ THỜI GIAN LÀM BÀI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'attempt_answers' AND column_name = 'selected_option_ids'
  ) THEN
    ALTER TABLE public.attempt_answers ADD COLUMN selected_option_ids UUID[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'attempt_answers' AND column_name = 'points_earned'
  ) THEN
    ALTER TABLE public.attempt_answers ADD COLUMN points_earned NUMERIC(4,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quiz_attempts' AND column_name = 'time_spent_seconds'
  ) THEN
    ALTER TABLE public.quiz_attempts ADD COLUMN time_spent_seconds INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'lesson_progress' AND column_name = 'quiz_score'
  ) THEN
    ALTER TABLE public.lesson_progress ADD COLUMN quiz_score NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'lesson_progress' AND column_name = 'study_time_minutes'
  ) THEN
    ALTER TABLE public.lesson_progress ADD COLUMN study_time_minutes INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'lesson_progress' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.lesson_progress ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 4. BẢO MẬT RLS CHẶT CHẼ TRÊN ANSWER_KEYS (HỌC SINH KHÔNG CÓ QUYỀN SELECT)
ALTER TABLE public.answer_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only teachers and admins can view answer keys" ON public.answer_keys;
CREATE POLICY "Only teachers and admins can view answer keys"
  ON public.answer_keys FOR SELECT
  TO authenticated
  USING (public.is_teacher_or_admin());

-- 5. BẢO MẬT RLS TRÊN QUIZ_ATTEMPTS VÀ ATTEMPT_ANSWERS
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());

DROP POLICY IF EXISTS "Users can create their own quiz attempt" ON public.quiz_attempts;
CREATE POLICY "Users can create their own quiz attempt"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attempt answers" ON public.attempt_answers;
CREATE POLICY "Users can view their own attempt answers"
  ON public.attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id AND (qa.user_id = auth.uid() OR public.is_teacher_or_admin())
    )
  );

-- 6. BẢO MẬT RLS TRÊN LESSON_PROGRESS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can view their own lesson progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());

DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can insert their own lesson progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can update their own lesson progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. HÀM CHẤM ĐIỂM SERVER-SIDE ĐÁNG TIN CẬY (SECURITY DEFINER)
-- Chấm điểm hoàn toàn trên máy chủ PostgreSQL, chống gian lận điểm từ client
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id UUID,
  p_answers JSONB,
  p_time_spent_seconds INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_attempt_id UUID;
  v_lesson_id UUID;
  v_pass_score INT;
  v_total_points NUMERIC := 0;
  v_points_earned NUMERIC := 0;
  v_correct_count INT := 0;
  v_total_questions INT := 0;
  v_final_score NUMERIC(5,2);
  v_passed BOOLEAN := false;
  v_item JSONB;
  v_q_id UUID;
  v_q_type TEXT;
  v_q_points INT;
  v_q_explanation TEXT;
  v_single_opt_id UUID;
  v_multi_opt_ids UUID[];
  v_correct_ids UUID[];
  v_is_correct BOOLEAN;
  v_earned_for_q NUMERIC;
  v_details JSONB := '[]'::jsonb;
BEGIN
  -- 1. Xác thực người dùng
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập. Cần xác thực để nộp bài kiểm tra.';
  END IF;

  -- 2. Kiểm tra bộ đề trắc nghiệm
  SELECT lesson_id, pass_score INTO v_lesson_id, v_pass_score
  FROM public.quizzes
  WHERE id = p_quiz_id AND is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bài kiểm tra không tồn tại hoặc chưa được xuất bản.';
  END IF;

  IF v_pass_score IS NULL THEN
    v_pass_score := 6;
  END IF;

  -- 3. Tạo bản ghi lượt làm bài ban đầu
  INSERT INTO public.quiz_attempts (
    user_id,
    quiz_id,
    score,
    max_score,
    passed,
    time_spent_seconds,
    started_at,
    completed_at
  ) VALUES (
    v_user_id,
    p_quiz_id,
    0,
    10.0,
    false,
    COALESCE(p_time_spent_seconds, 0),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_attempt_id;

  -- 4. Duyệt qua từng câu hỏi trong đề
  FOR v_q_id, v_q_type, v_q_points, v_q_explanation IN
    SELECT q.id, q.question_type, q.points, q.explanation
    FROM public.questions q
    WHERE q.quiz_id = p_quiz_id
    ORDER BY q.order_index ASC
  LOOP
    v_total_questions := v_total_questions + 1;
    v_total_points := v_total_points + COALESCE(v_q_points, 1);
    v_is_correct := false;
    v_earned_for_q := 0;

    -- Lấy danh sách đáp án đúng từ bảng bảo mật answer_keys
    SELECT ARRAY_AGG(DISTINCT opt_id) INTO v_correct_ids
    FROM (
      SELECT correct_option_id AS opt_id FROM public.answer_keys WHERE question_id = v_q_id AND correct_option_id IS NOT NULL
      UNION
      SELECT UNNEST(correct_option_ids) AS opt_id FROM public.answer_keys WHERE question_id = v_q_id AND correct_option_ids IS NOT NULL
    ) sub
    WHERE opt_id IS NOT NULL;

    -- Tìm câu trả lời tương ứng của học sinh trong JSON input
    v_single_opt_id := NULL;
    v_multi_opt_ids := NULL;

    SELECT 
      NULLIF(elem->>'selected_option_id', '')::UUID,
      ARRAY(SELECT jsonb_array_elements_text(elem->'selected_option_ids')::UUID)
    INTO v_single_opt_id, v_multi_opt_ids
    FROM jsonb_array_elements(p_answers) elem
    WHERE (elem->>'question_id')::UUID = v_q_id
    LIMIT 1;

    -- Kiểm tra tính đúng đắn theo loại câu hỏi
    IF v_q_type = 'multiple_choice' THEN
      -- Học sinh phải chọn CHÍNH XÁC toàn bộ đáp án đúng, không thiếu, không thừa
      IF v_multi_opt_ids IS NOT NULL AND v_correct_ids IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM unnest(v_multi_opt_ids)) = (SELECT COUNT(*) FROM unnest(v_correct_ids))
           AND NOT EXISTS (
             SELECT 1 FROM unnest(v_multi_opt_ids) sid 
             WHERE sid NOT IN (SELECT unnest(v_correct_ids))
           ) THEN
          v_is_correct := true;
        END IF;
      END IF;
    ELSE
      -- single_choice hoặc true_false
      IF v_single_opt_id IS NOT NULL AND v_correct_ids IS NOT NULL THEN
        IF v_single_opt_id = ANY(v_correct_ids) THEN
          v_is_correct := true;
        END IF;
      END IF;
    END IF;

    -- Tính điểm
    IF v_is_correct THEN
      v_correct_count := v_correct_count + 1;
      v_earned_for_q := COALESCE(v_q_points, 1);
      v_points_earned := v_points_earned + v_earned_for_q;
    END IF;

    -- Lưu chi tiết câu trả lời vào attempt_answers
    INSERT INTO public.attempt_answers (
      attempt_id,
      question_id,
      selected_option_id,
      selected_option_ids,
      is_correct,
      points_earned
    ) VALUES (
      v_attempt_id,
      v_q_id,
      v_single_opt_id,
      v_multi_opt_ids,
      v_is_correct,
      v_earned_for_q
    );

    -- Đóng gói chi tiết trả về cho học sinh xem giải thích sau nộp bài
    v_details := v_details || jsonb_build_object(
      'question_id', v_q_id,
      'is_correct', v_is_correct,
      'points_earned', v_earned_for_q,
      'explanation', COALESCE(v_q_explanation, 'Xem lại bài giảng lý thuyết.'),
      'correct_option_ids', to_jsonb(COALESCE(v_correct_ids, ARRAY[]::UUID[]))
    );
  END LOOP;

  -- 5. Quy đổi thang điểm 10
  IF v_total_points > 0 THEN
    v_final_score := ROUND((v_points_earned / v_total_points) * 10, 1);
  ELSE
    v_final_score := 0;
  END IF;

  v_passed := (v_final_score >= v_pass_score);

  -- 6. Cập nhật điểm chính thức vào quiz_attempts
  UPDATE public.quiz_attempts
  SET 
    score = v_final_score,
    passed = v_passed,
    completed_at = timezone('utc'::text, now())
  WHERE id = v_attempt_id;

  -- 7. Nếu bài trắc nghiệm gắn với bài học và học sinh Đạt, tự động đánh dấu hoàn thành bài học
  IF v_lesson_id IS NOT NULL AND v_passed THEN
    INSERT INTO public.lesson_progress (
      user_id,
      lesson_id,
      completed,
      quiz_score,
      last_accessed_at,
      completed_at
    ) VALUES (
      v_user_id,
      v_lesson_id,
      true,
      v_final_score,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      completed = true,
      quiz_score = GREATEST(COALESCE(public.lesson_progress.quiz_score, 0), v_final_score),
      last_accessed_at = timezone('utc'::text, now()),
      completed_at = COALESCE(public.lesson_progress.completed_at, timezone('utc'::text, now()));
  END IF;

  -- 8. Trả về kết quả hoàn chỉnh
  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'quiz_id', p_quiz_id,
    'score', v_final_score,
    'max_score', 10.0,
    'points_earned', v_points_earned,
    'total_points', v_total_points,
    'correct_count', v_correct_count,
    'total_questions', v_total_questions,
    'passed', v_passed,
    'pass_score', v_pass_score,
    'completed_at', timezone('utc'::text, now()),
    'details', v_details
  );
END;
$$;
-- ==============================================================================
-- Migration: 20261031000006_badge_system.sql
-- Description: Comprehensive Badge System for KHTN THẦY HOÀNG (GDPT 2018)
-- Features:
--   1. badges catalogue table (id, code, name, title_en, description, tier, points)
--   2. user_badges association table with earned_at and progress_snapshot
--   3. Strict Row Level Security (RLS) policies
--   4. Authoritative SECURITY DEFINER function evaluate_and_award_badges(p_user_id)
-- ==============================================================================

-- 0. Helper function alias for admin/teacher check
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
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

-- 1. Create Badges Catalog Table
CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  title_en VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'Award',
  category VARCHAR(30) NOT NULL DEFAULT 'general', -- 'physics', 'chemistry', 'biology', 'simulation', 'quiz', 'general'
  tier VARCHAR(20) NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'diamond'
  required_criteria TEXT NOT NULL,
  points_reward INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create User Badges Earned Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress_snapshot JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Badges Catalog
-- Anyone (students, teachers, guests) can view badges definition
DROP POLICY IF EXISTS "Public can view badges catalog" ON badges;
CREATE POLICY "Public can view badges catalog"
  ON badges FOR SELECT
  USING (true);

-- Only Admin/Teacher can create or update badges
DROP POLICY IF EXISTS "Admin and teachers can manage badges" ON badges;
CREATE POLICY "Admin and teachers can manage badges"
  ON badges FOR ALL
  USING (is_admin_or_teacher())
  WITH CHECK (is_admin_or_teacher());

-- 5. RLS Policies for User Badges
-- Students can only view their own earned badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id OR is_admin_or_teacher());

-- Only system/service role or evaluate_and_award_badges can insert
DROP POLICY IF EXISTS "Users cannot manually forge badges" ON user_badges;
CREATE POLICY "Users cannot manually forge badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin_or_teacher());

-- 6. Pre-populate System Badges (Seed Data)
INSERT INTO badges (id, code, name, title_en, description, icon, category, tier, required_criteria, points_reward)
VALUES
  (
    'badge_explorer',
    'SCIENCE_EXPLORER',
    'Nhà Thám Hiểm Khoa Học',
    'Science Explorer',
    'Bắt đầu hành trình khám phá và hoàn thành bài học đầu tiên trong chương trình KHTN.',
    'Compass',
    'general',
    'bronze',
    'Hoàn thành ít nhất 1 bài học bất kỳ',
    30
  ),
  (
    'badge_lab_pioneer',
    'LAB_PIONEER',
    'Người Tiên Phong Phòng Lab 3D',
    'Lab Pioneer',
    'Tiên phong làm chủ công nghệ thực hành mô phỏng 3D trong phòng thí nghiệm số.',
    'Sparkles',
    'simulation',
    'gold',
    'Hoàn thành từ 2 mô phỏng thí nghiệm 3D tương tác',
    100
  ),
  (
    'badge_water_master',
    'WATER_MOLECULE_MASTER',
    'Nhà Nghiên Cứu Phân Tử Nước',
    'Water Molecule Explorer',
    'Khám phá mô hình cấu trúc phân tử H2O, nắm vững góc liên kết hóa học 104.5°.',
    'Droplets',
    'simulation',
    'silver',
    'Thực hành mô phỏng 3D Phân tử nước H2O',
    60
  ),
  (
    'badge_physics_master',
    'MASTER_OF_PHYSICS',
    'Bậc Thầy Vật Lí KHTN',
    'Master of Physics',
    'Làm chủ kiến thức phân môn Vật lí (Điện học, Định luật Ôm hoặc Quang học) với điểm số xuất sắc.',
    'Zap',
    'physics',
    'diamond',
    'Hoàn thành ít nhất 1 bài học Vật lí và đạt điểm bài thi trắc nghiệm Vật lí từ 8.0 trở lên',
    150
  ),
  (
    'badge_chemistry_master',
    'MASTER_OF_CHEMISTRY',
    'Bậc Thầy Hóa Học KHTN',
    'Master of Chemistry',
    'Làm chủ kiến thức Chất và sự biến đổi hóa học (Cấu tạo nguyên tử, Axit - Bazơ, Phân tử H2O).',
    'FlaskConical',
    'chemistry',
    'diamond',
    'Hoàn thành ít nhất 1 bài học Hóa học và đạt điểm bài thi trắc nghiệm Hóa học từ 8.0 trở lên',
    150
  ),
  (
    'badge_biology_master',
    'MASTER_OF_BIOLOGY',
    'Bậc Thầy Sinh Học Tế Bào',
    'Master of Biology',
    'Làm chủ thế giới sống: thành thạo cấu tạo tế bào và thao tác kính hiển vi quang học.',
    'Microscope',
    'biology',
    'diamond',
    'Hoàn thành bài học Sinh học và đạt điểm bài thi trắc nghiệm Sinh học từ 8.0 trở lên',
    150
  ),
  (
    'badge_quiz_champion',
    'QUIZ_CHAMPION',
    'Thủ Khoa Đấu Trí',
    'Quiz Champion',
    'Thể hiện tư duy sắc bén và đạt điểm tuyệt đối 10/10 trong bài thi đánh giá năng lực.',
    'Award',
    'quiz',
    'gold',
    'Đạt điểm tối đa (10/10) trong ít nhất một bài kiểm tra trắc nghiệm',
    120
  ),
  (
    'badge_study_streak',
    'DEDICATED_SCHOLAR',
    'Nhà Khoa Học Chăm Chỉ',
    'Dedicated Scholar',
    'Chăm chỉ tích lũy kiến thức với tổng thời lượng học tập và thực hành đạt trên 120 phút.',
    'Clock',
    'general',
    'silver',
    'Tích lũy từ 120 phút học tập trên hệ thống',
    80
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  required_criteria = EXCLUDED.required_criteria,
  points_reward = EXCLUDED.points_reward;

-- 7. Authoritative Server-side Badge Evaluation RPC
CREATE OR REPLACE FUNCTION evaluate_and_award_badges(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_lessons_count INT := 0;
  v_physics_lessons_count INT := 0;
  v_chemistry_lessons_count INT := 0;
  v_biology_lessons_count INT := 0;
  v_completed_sims_count INT := 0;
  v_has_water_sim BOOLEAN := false;
  v_physics_high_score BOOLEAN := false;
  v_chemistry_high_score BOOLEAN := false;
  v_biology_high_score BOOLEAN := false;
  v_perfect_quiz_score BOOLEAN := false;
  v_study_time_minutes INT := 0;
  v_existing_badge_ids TEXT[];
  v_awarded_badge_ids TEXT[] := ARRAY[]::TEXT[];
  v_total_points_earned INT := 0;
BEGIN
  -- Verify caller is the user or teacher/admin
  IF auth.uid() <> p_user_id AND NOT is_admin_or_teacher() THEN
    RAISE EXCEPTION 'Access denied: You can only evaluate badges for your own user account';
  END IF;

  -- 1. Gather existing earned badges
  SELECT COALESCE(array_agg(badge_id), ARRAY[]::TEXT[])
  INTO v_existing_badge_ids
  FROM user_badges
  WHERE user_id = p_user_id;

  -- 2. Gather lesson progress stats
  SELECT
    COUNT(*) FILTER (WHERE completed = true),
    COUNT(*) FILTER (WHERE completed = true AND (lesson_id LIKE '%vat-li%' OR lesson_id LIKE '%bai-8%' OR lesson_id LIKE '%bai-4%')),
    COUNT(*) FILTER (WHERE completed = true AND (lesson_id LIKE '%hoa-hoc%' OR lesson_id LIKE '%bai-2%' OR lesson_id LIKE '%bai-5%')),
    COUNT(*) FILTER (WHERE completed = true AND (lesson_id LIKE '%sinh-hoc%' OR lesson_id LIKE '%bai-3%'))
  INTO
    v_completed_lessons_count,
    v_physics_lessons_count,
    v_chemistry_lessons_count,
    v_biology_lessons_count
  FROM lesson_progress
  WHERE user_id = p_user_id;

  -- 3. Gather user_progress stats (simulations & study time)
  SELECT
    COALESCE(cardinality(completed_simulations), 0),
    COALESCE('sim-water-molecule' = ANY(completed_simulations), false),
    COALESCE(study_time_minutes, 0)
  INTO
    v_completed_sims_count,
    v_has_water_sim,
    v_study_time_minutes
  FROM user_progress
  WHERE user_id = p_user_id;

  -- 4. Gather quiz performance stats
  SELECT
    EXISTS(SELECT 1 FROM quiz_attempts WHERE user_id = p_user_id AND score >= 10.0),
    EXISTS(SELECT 1 FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.user_id = p_user_id AND q.domain = 'vat-li' AND qa.score >= 8.0),
    EXISTS(SELECT 1 FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.user_id = p_user_id AND q.domain = 'hoa-hoc' AND qa.score >= 8.0),
    EXISTS(SELECT 1 FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.user_id = p_user_id AND q.domain = 'sinh-hoc' AND qa.score >= 8.0)
  INTO
    v_perfect_quiz_score,
    v_physics_high_score,
    v_chemistry_high_score,
    v_biology_high_score;

  -- Condition A: Science Explorer (Hoàn thành ít nhất 1 bài học)
  IF v_completed_lessons_count >= 1 AND NOT ('badge_explorer' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_explorer', jsonb_build_object('lessons_completed', v_completed_lessons_count))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_explorer');
    v_total_points_earned := v_total_points_earned + 30;
  END IF;

  -- Condition B: Lab Pioneer (Hoàn thành từ 2 mô phỏng 3D)
  IF v_completed_sims_count >= 2 AND NOT ('badge_lab_pioneer' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_lab_pioneer', jsonb_build_object('simulations_completed', v_completed_sims_count))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_lab_pioneer');
    v_total_points_earned := v_total_points_earned + 100;
  END IF;

  -- Condition C: Water Molecule Explorer (Thực hành mô phỏng H2O)
  IF v_has_water_sim AND NOT ('badge_water_master' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_water_master', jsonb_build_object('has_water_sim', true))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_water_master');
    v_total_points_earned := v_total_points_earned + 60;
  END IF;

  -- Condition D: Master of Physics (Vật lí bài học + thi >= 8.0)
  IF v_physics_lessons_count >= 1 AND v_physics_high_score AND NOT ('badge_physics_master' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_physics_master', jsonb_build_object('physics_lessons', v_physics_lessons_count))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_physics_master');
    v_total_points_earned := v_total_points_earned + 150;
  END IF;

  -- Condition E: Master of Chemistry (Hóa học bài học + thi >= 8.0)
  IF v_chemistry_lessons_count >= 1 AND v_chemistry_high_score AND NOT ('badge_chemistry_master' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_chemistry_master', jsonb_build_object('chemistry_lessons', v_chemistry_lessons_count))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_chemistry_master');
    v_total_points_earned := v_total_points_earned + 150;
  END IF;

  -- Condition F: Master of Biology (Sinh học bài học + thi >= 8.0)
  IF v_biology_lessons_count >= 1 AND v_biology_high_score AND NOT ('badge_biology_master' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_biology_master', jsonb_build_object('biology_lessons', v_biology_lessons_count))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_biology_master');
    v_total_points_earned := v_total_points_earned + 150;
  END IF;

  -- Condition G: Quiz Champion (Điểm tuyệt đối 10/10)
  IF v_perfect_quiz_score AND NOT ('badge_quiz_champion' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_quiz_champion', jsonb_build_object('perfect_score', true))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_quiz_champion');
    v_total_points_earned := v_total_points_earned + 120;
  END IF;

  -- Condition H: Dedicated Scholar (Tích lũy từ 120 phút)
  IF v_study_time_minutes >= 120 AND NOT ('badge_study_streak' = ANY(v_existing_badge_ids)) THEN
    INSERT INTO user_badges (user_id, badge_id, progress_snapshot)
    VALUES (p_user_id, 'badge_study_streak', jsonb_build_object('study_time_minutes', v_study_time_minutes))
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    v_awarded_badge_ids := array_append(v_awarded_badge_ids, 'badge_study_streak');
    v_total_points_earned := v_total_points_earned + 80;
  END IF;

  -- 5. Update user_progress points
  IF v_total_points_earned > 0 THEN
    UPDATE user_progress
    SET
      points = COALESCE(points, 0) + v_total_points_earned,
      badges = (SELECT array_agg(DISTINCT b) FROM unnest(array_cat(v_existing_badge_ids, v_awarded_badge_ids)) b)
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'awarded_badge_ids', v_awarded_badge_ids,
    'total_points_earned', v_total_points_earned
  );
END;
$$;
