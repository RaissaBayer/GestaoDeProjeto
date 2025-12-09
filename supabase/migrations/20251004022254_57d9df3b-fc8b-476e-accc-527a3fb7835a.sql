-- Criar tabela para armazenar estatísticas da plataforma
CREATE TABLE public.platform_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  total_classes INTEGER NOT NULL DEFAULT 0,
  total_students INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year)
);

-- Habilitar RLS
ALTER TABLE public.platform_statistics ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos visualizem as estatísticas
CREATE POLICY "Todos podem visualizar estatísticas"
ON public.platform_statistics
FOR SELECT
USING (true);

-- Política para permitir inserção (sistema/admin)
CREATE POLICY "Sistema pode inserir estatísticas"
ON public.platform_statistics
FOR INSERT
WITH CHECK (true);

-- Política para permitir atualização (sistema/admin)
CREATE POLICY "Sistema pode atualizar estatísticas"
ON public.platform_statistics
FOR UPDATE
USING (true);

-- Política para permitir exclusão (sistema/admin)
CREATE POLICY "Sistema pode excluir estatísticas"
ON public.platform_statistics
FOR DELETE
USING (true);

-- Inserir registro inicial para o ano atual
INSERT INTO public.platform_statistics (year, total_classes, total_students)
VALUES (EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 0, 0)
ON CONFLICT (year) DO NOTHING;