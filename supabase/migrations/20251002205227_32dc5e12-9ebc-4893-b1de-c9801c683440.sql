-- Criar tabela de instituições beneficiadas
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact_info TEXT,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela institutions
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para institutions
CREATE POLICY "Todos podem visualizar instituições"
ON public.institutions FOR SELECT
USING (true);

CREATE POLICY "Administradores podem gerenciar instituições (INSERT)"
ON public.institutions FOR INSERT
WITH CHECK (
  COALESCE(current_setting('app.allow_admin_institution_mutation', true), 'false') = 'true'
);

CREATE POLICY "Administradores podem gerenciar instituições (UPDATE)"
ON public.institutions FOR UPDATE
USING (
  COALESCE(current_setting('app.allow_admin_institution_mutation', true), 'false') = 'true'
)
WITH CHECK (
  COALESCE(current_setting('app.allow_admin_institution_mutation', true), 'false') = 'true'
);

CREATE POLICY "Administradores podem gerenciar instituições (DELETE)"
ON public.institutions FOR DELETE
USING (
  COALESCE(current_setting('app.allow_admin_institution_mutation', true), 'false') = 'true'
);

-- Adicionar coluna institution_id na tabela donations
ALTER TABLE public.donations
ADD COLUMN institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_institutions_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();