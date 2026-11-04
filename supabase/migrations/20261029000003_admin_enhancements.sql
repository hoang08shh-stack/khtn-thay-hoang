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
