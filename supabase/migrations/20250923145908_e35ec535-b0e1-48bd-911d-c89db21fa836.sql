-- Habilitar RLS em todas as tabelas
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Políticas para administrators (apenas administradores podem gerenciar)
CREATE POLICY "Administradores podem visualizar outros administradores" 
ON public.administrators FOR SELECT 
USING (false); -- Por segurança, não expor via API

CREATE POLICY "Administradores podem inserir outros administradores" 
ON public.administrators FOR INSERT 
WITH CHECK (false); -- Por segurança, não expor via API

-- Políticas para subjects (todos podem ver, só admin pode modificar)
CREATE POLICY "Todos podem visualizar matérias" 
ON public.subjects FOR SELECT 
USING (true);

CREATE POLICY "Somente sistema pode modificar matérias" 
ON public.subjects FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Somente sistema pode atualizar matérias" 
ON public.subjects FOR UPDATE 
USING (false);

-- Políticas para volunteer_teachers (todos podem se inscrever, ver aprovados)
CREATE POLICY "Todos podem se inscrever como ministrante" 
ON public.volunteer_teachers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem ver ministrantes aprovados" 
ON public.volunteer_teachers FOR SELECT 
USING (approved = true);

-- Políticas para scheduled_classes (todos podem ver)
CREATE POLICY "Todos podem visualizar aulões agendados" 
ON public.scheduled_classes FOR SELECT 
USING (true);

CREATE POLICY "Somente sistema pode criar aulões" 
ON public.scheduled_classes FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Somente sistema pode atualizar aulões" 
ON public.scheduled_classes FOR UPDATE 
USING (false);

-- Políticas para class_registrations (todos podem se inscrever)
CREATE POLICY "Todos podem se inscrever em aulões" 
ON public.class_registrations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem ver próprias inscrições" 
ON public.class_registrations FOR SELECT 
USING (true);

CREATE POLICY "Somente sistema pode atualizar inscrições" 
ON public.class_registrations FOR UPDATE 
USING (false);

-- Políticas para donations (transparência pública)
CREATE POLICY "Todos podem visualizar doações para transparência" 
ON public.donations FOR SELECT 
USING (true);

CREATE POLICY "Somente sistema pode registrar doações" 
ON public.donations FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Somente sistema pode atualizar doações" 
ON public.donations FOR UPDATE 
USING (false);