-- Add status field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated'));

-- Update RLS policies to consider status
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((auth.uid() = user_id AND status = 'active') OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((auth.uid() = user_id AND status = 'active') OR public.is_admin());

-- Create function to check if a user is active
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
DECLARE
  is_active BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND status = 'active'
  ) INTO is_active;
  
  RETURN is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the profile with the default role 'user' and status 'active'
  INSERT INTO public.profiles (user_id, role, display_name, status)
  VALUES (
    NEW.id, 
    'user',
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'active'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for role-specific tables to consider status
DO $$
DECLARE
  is_admin_exists BOOLEAN;
BEGIN
  -- Check if is_admin function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO is_admin_exists;

  -- Only proceed if is_admin function exists
  IF is_admin_exists THEN
    -- Check if dealers table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dealers') THEN
      DROP POLICY IF EXISTS "Dealers can view own dealer info" ON dealers;
      CREATE POLICY "Dealers can view own dealer info"
        ON dealers FOR SELECT
        USING (user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.user_id = dealers.user_id 
          AND profiles.status = 'active'
        ));
    END IF;

    -- Check if workers table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workers') THEN
      DROP POLICY IF EXISTS "Workers can view own worker info" ON workers;
      CREATE POLICY "Workers can view own worker info"
        ON workers FOR SELECT
        USING (user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.user_id = workers.user_id 
          AND profiles.status = 'active'
        ));
    END IF;

    -- Check if salesmen table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salesmen') THEN
      DROP POLICY IF EXISTS "Salesmen can view own salesman info" ON salesmen;
      CREATE POLICY "Salesmen can view own salesman info"
        ON salesmen FOR SELECT
        USING (user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.user_id = salesmen.user_id 
          AND profiles.status = 'active'
        ));
    END IF;
  END IF;
END
$$; 