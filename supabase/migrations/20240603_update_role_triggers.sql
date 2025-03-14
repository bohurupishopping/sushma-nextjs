-- Update triggers for role management to handle role changes
-- This migration ensures that when a user's role is changed, the appropriate role-specific records are created

-- First, drop existing triggers that might conflict
DROP TRIGGER IF EXISTS on_profile_dealer_created ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_worker_created ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_salesman_created ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_role_changed ON public.profiles;

-- Create a unified function to handle all role changes
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS TRIGGER AS $$
DECLARE
  old_role TEXT;
BEGIN
  -- Get the old role if this is an update
  IF TG_OP = 'UPDATE' THEN
    old_role := OLD.role;
  ELSE
    old_role := NULL;
  END IF;

  -- Only proceed if the role has changed or this is a new record
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role <> NEW.role) THEN
    -- Handle dealer role
    IF NEW.role = 'dealer' THEN
      -- Check if dealer record already exists
      IF NOT EXISTS (SELECT 1 FROM dealers WHERE user_id = NEW.user_id) THEN
        INSERT INTO public.dealers (user_id, name, dealer_code)
        VALUES (
          NEW.user_id, 
          COALESCE(NEW.display_name, 'New Dealer'), 
          generate_dealer_code()
        );
      END IF;
    END IF;

    -- Handle worker role
    IF NEW.role = 'worker' THEN
      -- Check if worker record already exists
      IF NOT EXISTS (SELECT 1 FROM workers WHERE user_id = NEW.user_id) THEN
        INSERT INTO public.workers (user_id, name, worker_code)
        VALUES (
          NEW.user_id, 
          COALESCE(NEW.display_name, 'New Worker'), 
          generate_worker_code()
        );
      END IF;
    END IF;

    -- Handle salesman role
    IF NEW.role = 'salesman' THEN
      -- Check if salesman record already exists
      IF NOT EXISTS (SELECT 1 FROM salesmen WHERE user_id = NEW.user_id) THEN
        INSERT INTO public.salesmen (user_id, name, salesman_code)
        VALUES (
          NEW.user_id, 
          COALESCE(NEW.display_name, 'New Salesman'), 
          generate_salesman_code()
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to use the display_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the profile with the default role 'user'
  INSERT INTO public.profiles (user_id, role, display_name)
  VALUES (
    NEW.id, 
    'user',
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is an admin
DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- First, disable RLS temporarily to avoid recursion issues
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
    -- Check if profiles table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
      -- Check if RLS is enabled
      IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND rowsecurity = true
      ) THEN
        -- Disable RLS temporarily
        ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies that might be causing recursion
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
        
        -- Re-enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create new policies with non-recursive checks
        CREATE POLICY "Users can view own profile"
          ON profiles FOR SELECT
          USING (auth.uid() = user_id OR public.is_admin());
        
        CREATE POLICY "Users can update own profile"
          ON profiles FOR UPDATE
          USING (auth.uid() = user_id OR public.is_admin());
        
        CREATE POLICY "Users can insert own profile"
          ON profiles FOR INSERT
          WITH CHECK (auth.uid() = user_id OR public.is_admin());
      ELSE
        -- RLS is not enabled, enable it and create policies
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create new policies with non-recursive checks
        CREATE POLICY "Users can view own profile"
          ON profiles FOR SELECT
          USING (auth.uid() = user_id OR public.is_admin());
        
        CREATE POLICY "Users can update own profile"
          ON profiles FOR UPDATE
          USING (auth.uid() = user_id OR public.is_admin());
        
        CREATE POLICY "Users can insert own profile"
          ON profiles FOR INSERT
          WITH CHECK (auth.uid() = user_id OR public.is_admin());
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'is_admin() function does not exist. Skipping policy creation.';
  END IF;
END
$$;

-- Create a single trigger that handles all role changes
DO $$
BEGIN
  -- Check if profiles table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- Create the trigger
    CREATE TRIGGER on_profile_role_changed
      AFTER INSERT OR UPDATE OF role ON public.profiles
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_role_change();
  END IF;
END
$$;

-- Update RLS policies for role-specific tables to use the is_admin function
-- Dealers table
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
      DROP POLICY IF EXISTS "Admins can view all dealers" ON dealers;
      CREATE POLICY "Admins can view all dealers"
        ON dealers FOR SELECT
        USING (public.is_admin());

      DROP POLICY IF EXISTS "Dealers can view own dealer info" ON dealers;
      CREATE POLICY "Dealers can view own dealer info"
        ON dealers FOR SELECT
        USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Admins can update dealers" ON dealers;
      CREATE POLICY "Admins can update dealers"
        ON dealers FOR UPDATE
        USING (public.is_admin());

      DROP POLICY IF EXISTS "Admins can insert dealers" ON dealers;
      CREATE POLICY "Admins can insert dealers"
        ON dealers FOR INSERT
        WITH CHECK (public.is_admin());
    END IF;

    -- Check if workers table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workers') THEN
      -- Workers table
      DROP POLICY IF EXISTS "Admins can view all workers" ON workers;
      CREATE POLICY "Admins can view all workers"
        ON workers FOR SELECT
        USING (public.is_admin());

      DROP POLICY IF EXISTS "Workers can view own worker info" ON workers;
      CREATE POLICY "Workers can view own worker info"
        ON workers FOR SELECT
        USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Admins can update workers" ON workers;
      CREATE POLICY "Admins can update workers"
        ON workers FOR UPDATE
        USING (public.is_admin());

      DROP POLICY IF EXISTS "Admins can insert workers" ON workers;
      CREATE POLICY "Admins can insert workers"
        ON workers FOR INSERT
        WITH CHECK (public.is_admin());
    END IF;

    -- Check if salesmen table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salesmen') THEN
      -- Salesmen table
      DROP POLICY IF EXISTS "Admins can view all salesmen" ON salesmen;
      CREATE POLICY "Admins can view all salesmen"
        ON salesmen FOR SELECT
        USING (public.is_admin());

      DROP POLICY IF EXISTS "Salesmen can view own salesman info" ON salesmen;
      CREATE POLICY "Salesmen can view own salesman info"
        ON salesmen FOR SELECT
        USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Admins can update salesmen" ON salesmen;
      CREATE POLICY "Admins can update salesmen"
        ON salesmen FOR UPDATE
        USING (public.is_admin());

      DROP POLICY IF EXISTS "Admins can insert salesmen" ON salesmen;
      CREATE POLICY "Admins can insert salesmen"
        ON salesmen FOR INSERT
        WITH CHECK (public.is_admin());
    END IF;
  ELSE
    RAISE NOTICE 'is_admin() function does not exist. Skipping policy creation for role-specific tables.';
  END IF;
END
$$; 