-- Atualizar políticas RLS para permitir inserção e atualização de matérias
DROP POLICY IF EXISTS "Somente sistema pode modificar matérias" ON public.subjects;
DROP POLICY IF EXISTS "Somente sistema pode atualizar matérias" ON public.subjects;

-- Criar políticas que permitem inserção e atualização
CREATE POLICY "Permitir inserção de matérias" 
ON public.subjects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de matérias" 
ON public.subjects 
FOR UPDATE 
USING (true);