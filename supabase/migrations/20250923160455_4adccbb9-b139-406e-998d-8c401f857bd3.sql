-- Drop the old RLS policy
DROP POLICY IF EXISTS "Todos podem ver ministrantes aprovados" ON public.volunteer_teachers;

-- Create new RLS policy that works with the status column
-- For now, allow viewing all teachers (admin functionality needs this)
CREATE POLICY "Todos podem visualizar ministrantes" 
ON public.volunteer_teachers 
FOR SELECT 
USING (true);

-- We can also create a more restrictive policy later if needed for public views
-- CREATE POLICY "Públicos podem ver ministrantes aprovados" 
-- ON public.volunteer_teachers 
-- FOR SELECT 
-- USING (status = 'approved');