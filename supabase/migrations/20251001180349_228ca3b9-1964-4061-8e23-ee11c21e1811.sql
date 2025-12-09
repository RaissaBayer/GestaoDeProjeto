-- Criar tabela para armazenar template de e-mail
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso - todos podem visualizar, mas apenas o sistema pode modificar
CREATE POLICY "Todos podem visualizar templates de e-mail"
  ON public.email_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir templates"
  ON public.email_templates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar templates"
  ON public.email_templates
  FOR UPDATE
  USING (true);

CREATE POLICY "Sistema pode deletar templates"
  ON public.email_templates
  FOR DELETE
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir template padrão
INSERT INTO public.email_templates (subject, body, signature)
VALUES (
  'Lembrete: {TITULO_AULAO} - {DATA}',
  'Olá!

Esperamos você no aulão "{TITULO_AULAO}" que acontecerá:

📅 Data: {DATA}
⏰ Horário: {HORARIO_INICIO} às {HORARIO_FIM}
📍 Local: {LOCAL}
📚 Matéria: {MATERIA}
👨‍🏫 Ministrante: {MINISTRANTE}

🎯 Tópicos que serão abordados:
{TOPICOS}

📋 Materiais necessários:
{MATERIAIS}

Não se esqueça de trazer sua doação conforme combinado na inscrição.

Nos vemos lá!',
  'Equipe Aulão Solidário
Educação que transforma vidas! 💙'
);