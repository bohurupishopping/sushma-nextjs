-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  unit TEXT NOT NULL DEFAULT '50kg', -- Default unit size
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create price_chart table
CREATE TABLE IF NOT EXISTS price_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_chart_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create price_chart_items table for the many-to-many relationship
CREATE TABLE IF NOT EXISTS price_chart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_chart_id UUID REFERENCES price_charts(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  price_per_unit DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(price_chart_id, product_id) -- Each product can only appear once in a price chart
);

-- Create triggers for updated_at
CREATE TRIGGER handle_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER handle_price_charts_updated_at BEFORE UPDATE ON price_charts
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER handle_price_chart_items_updated_at BEFORE UPDATE ON price_chart_items
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Function to generate a random price chart code
CREATE OR REPLACE FUNCTION generate_price_chart_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    code := 'PC-' || substring(md5(random()::text), 1, 6);
    
    -- Check if this code already exists
    SELECT EXISTS (
      SELECT 1 FROM price_charts WHERE price_chart_code = code
    ) INTO exists_already;
    
    -- Exit loop if we found a unique code
    EXIT WHEN NOT exists_already;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_chart_items ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Admins can manage products"
  ON products
  USING (public.is_admin());

CREATE POLICY "All users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for price_charts table
CREATE POLICY "Admins can manage price charts"
  ON price_charts
  USING (public.is_admin());

CREATE POLICY "All users can view price charts"
  ON price_charts FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for price_chart_items table
CREATE POLICY "Admins can manage price chart items"
  ON price_chart_items
  USING (public.is_admin());

CREATE POLICY "All users can view price chart items"
  ON price_chart_items FOR SELECT
  TO authenticated
  USING (true);

-- Add price_chart_id to dealers table
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS price_chart_id UUID REFERENCES price_charts(id);

-- Insert some initial products
INSERT INTO products (name, category, description, unit)
VALUES 
  ('Sushma Gold', 'Premium', 'Premium quality cement', '50kg'),
  ('Sushma Gold', 'Premium', 'Premium quality cement - small bag', '10kg'),
  ('Sushma Ananya', 'Standard', 'Standard quality cement', '50kg'),
  ('Sushma Ananya', 'Standard', 'Standard quality cement - small bag', '10kg'),
  ('Sushma', 'Basic', 'Basic quality cement', '50kg'),
  ('Sushma', 'Basic', 'Basic quality cement - small bag', '10kg'),
  ('Sushma Samriddhi', 'Premium', 'Premium quality cement with additives', '50kg'),
  ('Sushma Samriddhi', 'Premium', 'Premium quality cement with additives - small bag', '10kg'),
  ('Sushma Sampurna', 'Standard', 'Standard quality cement with additives', '50kg'),
  ('Sushma Sampurna', 'Standard', 'Standard quality cement with additives - small bag', '10kg'),
  ('Sushma Subarna', 'Premium', 'Premium quality cement with special additives', '50kg'),
  ('Sushma Subarna', 'Premium', 'Premium quality cement with special additives - small bag', '10kg');

-- Create a default price chart
INSERT INTO price_charts (price_chart_code, name, description)
VALUES (generate_price_chart_code(), 'Default Price Chart', 'Default pricing for all products');

-- Get the ID of the default price chart
DO $$
DECLARE
  default_chart_id UUID;
BEGIN
  SELECT id INTO default_chart_id FROM price_charts WHERE name = 'Default Price Chart' LIMIT 1;
  
  -- Insert default prices for all products
  INSERT INTO price_chart_items (price_chart_id, product_id, price_per_unit, effective_date)
  SELECT 
    default_chart_id,
    id,
    CASE 
      WHEN unit = '50kg' THEN 350.00 + (random() * 100)::numeric(12,2)
      WHEN unit = '10kg' THEN 80.00 + (random() * 20)::numeric(12,2)
      ELSE 300.00
    END,
    CURRENT_DATE
  FROM products;
END $$;