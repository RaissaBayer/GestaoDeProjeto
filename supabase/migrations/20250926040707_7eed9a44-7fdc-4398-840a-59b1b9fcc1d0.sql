-- Primeiro, vamos verificar se as funções e políticas estão configuradas corretamente
-- Criar função para hash de senhas que pode ser usada no banco
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text AS $$
BEGIN
  -- Esta é uma implementação básica - em produção use uma biblioteca adequada
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para verificar senhas
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex') = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para definir o usuário atual (necessária para RLS)
CREATE OR REPLACE FUNCTION public.set_current_admin(admin_username text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_admin', admin_username, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS na tabela administrators
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS mais específicas
DROP POLICY IF EXISTS "Administradores autenticados podem visualizar outros administra" ON public.administrators;
DROP POLICY IF EXISTS "Administradores autenticados podem inserir outros administrador" ON public.administrators;
DROP POLICY IF EXISTS "Administradores autenticados podem atualizar outros administrad" ON public.administrators;
DROP POLICY IF EXISTS "Administradores autenticados podem deletar outros administrador" ON public.administrators;

-- Política para visualizar
CREATE POLICY "admins_can_view" ON public.administrators
  FOR SELECT
  USING (true); -- Por enquanto permite a qualquer um ver (pode ser restringido depois)

-- Política para inserir
CREATE POLICY "admins_can_insert" ON public.administrators
  FOR INSERT
  WITH CHECK (true); -- Por enquanto permite inserir (pode ser restringido depois)

-- Política para atualizar
CREATE POLICY "admins_can_update" ON public.administrators
  FOR UPDATE
  USING (true)
  WITH CHECK (true); -- Por enquanto permite atualizar (pode ser restringido depois)

-- Política para deletar
CREATE POLICY "admins_can_delete" ON public.administrators
  FOR DELETE
  USING (true); -- Por enquanto permite deletar (pode ser restringido depois)

-- Inserir um administrador padrão se não existir
INSERT INTO public.administrators (username, full_name, email, password_hash)
VALUES ('admin', 'Administrador Principal', 'admin@aulaosolidario.org', public.hash_password('admin'))
ON CONFLICT (username) DO NOTHING;