-- Adicionar coluna de status mais específica para ministrantes
ALTER TABLE public.volunteer_teachers 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Atualizar registros existentes baseado no campo approved
UPDATE public.volunteer_teachers 
SET status = CASE 
  WHEN approved = true THEN 'approved'
  ELSE 'pending'
END;

-- Opcional: remover a coluna approved antiga depois de migrar
-- ALTER TABLE public.volunteer_teachers DROP COLUMN approved;