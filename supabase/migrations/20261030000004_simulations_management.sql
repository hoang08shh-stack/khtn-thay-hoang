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
