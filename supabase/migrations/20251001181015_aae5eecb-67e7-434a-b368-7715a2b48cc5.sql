-- Criar bucket para arquivos dos aulões
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-files', 'class-files', true);

-- Adicionar coluna para armazenar URL do arquivo na tabela scheduled_classes
ALTER TABLE public.scheduled_classes
ADD COLUMN file_url TEXT;

-- Políticas RLS para o bucket class-files
CREATE POLICY "Todos podem visualizar arquivos dos aulões"
ON storage.objects FOR SELECT
USING (bucket_id = 'class-files');

CREATE POLICY "Sistema pode fazer upload de arquivos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'class-files');

CREATE POLICY "Sistema pode atualizar arquivos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'class-files');

CREATE POLICY "Sistema pode deletar arquivos"
ON storage.objects FOR DELETE
USING (bucket_id = 'class-files');