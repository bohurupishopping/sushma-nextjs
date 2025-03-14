-- Function to generate a custom order ID
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
  next_id INTEGER;
  order_id TEXT;
BEGIN
  -- Get the next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)), 0) + 1
  INTO next_id
  FROM orders;
  
  -- Format the order ID as SPOD followed by 5 digits
  order_id := 'SPOD' || LPAD(next_id::TEXT, 5, '0');
  
  RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- Create a temporary table to store existing orders
CREATE TABLE orders_temp AS SELECT * FROM orders;

-- Drop the existing orders table
DROP TABLE orders;

-- Recreate the orders table with the new ID format
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT generate_order_id(),
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

-- Recreate the trigger for updated_at
CREATE TRIGGER handle_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Recreate the trigger for salesman_id
CREATE TRIGGER set_order_salesman_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_salesman();

-- Recreate the trigger for total_price
CREATE TRIGGER calculate_order_total_trigger
  BEFORE INSERT OR UPDATE OF quantity, price_per_unit ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total();

-- Recreate RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

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

-- Migrate existing orders with new IDs
INSERT INTO orders (
  dealer_id,
  salesman_id,
  product_id,
  product_name,
  unit,
  quantity,
  price_chart_id,
  price_per_unit,
  total_price,
  status,
  notes,
  created_at,
  updated_at
)
SELECT 
  dealer_id,
  salesman_id,
  product_id,
  product_name,
  unit,
  quantity,
  price_chart_id,
  price_per_unit,
  total_price,
  status,
  notes,
  created_at,
  updated_at
FROM orders_temp;

-- Drop the temporary table
DROP TABLE orders_temp; 