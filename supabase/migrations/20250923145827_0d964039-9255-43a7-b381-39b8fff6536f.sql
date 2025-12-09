-- Criar tabela de administradores
CREATE TABLE public.administrators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir usuário admin padrão (senha: admin)
INSERT INTO public.administrators (username, password_hash, full_name, email) 
VALUES ('admin', '$2a$10$9Z3KvZ1qJ5X8Y7W6V5U4NuJ1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6', 'Administrador Principal', 'admin@aulaosolidario.org');

-- Criar tabela de matérias
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_seeking_teachers BOOLEAN DEFAULT true,
  is_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de ministrantes (professores voluntários)
CREATE TABLE public.volunteer_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  university TEXT,
  course TEXT,
  subjects_can_teach TEXT[] NOT NULL,
  experience_level TEXT,
  availability TEXT,
  motivation TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de aulões agendados
CREATE TABLE public.scheduled_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) NOT NULL,
  teacher_id UUID REFERENCES public.volunteer_teachers(id),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 50,
  topics TEXT[],
  materials_needed TEXT,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de inscrições nos aulões
CREATE TABLE public.class_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.scheduled_classes(id) NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  donation_type TEXT NOT NULL CHECK (donation_type IN ('alimento', 'dinheiro')),
  donation_amount TEXT,
  confirmed_presence BOOLEAN DEFAULT false,
  attended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de doações arrecadadas
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.scheduled_classes(id),
  registration_id UUID REFERENCES public.class_registrations(id),
  type TEXT NOT NULL CHECK (type IN ('alimento', 'dinheiro')),
  amount DECIMAL(10,2),
  food_weight_kg DECIMAL(5,2),
  description TEXT,
  institution_donated_to TEXT,
  donation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir algumas matérias de exemplo
INSERT INTO public.subjects (name, description, is_seeking_teachers) VALUES
('Cálculo I', 'Limites, derivadas e aplicações', true),
('Física II', 'Eletromagnetismo e circuitos elétricos', true),
('Programação Web', 'HTML, CSS, JavaScript e React', false),
('Química Geral', 'Fundamentos da química inorgânica', true),
('Álgebra Linear', 'Matrizes, vetores e transformações lineares', true);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar triggers para updated_at
CREATE TRIGGER update_administrators_updated_at
  BEFORE UPDATE ON public.administrators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_teachers_updated_at
  BEFORE UPDATE ON public.volunteer_teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_classes_updated_at
  BEFORE UPDATE ON public.scheduled_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_registrations_updated_at
  BEFORE UPDATE ON public.class_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();