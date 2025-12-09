-- Criar tabela donations_institutions
CREATE TABLE public.donations_institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC,
  food_weight_kg NUMERIC,
  description TEXT,
  donation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.donations_institutions ENABLE ROW LEVEL SECURITY;

-- Política para visualização (todos podem ver para transparência)
CREATE POLICY "Todos podem visualizar doações para instituições"
ON public.donations_institutions
FOR SELECT
USING (true);

-- Política para inserção (sistema pode registrar)
CREATE POLICY "Sistema pode registrar doações para instituições"
ON public.donations_institutions
FOR INSERT
WITH CHECK (true);

-- Política para atualização (sistema pode atualizar)
CREATE POLICY "Sistema pode atualizar doações para instituições"
ON public.donations_institutions
FOR UPDATE
USING (true);

-- Política para exclusão
CREATE POLICY "Sistema pode excluir doações para instituições"
ON public.donations_institutions
FOR DELETE
USING (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_donations_institutions_updated_at
BEFORE UPDATE ON public.donations_institutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();