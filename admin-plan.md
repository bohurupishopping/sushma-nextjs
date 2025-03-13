Admin Panel (Next.js) – Detailed Plan
The Admin Panel is the backend and management interface of the system. It allows the admin to manage orders, dealers, pricing, salespersons, and banking transactions.

🔹 Key Features & Functionalities
✅ Comprehensive Order Management (Status updates, tracking, edits)
✅ Dealer-Specific Pricing (Each dealer sees their assigned product prices)
✅ Real-time Payment Tracking (Remaining balance, paid transactions)
✅ Role-Based Data Access (Dealers & salespersons have restricted access)
✅ Automated Status Workflow (Orders move through statuses automatically)
✅ Search & Filters (Find orders, dealers, and transactions quickly)
✅ Notifications & Logs (Track order updates, payments, and assignments)
✅ Supabase as Database & Authentication

Login & Signup Page - Plan
🔹 Purpose:
Handle user authentication securely.
Auto-assign new users as Dealers in the database.
Allow only existing users to log in.
📌 Page Details
1️⃣ Login Page
🔹 Fields:
✅ Email
✅ Password

🔹 Flow:

User enters credentials.
System verifies email & password from Supabase Auth.
If valid, redirect to dashboard based on role:
Admin → Admin Panel
Salesperson → Salesperson Dashboard
Dealer → Dealer Dashboard
📌 DB Tables Used: Users

2️⃣ Signup Page
🔹 Fields:
✅ Full Name
✅ Email
✅ Password

🔹 Flow:

User enters details and submits.
Supabase Auth creates a new user.
System automatically assigns role as Dealer.
Inserts user into Dealers table with generated Dealer Code.
Redirects to Dealer Dashboard.
📌 DB Tables Used:

Users (id, email, role)
Dealers (id, name, email, dealer_code, assigned_salesperson_id)

📌 Pages & Features
1️⃣ Admin Dashboard (Overview Page)
🔹 Purpose: Provides a real-time summary of system data.
🔹 Key Features:
✔ Total Orders Count (Processing, Production, Completed, Canceled)
✔ Total Dealers Count
✔ Pending Payments Summary (Total Due Amount, Dealers with Outstanding Balance)
✔ Salespersons Overview (Number of Assigned Dealers)
✔ Quick Action Buttons (Add Dealer, Update Prices, View Reports)
✔ Graphical Reports: Monthly Sales, Orders by Status, Top Dealers

📌 DB Tables Used: Orders, Dealers, Banking, Salespersons

2️⃣ Orders Management
🔹 Purpose: Manage dealer orders efficiently.
🔹 Key Features:
✔ View all orders placed by dealers.
✔ Filters: Search by dealer name, order status, date range.
✔ Order Details View: Lists ordered products, quantities, total price.
✔ Status Control: Update order status (Processing → Production → Completed).
✔ Cancel/Delete Orders: Only possible in Processing stage.
✔ Payment Status: Paid / Due / Partially Paid.
✔ View Dealer Payment History.
✔ Export Orders Data (Excel/PDF).

📌 DB Tables Used: Orders, Dealers, Banking

3️⃣ Dealers Management
🔹 Purpose: Create, view, and manage dealers.
🔹 Key Features:
✔ View all dealers in a table with filters.
✔ Dealer Profile Details: Name, Contact, Address, Assigned Salesperson, Price Chart Code.
✔ Assign Salesperson to Dealer.
✔ Dealer Order & Payment History.
✔ Deactivate Dealer Option (Soft Delete).
✔ Export Dealer List (Excel/PDF).

📌 DB Tables Used: Dealers, Salespersons, Price Chart, Banking

4️⃣ Price Chart Management
🔹 Purpose: Manage product pricing per dealer.
🔹 Key Features:
✔ Dealer-Specific Pricing: Each dealer has a custom price list.
✔ Bulk Price Updates.
✔ Product Price History (Log of Price Changes).
✔ Search & Filter by Dealer or Product.
✔ Export Price Chart Data.

📌 DB Tables Used: Price Chart, Dealers, Products

5️⃣ Banking & Transactions
🔹 Purpose: Maintain payment transactions and outstanding balances.
🔹 Key Features:
✔ View all transactions with amount, date, dealer, and status.
✔ Add Manual Payment Entries.
✔ Track Remaining Due Amounts per Dealer.
✔ Filter Transactions by Dealer, Date Range, Payment Status.
✔ Export Transaction Reports.

📌 DB Tables Used: Banking, Dealers

6️⃣ Salespersons Management
🔹 Purpose: Manage sales representatives and their assigned dealers.
🔹 Key Features:
✔ View all salespersons with assigned dealers.
✔ Assign dealers to salespersons.
✔ View dealer orders assigned to salespersons.
✔ Filter by Salesperson Name, Dealer Count.
✔ Export Salesperson Data.

📌 DB Tables Used: Salespersons, Dealers

7️⃣ Reports & Analytics
🔹 Purpose: Generate business insights using data analytics.
🔹 Key Features:
✔ Total Revenue Reports (Monthly, Yearly).
✔ Order Status Reports (Processing, Completed, Canceled).
✔ Top Dealers (Highest Order Value).
✔ Pending Payment Reports.
✔ Download Reports in PDF/Excel.

📌 DB Tables Used: Orders, Dealers, Banking