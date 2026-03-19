-- ============================================================
-- Migration 003: Auth Hooks & JWT Custom Claims
-- ============================================================

-- Called automatically after a user logs in via Supabase Auth Hook.
-- Injects mall_id and role into the JWT so RLS can use them cheaply
-- without a database query on every request.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims   JSONB;
  profile  user_profiles%ROWTYPE;
BEGIN
  -- Fetch the user profile
  SELECT * INTO profile
  FROM user_profiles
  WHERE id = (event ->> 'user_id')::UUID;

  -- If no profile, return event unchanged (handles race during signup)
  IF NOT FOUND THEN
    RETURN event;
  END IF;

  -- Inject custom claims into the JWT
  claims := event -> 'claims';
  claims := jsonb_set(claims, '{mall_id}', to_jsonb(profile.mall_id));
  claims := jsonb_set(claims, '{user_role}', to_jsonb(profile.role));
  claims := jsonb_set(claims, '{full_name}', to_jsonb(profile.full_name));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- ─── Auto-create user profile on signup ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if metadata was passed during signUp
  -- (e.g., signUp({ email, password, options: { data: { full_name, role, mall_id } } }))
  IF NEW.raw_user_meta_data IS NOT NULL AND (NEW.raw_user_meta_data ->> 'full_name') IS NOT NULL THEN
    INSERT INTO user_profiles (id, mall_id, full_name, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'mall_id')::UUID,
      NEW.raw_user_meta_data ->> 'full_name',
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'viewer')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Auto-create scoring_config for new malls ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_mall()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO scoring_config (mall_id) VALUES (NEW.id)
  ON CONFLICT (mall_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_mall_created
  AFTER INSERT ON malls
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_mall();
