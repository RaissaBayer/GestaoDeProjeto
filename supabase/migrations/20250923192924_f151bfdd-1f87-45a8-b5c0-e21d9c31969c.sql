-- Adicionar política RLS para permitir que o sistema atualize o status dos ministrantes
CREATE POLICY "Sistema pode atualizar status dos ministrantes" 
ON public.volunteer_teachers 
FOR UPDATE 
USING (true)
WITH CHECK (true);