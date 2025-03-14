-- Create enum for order status
CREATE TYPE order_status AS ENUM ('processing', 'production', 'completed', 'canceled');

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id) NOT NULL,
  salesman_id UUID REFERENCES profiles(user_id),
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_chart_id UUID REFERENCES price_charts(id),
  price_per_unit DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'processing',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Admins can manage all orders"
  ON orders
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Dealers can view own orders"
  ON orders FOR SELECT
  USING (dealer_id IN (
    SELECT id FROM dealers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Salesmen can view assigned orders"
  ON orders FOR SELECT
  USING (salesman_id = auth.uid());

-- Create trigger for orders updated_at
CREATE TRIGGER handle_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Function to automatically set salesman_id based on dealer
CREATE OR REPLACE FUNCTION set_order_salesman()
RETURNS TRIGGER AS $$
BEGIN
  -- Get salesman_id from dealer
  SELECT salesman_id INTO NEW.salesman_id
  FROM dealers
  WHERE id = NEW.dealer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set salesman_id before insert
CREATE TRIGGER set_order_salesman_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_salesman();

-- Function to calculate total price
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.price_per_unit;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate total price before insert or update
CREATE TRIGGER calculate_order_total_trigger
  BEFORE INSERT OR UPDATE OF quantity, price_per_unit ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total(); 