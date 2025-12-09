-- Criar funções RPC para gerenciamento de instituições por administradores

-- Função para criar instituição
CREATE OR REPLACE FUNCTION public.admin_create_institution(
  p_admin_id UUID,
  p_name TEXT,
  p_type TEXT,
  p_contact_info TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_institution_id UUID;
  v_admin_username TEXT;
BEGIN
  -- Verificar se o admin existe
  SELECT username INTO v_admin_username
  FROM administrators
  WHERE id = p_admin_id;

  IF v_admin_username IS NULL THEN
    RAISE EXCEPTION 'Administrador não encontrado';
  END IF;

  -- Definir o administrador atual
  PERFORM set_config('app.current_admin', v_admin_username, false);

  -- Criar instituição
  INSERT INTO institutions (name, type, contact_info, address, description)
  VALUES (p_name, p_type, p_contact_info, p_address, p_description)
  RETURNING id INTO v_institution_id;

  RETURN v_institution_id;
END;
$$;

-- Função para atualizar instituição
CREATE OR REPLACE FUNCTION public.admin_update_institution(
  p_admin_id UUID,
  p_institution_id UUID,
  p_name TEXT,
  p_type TEXT,
  p_contact_info TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_username TEXT;
BEGIN
  -- Verificar se o admin existe
  SELECT username INTO v_admin_username
  FROM administrators
  WHERE id = p_admin_id;

  IF v_admin_username IS NULL THEN
    RAISE EXCEPTION 'Administrador não encontrado';
  END IF;

  -- Definir o administrador atual
  PERFORM set_config('app.current_admin', v_admin_username, false);

  -- Atualizar instituição
  UPDATE institutions
  SET 
    name = p_name,
    type = p_type,
    contact_info = p_contact_info,
    address = p_address,
    description = p_description,
    updated_at = now()
  WHERE id = p_institution_id;
END;
$$;

-- Função para excluir instituição
CREATE OR REPLACE FUNCTION public.admin_delete_institution(
  p_admin_id UUID,
  p_institution_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_username TEXT;
BEGIN
  -- Verificar se o admin existe
  SELECT username INTO v_admin_username
  FROM administrators
  WHERE id = p_admin_id;

  IF v_admin_username IS NULL THEN
    RAISE EXCEPTION 'Administrador não encontrado';
  END IF;

  -- Definir o administrador atual
  PERFORM set_config('app.current_admin', v_admin_username, false);

  -- Excluir instituição
  DELETE FROM institutions WHERE id = p_institution_id;
END;
$$;