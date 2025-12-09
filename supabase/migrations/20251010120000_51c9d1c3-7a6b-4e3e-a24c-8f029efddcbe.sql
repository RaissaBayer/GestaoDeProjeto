-- Atualiza a política de insert em public.donations para permitir inserções feitas pelo cliente web.
ALTER POLICY "Somente sistema pode registrar doações"
ON public.donations
WITH CHECK (true);
