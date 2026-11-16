CREATE DATABASE IF NOT EXISTS daliwans_builders
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE daliwans_builders;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customers_name (name),
  UNIQUE KEY uq_customers_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  sku VARCHAR(64) NULL,
  barcode VARCHAR(64) NULL,
  category VARCHAR(80) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 5,
  unit VARCHAR(24) NOT NULL DEFAULT 'pcs',
  image_url VARCHAR(500) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_sku (sku),
  UNIQUE KEY uq_products_barcode (barcode),
  KEY idx_products_category (category),
  KEY idx_products_active_stock (active, stock)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  receipt_number VARCHAR(32) NOT NULL,
  customer_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_receipt (receipt_number),
  KEY idx_sales_created_at (created_at),
  KEY idx_sales_customer (customer_id),
  KEY idx_sales_user (user_id),
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(160) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sale_items_sale (sale_id),
  KEY idx_sale_items_product (product_id),
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO products (name, sku, barcode, category, price, stock, low_stock_threshold, unit, image_url) VALUES
('Claw hammer, 16 oz', 'TOL-HAM-016', '4800001000011', 'Hand tools', 385.00, 24, 5, 'pcs', 'https://images.unsplash.com/photo-1581147036324-c1c89c2c8a93?auto=format&fit=crop&w=480&q=80'),
('Combination pliers, 8 in', 'TOL-PLI-008', '4800001000012', 'Hand tools', 245.00, 17, 5, 'pcs', 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=480&q=80'),
('Tape measure, 5 m', 'TOL-TAP-005', '4800001000013', 'Hand tools', 129.00, 31, 8, 'pcs', 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=480&q=80'),
('Cordless drill, 12 V', 'PWR-DRL-012', '4800001000014', 'Power tools', 2895.00, 7, 3, 'pcs', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=480&q=80'),
('LED bulb, 9 W daylight', 'ELE-BUL-009', '4800001000015', 'Electrical', 89.00, 48, 12, 'pcs', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=480&q=80'),
('PVC elbow, 1/2 in', 'PLU-ELB-012', '4800001000016', 'Plumbing', 18.00, 4, 10, 'pcs', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=480&q=80'),
('Wall paint, white 1 L', 'PNT-WHT-001', '4800001000017', 'Paint & supplies', 265.00, 13, 4, 'can', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=480&q=80'),
('Construction nails, 2 in (1 kg)', 'FST-NAI-002', '4800001000018', 'Nails & fasteners', 115.00, 36, 10, 'pack', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=480&q=80');
