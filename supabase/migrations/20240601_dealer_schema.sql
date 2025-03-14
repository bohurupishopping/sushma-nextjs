-- Add display_name to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create dealers table
CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dealer_code TEXT UNIQUE NOT NULL,
  salesman_id UUID REFERENCES profiles(user_id),
  price_chart_code UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for dealers
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Create policies for dealers table
CREATE POLICY "Admins can view all dealers"
  ON dealers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Dealers can view own dealer info"
  ON dealers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert dealers"
  ON dealers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update dealers"
  ON dealers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

-- Create trigger for dealers updated_at
CREATE TRIGGER handle_dealers_updated_at BEFORE UPDATE ON dealers
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Function to generate a random dealer code
CREATE OR REPLACE FUNCTION generate_dealer_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    code := 'D-' || substring(md5(random()::text), 1, 6);
    
    -- Check if this code already exists
    SELECT EXISTS (
      SELECT 1 FROM dealers WHERE dealer_code = code
    ) INTO exists_already;
    
    -- Exit loop if we found a unique code
    EXIT WHEN NOT exists_already;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create dealer record when a user with dealer role is created
CREATE OR REPLACE FUNCTION public.handle_new_dealer()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new profile has a role of 'dealer', create a dealer record
  IF NEW.role = 'dealer' THEN
    INSERT INTO public.dealers (user_id, name, dealer_code)
    VALUES (
      NEW.user_id, 
      COALESCE(NEW.display_name, 'New Dealer'), 
      generate_dealer_code()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_dealer when a profile is created or updated
DROP TRIGGER IF EXISTS on_profile_dealer_created ON public.profiles;

CREATE TRIGGER on_profile_dealer_created
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'dealer')
  EXECUTE PROCEDURE public.handle_new_dealer();

-- Update the handle_new_user function to include display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, display_name)
  VALUES (
    NEW.id, 
    'user',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- No need to recreate the trigger as it already exists in the original migration 