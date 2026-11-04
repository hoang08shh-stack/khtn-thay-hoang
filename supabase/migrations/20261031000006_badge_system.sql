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
