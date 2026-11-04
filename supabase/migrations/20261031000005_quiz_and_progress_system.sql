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
