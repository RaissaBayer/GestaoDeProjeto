-- Add documents metadata columns to volunteer_teachers and ensure teacher storage bucket exists

-- Add new columns with temporary defaults to backfill existing rows
ALTER TABLE public.volunteer_teachers
ADD COLUMN registration_number TEXT NOT NULL DEFAULT '',
ADD COLUMN photo_url TEXT,
ADD COLUMN academic_history_url TEXT NOT NULL DEFAULT '';

-- Remove defaults so future inserts must provide the values
ALTER TABLE public.volunteer_teachers
ALTER COLUMN registration_number DROP DEFAULT,
ALTER COLUMN academic_history_url DROP DEFAULT;

-- Create storage bucket for teacher documents if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'teacher-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('teacher-documents', 'teacher-documents', true);
  END IF;
END $$;

-- Policies to control public access and managed uploads for teacher documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Todos podem visualizar documentos de professores'
  ) THEN
    CREATE POLICY "Todos podem visualizar documentos de professores"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'teacher-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Sistema pode fazer upload de documentos de professores'
  ) THEN
    CREATE POLICY "Sistema pode fazer upload de documentos de professores"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'teacher-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Sistema pode atualizar documentos de professores'
  ) THEN
    CREATE POLICY "Sistema pode atualizar documentos de professores"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'teacher-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Sistema pode deletar documentos de professores'
  ) THEN
    CREATE POLICY "Sistema pode deletar documentos de professores"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'teacher-documents');
  END IF;
END $$;
