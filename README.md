# Daliwan's Builders — Store Management System

A responsive hardware store management website with a PHP 8.1+ and MySQL/MariaDB backend. It includes a sales dashboard, product and stock management, barcode-assisted checkout, customer records, role-based sign-in, daily/monthly/yearly reports, printable receipts, report printing/PDF export, and a saved light/dark theme.

## Requirements

- PHP 8.1 or later with the `PDO`, `pdo_mysql`, and `mbstring` extensions
- MySQL 8+ or MariaDB 10.5+
- A PHP-capable web server (Apache, Nginx with PHP-FPM, or PHP's development server)
- Internet access for the bundled Chart.js, Google Fonts, and sample product photos (the store functions without the chart or remote fonts)

## Install

1. Create a database and sample inventory by importing `schema.sql`:

   ```sh
   mysql -u root -p < schema.sql
   ```

   The SQL creates and uses the `daliwans_builders` database. It seeds a small editable sample catalog; replace its products and prices with your actual store inventory.

2. Configure database access. `config.php` reads these environment variables and uses local development defaults (`127.0.0.1:3306`, database `daliwans_builders`, user `root`, empty password) when unset:

   ```text
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=daliwans_builders
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   ```

   Set environment variables in the PHP/web-server environment. Do not put production credentials in source control.

3. From the project directory, start PHP's local server:

   ```sh
   php -S 127.0.0.1:8000
   ```

   Open `http://127.0.0.1:8000` (or `index.html` through your configured web server). API requests require PHP; opening the HTML directly as a `file://` URL will not connect to the database.

4. Visit `http://127.0.0.1:8000/setup.php` once and create the first administrator account. The setup page only creates an admin when the users table is empty; it will refuse to create additional accounts after initial setup.

5. Sign in, review the sample stock, and add staff accounts from **Team access**. Use **Inventory** to add products and enter each product's SKU or barcode; a USB/Bluetooth scanner that types a code followed by Enter works in the POS search field.

## Features

- **Dashboard:** today's, month-to-date, and year-to-date income in PHP; seven-day sales chart; recent transactions and low-stock alerts.
- **Inventory:** admin-only product create, edit, and archive; SKU/barcode values; categories, images, prices, on-hand quantities, and configurable low-stock thresholds.
- **Point of sale:** product search and category filters, barcode/SKU scan-to-add, customer selection, quantity controls, server-validated checkout, transactional stock deduction, and a printable receipt.
- **Reports:** filter daily, monthly, or yearly sales; view totals, transaction/item counts, average sale, chart and transaction detail; **Export / Print** opens the browser print dialog, where **Save as PDF** can be selected.
- **Customers and access:** customer create/edit/archive, walk-in checkout, and administrator/staff sign-in with role-gated product and team administration.
- **Appearance:** responsive layout with a persistent dark-mode preference.

## Notes for deployment

- Use HTTPS, least-privilege database credentials, and strong unique passwords. Configure `DB_*` as server environment variables rather than committing credentials.
- `setup.php` is one-time account setup, not an account-recovery tool. Restrict or remove access to it after installing the first admin.
- Product and sales records are stored in MySQL. Products and customers are archived rather than deleted so existing sale history remains intact; receipt line items preserve the product name and price at the time of sale.
- Checkout recalculates totals and locks stock rows on the server inside a database transaction. Never rely on browser-calculated prices for accounting.
- Barcode reading uses ordinary keyboard-emulating scanners. Image links in the seeded catalog are illustrative and can be replaced with store-owned product photos.
- No payment processor or tax calculation is configured. This POS records an in-store sale and its total; adapt it to local tax and receipt requirements before production use.

## Database

`schema.sql` defines users, customers, products, sales, and sale items, with indexes, unique SKU/barcode constraints, and foreign keys. It also inserts a sample hardware catalog. Each checkout stores item name and unit-price snapshots; product stock changes and sale records commit together.
