-- ====================================================================
-- KHTN THẦY HOÀNG - REAL-TIME MULTI-DEVICE CMS SYNC & STORAGE FIX
-- 1. Creates public.cms_snapshots for instant multi-device website updates
-- 2. Allows application/json, video/mp4, images, HTML in lesson-documents
-- 3. Enables public read on lesson-documents so students can load files
-- ====================================================================

-- 1. CMS SNAPSHOTS TABLE (Live Multi-Device Sync)
CREATE TABLE IF NOT EXISTS public.cms_snapshots (
  id TEXT PRIMARY KEY DEFAULT 'live',
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.cms_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read live CMS snapshots" ON public.cms_snapshots;
CREATE POLICY "Everyone can read live CMS snapshots"
  ON public.cms_snapshots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Teachers and admins can manage CMS snapshots" ON public.cms_snapshots;
CREATE POLICY "Teachers and admins can manage CMS snapshots"
  ON public.cms_snapshots FOR ALL
  TO authenticated
  USING (public.is_teacher_or_admin())
  WITH CHECK (public.is_teacher_or_admin());

-- Enable Realtime broadcasts for cms_snapshots (safe no-op if already added)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_snapshots;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. UPDATE lesson-documents BUCKET MIME TYPES (allow JSON snapshot, videos, HTML, images)
UPDATE storage.buckets
SET
  public = true,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/zip',
    'application/json',
    'text/html',
    'video/mp4',
    'video/webm',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
WHERE id = 'lesson-documents';

-- 3. ALLOW STUDENTS/PUBLIC TO READ lesson-documents FILES
DROP POLICY IF EXISTS "Authenticated users view lesson documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read lesson documents" ON storage.objects;
CREATE POLICY "Public read lesson documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson-documents');
