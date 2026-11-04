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
