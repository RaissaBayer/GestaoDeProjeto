-- Corrigir warnings de segurança adicionando search_path às funções
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text AS $$
BEGIN
  -- Esta é uma implementação básica - em produção use uma biblioteca adequada
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex') = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_current_admin(admin_username text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_admin', admin_username, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;