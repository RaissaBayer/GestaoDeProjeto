-- Adicionar política RLS para permitir exclusão de ministrantes
CREATE POLICY "Sistema pode excluir ministrantes"
ON public.volunteer_teachers
FOR DELETE
USING (true);