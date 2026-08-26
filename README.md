# DTT Project

Welcome to the DTT project! This document provides an overview of the project structure, setup instructions, and features.

## Project Structure

```
DTT
├── Public
│   ├── index.html          # Main entry point of the DTT website
│   ├── login.html          # User login page
│   ├── register.html       # User registration page
│   ├── products.html       # Page displaying available products
│   ├── categories.html      # Page showing product categories
│   ├── deals.html          # Page highlighting special deals
│   ├── order.html          # Page for viewing user orders
│   ├── DTT.css             # CSS styles for the website
│   └── DTT.js              # JavaScript for interactivity
├── supabase
│   └── schema.sql          # SQL schema for the database
├── .env.example             # Template for environment variables
└── README.md               # Project documentation
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd DTT
   ```

2. **Install Dependencies**
   Ensure you have the necessary dependencies installed. If using a package manager, run:
   ```bash
   npm install
   ```

3. **Connect Supabase Auth**
   Open `DTT.js` and replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with the project URL and publishable anon key from Supabase Project Settings > API. Never put the service role key in browser code.

4. **Database Setup**
   Run `supabase/schema.sql` in the Supabase SQL Editor. It creates the profile trigger, product catalog, product images, orders, order items, indexes, seed categories, and row-level security policies. Then run `supabase/seed.sql` to add the starter products and images. Run `supabase/delivery-migration.sql` to add Nigerian states and delivery fees. If you ran the original schema before checkout, admin, hero, or contact features were added, rerun `supabase/admin-migration.sql` and `supabase/checkout-policies.sql` once as well. New orders save the full delivery address, including phone and email. Older orders cannot display phone numbers because that information was not captured when they were created. Enable email confirmation in Supabase Auth settings if you want new users to verify their address.
   Run `supabase/product-content-migration.sql` once to add product variations, multiple image metadata, and verified-buyer reviews. A review can only be inserted when the current user has a delivered order containing that product.

   To enable the admin console, run `supabase/admin-migration.sql` (it is safe to rerun), create an account through `register.html`, then promote it by running the commented `update public.profiles` query at the bottom of that migration. Use a strong password you control. Open `admin.html` after promotion. The same migration adds currency, branding, coupon support, and Storage policies for logo/product uploads. If only the older migration was run, use `supabase/storage-policies.sql` for the upload fix.

5. **Run the Application**
   Open the root `index.html` file in your web browser to view the application.

## Features

- **User Authentication**: Users can log in and register for an account.
- **Product Display**: A grid layout showcasing available products with images and prices.
- **Category Navigation**: Easy access to different product categories.
- **Special Deals**: Highlighting current deals and discounts.
- **Order Management**: Users can view their order history and statuses.

## Usage Guidelines

- Ensure that all user inputs are validated on the client-side using the JavaScript functions in `DTT.js`.
- Style the website consistently using the styles defined in `DTT.css`.
- For any issues or feature requests, please open an issue in the repository.

Thank you for using DTT! We hope you enjoy shopping with us.