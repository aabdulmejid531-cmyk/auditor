-- Fix: Ensure profile row is created/upserted for existing users who may have missed the trigger,
-- and make the trigger more robust with an UPSERT so it never fails on conflict.

-- 1. Update the handle_new_user trigger function to use UPSERT and include all columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, firm_name, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'firm_name',
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    firm_name = COALESCE(EXCLUDED.firm_name, public.profiles.firm_name),
    phone     = COALESCE(EXCLUDED.phone,     public.profiles.phone),
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger exists (re-create safely)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Back-fill: create a profile row for any existing auth users who don't have one yet.
--    This repairs users who registered before the trigger was applied.
INSERT INTO public.profiles (id, full_name, firm_name, phone, created_at, updated_at)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'firm_name',
  u.raw_user_meta_data->>'phone',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
