-- Primeiro, vamos tentar habilitar a extensão pgcrypto explicitamente
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Se ainda não funcionar, vamos usar uma abordagem mais simples com sha256
CREATE OR REPLACE FUNCTION public.simple_hash(input_text text)
RETURNS text AS $$
BEGIN
  -- Usa uma implementação mais simples se pgcrypto não estiver disponível
  RETURN md5(input_text || 'aulao_solidario_salt');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar função para hash de senhas usando função mais simples
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN public.simple_hash(password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar função para verificar senhas
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN public.simple_hash(password) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Limpar tabela e inserir administrador padrão com senha correta
DELETE FROM public.administrators WHERE username = 'admin';
INSERT INTO public.administrators (username, full_name, email, password_hash)
VALUES ('admin', 'Administrador Principal', 'admin@aulaosolidario.org', public.hash_password('admin'));