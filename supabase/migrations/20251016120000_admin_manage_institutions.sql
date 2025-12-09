-- Functions to manage institutions through validated administrators
CREATE OR REPLACE FUNCTION public.admin_create_institution(
  p_admin_id uuid,
  p_name text,
  p_type text,
  p_contact_info text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS public.institutions AS $$
DECLARE
  new_institution public.institutions;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.administrators a WHERE a.id = p_admin_id) THEN
    RAISE EXCEPTION 'Administrador inválido';
  END IF;

  PERFORM set_config('app.allow_admin_institution_mutation', 'true', true);

  INSERT INTO public.institutions (name, type, contact_info, address, description)
  VALUES (p_name, p_type, p_contact_info, p_address, p_description)
  RETURNING * INTO new_institution;

  RETURN new_institution;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_update_institution(
  p_admin_id uuid,
  p_institution_id uuid,
  p_name text,
  p_type text,
  p_contact_info text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS public.institutions AS $$
DECLARE
  updated_institution public.institutions;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.administrators a WHERE a.id = p_admin_id) THEN
    RAISE EXCEPTION 'Administrador inválido';
  END IF;

  PERFORM set_config('app.allow_admin_institution_mutation', 'true', true);

  UPDATE public.institutions
  SET
    name = p_name,
    type = p_type,
    contact_info = p_contact_info,
    address = p_address,
    description = p_description,
    updated_at = NOW()
  WHERE id = p_institution_id
  RETURNING * INTO updated_institution;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Instituição não encontrada';
  END IF;

  RETURN updated_institution;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_delete_institution(
  p_admin_id uuid,
  p_institution_id uuid
) RETURNS public.institutions AS $$
DECLARE
  deleted_institution public.institutions;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.administrators a WHERE a.id = p_admin_id) THEN
    RAISE EXCEPTION 'Administrador inválido';
  END IF;

  PERFORM set_config('app.allow_admin_institution_mutation', 'true', true);

  DELETE FROM public.institutions
  WHERE id = p_institution_id
  RETURNING * INTO deleted_institution;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Instituição não encontrada';
  END IF;

  RETURN deleted_institution;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_create_institution(uuid, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_institution(uuid, uuid, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_institution(uuid, uuid) TO anon, authenticated;
