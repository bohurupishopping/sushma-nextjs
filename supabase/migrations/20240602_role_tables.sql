-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  name TEXT NOT NULL,
  worker_code TEXT UNIQUE NOT NULL,
  department TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create salesmen table
CREATE TABLE IF NOT EXISTS salesmen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  name TEXT NOT NULL,
  salesman_code TEXT UNIQUE NOT NULL,
  region TEXT,
  target_amount DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for workers and salesmen
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesmen ENABLE ROW LEVEL SECURITY;

-- Create policies for workers table
CREATE POLICY "Admins can view all workers"
  ON workers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Workers can view own worker info"
  ON workers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert workers"
  ON workers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update workers"
  ON workers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

-- Create policies for salesmen table
CREATE POLICY "Admins can view all salesmen"
  ON salesmen FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Salesmen can view own salesman info"
  ON salesmen FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert salesmen"
  ON salesmen FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update salesmen"
  ON salesmen FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

-- Create triggers for updated_at
CREATE TRIGGER handle_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER handle_salesmen_updated_at BEFORE UPDATE ON salesmen
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Function to generate a random worker code
CREATE OR REPLACE FUNCTION generate_worker_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    code := 'W-' || substring(md5(random()::text), 1, 6);
    
    -- Check if this code already exists
    SELECT EXISTS (
      SELECT 1 FROM workers WHERE worker_code = code
    ) INTO exists_already;
    
    -- Exit loop if we found a unique code
    EXIT WHEN NOT exists_already;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a random salesman code
CREATE OR REPLACE FUNCTION generate_salesman_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    code := 'S-' || substring(md5(random()::text), 1, 6);
    
    -- Check if this code already exists
    SELECT EXISTS (
      SELECT 1 FROM salesmen WHERE salesman_code = code
    ) INTO exists_already;
    
    -- Exit loop if we found a unique code
    EXIT WHEN NOT exists_already;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create worker record when a user with worker role is created
CREATE OR REPLACE FUNCTION public.handle_new_worker()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new profile has a role of 'worker', create a worker record
  IF NEW.role = 'worker' THEN
    INSERT INTO public.workers (user_id, name, worker_code)
    VALUES (
      NEW.user_id, 
      COALESCE(NEW.display_name, 'New Worker'), 
      generate_worker_code()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create salesman record when a user with salesman role is created
CREATE OR REPLACE FUNCTION public.handle_new_salesman()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new profile has a role of 'salesman', create a salesman record
  IF NEW.role = 'salesman' THEN
    INSERT INTO public.salesmen (user_id, name, salesman_code)
    VALUES (
      NEW.user_id, 
      COALESCE(NEW.display_name, 'New Salesman'), 
      generate_salesman_code()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to call role-specific handlers when a profile is created or updated
DROP TRIGGER IF EXISTS on_profile_worker_created ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_salesman_created ON public.profiles;

CREATE TRIGGER on_profile_worker_created
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'worker')
  EXECUTE PROCEDURE public.handle_new_worker();

CREATE TRIGGER on_profile_salesman_created
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'salesman')
  EXECUTE PROCEDURE public.handle_new_salesman();

-- Update the handle_new_user function to use the role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role from user metadata if it exists, otherwise default to 'user'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Validate that the role is one of the allowed values
  IF user_role NOT IN ('user', 'admin', 'worker', 'dealer', 'salesman') THEN
    user_role := 'user';
  END IF;
  
  -- Insert the profile with the appropriate role
  INSERT INTO public.profiles (user_id, role, display_name)
  VALUES (
    NEW.id, 
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 