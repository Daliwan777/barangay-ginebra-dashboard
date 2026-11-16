<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
startStoreSession();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function fail(string $message, int $status = 400): never
{
    respond(['error' => $message], $status);
}

function input(): array
{
    $data = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($data)) {
        fail('Invalid request body.');
    }
    return $data;
}

function requireUser(): array
{
    if (empty($_SESSION['user'])) {
        fail('Please sign in to continue.', 401);
    }
    return $_SESSION['user'];
}

function requireAdmin(): array
{
    $user = requireUser();
    if ($user['role'] !== 'admin') {
        fail('Administrator access is required.', 403);
    }
    return $user;
}

function verifyCsrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($_SESSION['csrf']) || !is_string($token) || !hash_equals($_SESSION['csrf'], $token)) {
        fail('Your session has expired. Refresh the page and try again.', 403);
    }
}

function requireMethod(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        header('Allow: ' . $method);
        fail('Method not allowed.', 405);
    }
}

function scalarText(mixed $value, int $maxLength, string $label, bool $required = true): ?string
{
    if (!is_string($value) && !is_numeric($value)) {
        if (!$required && ($value === null || $value === '')) {
            return null;
        }
        fail("$label is required.");
    }
    $value = trim((string)$value);
    if ($value === '' && !$required) {
        return null;
    }
    if ($value === '' || mb_strlen($value) > $maxLength) {
        fail("$label is required and must be no more than $maxLength characters.");
    }
    return $value;
}

function validDate(string $value): DateTimeImmutable
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    $errors = DateTimeImmutable::getLastErrors();
    if (!$date || ($errors && ($errors['warning_count'] || $errors['error_count'])) || $date->format('Y-m-d') !== $value) {
        fail('Choose a valid report date.');
    }
    return $date;
}

function saleRows(PDO $pdo, string $start, string $end, ?int $limit = null): array
{
    $limitClause = $limit === null ? '' : ' LIMIT ' . max(1, $limit);
    $statement = $pdo->prepare(
        'SELECT s.id, s.receipt_number, DATE_FORMAT(s.created_at, "%Y-%m-%d %H:%i") AS created_at,
                s.total, COALESCE(c.name, "Walk-in") AS customer_name, u.name AS staff_name,
                COALESCE(SUM(si.quantity), 0) AS item_count
         FROM sales s
         LEFT JOIN customers c ON c.id = s.customer_id
         JOIN users u ON u.id = s.user_id
         LEFT JOIN sale_items si ON si.sale_id = s.id
         WHERE s.created_at >= ? AND s.created_at < ?
         GROUP BY s.id, s.receipt_number, s.created_at, s.total, c.name, u.name
         ORDER BY s.created_at DESC' . $limitClause
    );
    $statement->execute([$start, $end]);
    return $statement->fetchAll();
}

try {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($action === 'session') {
        requireMethod('GET');
        respond(['user' => $_SESSION['user'] ?? null, 'csrf' => $_SESSION['csrf'] ?? null]);
    }

    if ($action === 'login') {
        requireMethod('POST');
        $data = input();
        $email = filter_var(trim((string)($data['email'] ?? '')), FILTER_VALIDATE_EMAIL);
        $password = $data['password'] ?? null;
        if (!$email || !is_string($password) || $password === '') {
            fail('Enter a valid email address and password.', 422);
        }
        $statement = database()->prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND active = 1 LIMIT 1');
        $statement->execute([$email]);
        $user = $statement->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            fail('Email or password is incorrect.', 401);
        }
        session_regenerate_id(true);
        $_SESSION['user'] = ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        respond(['user' => $_SESSION['user'], 'csrf' => $_SESSION['csrf']]);
    }

    if ($action === 'logout') {
        requireMethod('POST');
        requireUser();
        verifyCsrf();
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        respond(['ok' => true, 'csrf' => $_SESSION['csrf']]);
    }

    $user = requireUser();
    if ($method === 'POST') {
        verifyCsrf();
    }

    if ($action === 'products') {
        requireMethod('GET');
        $statement = database()->query('SELECT id, name, sku, barcode, category, price, stock, low_stock_threshold, unit, image_url FROM products WHERE active = 1 ORDER BY name');
        respond(['products' => $statement->fetchAll()]);
    }

    if ($action === 'save_product') {
        requireMethod('POST');
        requireAdmin();
        $data = input();
        $rawId = $data['id'] ?? null;
        $id = $rawId === null || $rawId === '' ? null : filter_var($rawId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($rawId !== null && $rawId !== '' && !$id) {
            fail('Choose a valid product.', 422);
        }
        $name = scalarText($data['name'] ?? null, 160, 'Product name');
        $sku = scalarText($data['sku'] ?? null, 64, 'SKU', false);
        $barcode = scalarText($data['barcode'] ?? null, 64, 'Barcode', false);
        $category = scalarText($data['category'] ?? null, 80, 'Category');
        $image = scalarText($data['image_url'] ?? null, 500, 'Image URL', false);
        if ($image !== null && !filter_var($image, FILTER_VALIDATE_URL)) {
            fail('Enter a valid product image URL.');
        }
        $price = filter_var($data['price'] ?? null, FILTER_VALIDATE_FLOAT);
        $stock = filter_var($data['stock'] ?? null, FILTER_VALIDATE_INT);
        $threshold = filter_var($data['low_stock_threshold'] ?? null, FILTER_VALIDATE_INT);
        if ($price === false || $price <= 0 || $price > 9999999999.99 || $stock === false || $stock < 0 || $threshold === false || $threshold < 0) {
            fail('Enter a valid positive price and non-negative stock quantities.');
        }
        $pdo = database();
        try {
            if ($id) {
                $statement = $pdo->prepare('UPDATE products SET name=?, sku=?, barcode=?, category=?, price=?, stock=?, low_stock_threshold=?, image_url=? WHERE id=? AND active=1');
                $statement->execute([$name, $sku, $barcode, $category, $price, $stock, $threshold, $image, $id]);
                if (!$statement->rowCount()) {
                    $check = $pdo->prepare('SELECT id FROM products WHERE id=? AND active=1');
                    $check->execute([$id]);
                    if (!$check->fetch()) {
                        fail('Product not found.', 404);
                    }
                }
            } else {
                $statement = $pdo->prepare('INSERT INTO products (name, sku, barcode, category, price, stock, low_stock_threshold, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $statement->execute([$name, $sku, $barcode, $category, $price, $stock, $threshold, $image]);
            }
            respond(['ok' => true]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                fail('That SKU or barcode is already assigned to another product.', 409);
            }
            throw $error;
        }
    }

    if ($action === 'delete_product') {
        requireMethod('POST');
        requireAdmin();
        $data = input();
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            fail('Choose a valid product.', 422);
        }
        $statement = database()->prepare('UPDATE products SET active=0 WHERE id=? AND active=1');
        $statement->execute([$id]);
        if (!$statement->rowCount()) {
            fail('Product not found.', 404);
        }
        respond(['ok' => true]);
    }

    if ($action === 'customers') {
        requireMethod('GET');
        $statement = database()->query(
            'SELECT c.id, c.name, c.phone, c.email, DATE_FORMAT(c.created_at, "%Y-%m-%d") AS created_at, COUNT(s.id) AS sales_count
             FROM customers c LEFT JOIN sales s ON s.customer_id=c.id
             WHERE c.active=1 GROUP BY c.id, c.name, c.phone, c.email, c.created_at ORDER BY c.name'
        );
        respond(['customers' => $statement->fetchAll()]);
    }

    if ($action === 'save_customer') {
        requireMethod('POST');
        $data = input();
        $rawId = $data['id'] ?? null;
        $id = $rawId === null || $rawId === '' ? null : filter_var($rawId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($rawId !== null && $rawId !== '' && !$id) {
            fail('Choose a valid customer.', 422);
        }
        $name = scalarText($data['name'] ?? null, 160, 'Customer name');
        $phone = scalarText($data['phone'] ?? null, 40, 'Phone', false);
        $email = scalarText($data['email'] ?? null, 190, 'Email', false);
        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail('Enter a valid customer email address.');
        }
        try {
            if ($id) {
                $statement = database()->prepare('UPDATE customers SET name=?, phone=?, email=? WHERE id=? AND active=1');
                $statement->execute([$name, $phone, $email, $id]);
                if (!$statement->rowCount()) {
                    $check = database()->prepare('SELECT id FROM customers WHERE id=? AND active=1');
                    $check->execute([$id]);
                    if (!$check->fetch()) {
                        fail('Customer not found.', 404);
                    }
                }
            } else {
                $statement = database()->prepare('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)');
                $statement->execute([$name, $phone, $email]);
            }
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                fail('A customer with that email address already exists.', 409);
            }
            throw $error;
        }
        respond(['ok' => true]);
    }

    if ($action === 'delete_customer') {
        requireMethod('POST');
        $data = input();
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            fail('Choose a valid customer.', 422);
        }
        $statement = database()->prepare('UPDATE customers SET active=0 WHERE id=? AND active=1');
        $statement->execute([$id]);
        if (!$statement->rowCount()) {
            fail('Customer not found.', 404);
        }
        respond(['ok' => true]);
    }

    if ($action === 'users') {
        requireMethod('GET');
        requireAdmin();
        $statement = database()->query('SELECT id, name, email, role, DATE_FORMAT(created_at, "%Y-%m-%d") AS created_at FROM users WHERE active=1 ORDER BY name');
        respond(['users' => $statement->fetchAll()]);
    }

    if ($action === 'create_user') {
        requireMethod('POST');
        requireAdmin();
        $data = input();
        $name = scalarText($data['name'] ?? null, 120, 'Name');
        $email = filter_var(trim((string)($data['email'] ?? '')), FILTER_VALIDATE_EMAIL);
        $password = $data['password'] ?? null;
        $role = $data['role'] ?? 'staff';
        if (!$email) {
            fail('Enter a valid email address.');
        }
        if (!is_string($password) || strlen($password) < 10 || strlen($password) > 200) {
            fail('Password must be between 10 and 200 characters.');
        }
        if (!in_array($role, ['admin', 'staff'], true)) {
            fail('Choose a valid team role.');
        }
        try {
            $statement = database()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
            $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                fail('An account with that email already exists.', 409);
            }
            throw $error;
        }
        respond(['ok' => true]);
    }

    if ($action === 'checkout') {
        requireMethod('POST');
        $data = input();
        $items = $data['items'] ?? null;
        if (!is_array($items) || count($items) < 1 || count($items) > 100) {
            fail('Add at least one product to the sale.');
        }
        $quantities = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                fail('Invalid product in the cart.');
            }
            $productId = filter_var($item['product_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 10000]]);
            if (!$productId || !$quantity) {
                fail('Invalid product quantity in the cart.');
            }
            $quantities[$productId] = ($quantities[$productId] ?? 0) + $quantity;
        }
        $customerId = null;
        if (isset($data['customer_id']) && $data['customer_id'] !== '') {
            $customerId = filter_var($data['customer_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if (!$customerId) {
                fail('Choose a valid customer.');
            }
        }

        $pdo = database();
        try {
            $pdo->beginTransaction();
            if ($customerId) {
                $check = $pdo->prepare('SELECT id FROM customers WHERE id=? AND active=1');
                $check->execute([$customerId]);
                if (!$check->fetch()) {
                    fail('Customer not found.', 404);
                }
            }
            $productQuery = $pdo->prepare('SELECT id, name, price, stock FROM products WHERE id=? AND active=1 FOR UPDATE');
            $saleItems = [];
            $total = 0.0;
            foreach ($quantities as $productId => $quantity) {
                $productQuery->execute([$productId]);
                $product = $productQuery->fetch();
                if (!$product) {
                    fail('A product in this sale is no longer available.', 409);
                }
                if ((int)$product['stock'] < $quantity) {
                    fail('Not enough stock for ' . $product['name'] . '. Refresh the products and adjust the quantity.', 409);
                }
                $lineTotal = round((float)$product['price'] * $quantity, 2);
                $total = round($total + $lineTotal, 2);
                $saleItems[] = ['product' => $product, 'quantity' => $quantity, 'line_total' => $lineTotal];
            }
            $receipt = 'DB-' . date('ymd-His') . '-' . strtoupper(bin2hex(random_bytes(2)));
            $statement = $pdo->prepare('INSERT INTO sales (receipt_number, customer_id, user_id, subtotal, total) VALUES (?, ?, ?, ?, ?)');
            $statement->execute([$receipt, $customerId, $user['id'], $total, $total]);
            $saleId = (int)$pdo->lastInsertId();
            $insertItem = $pdo->prepare('INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)');
            $updateStock = $pdo->prepare('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?');
            foreach ($saleItems as $line) {
                $product = $line['product'];
                $insertItem->execute([$saleId, $product['id'], $product['name'], $line['quantity'], $product['price'], $line['line_total']]);
                $updateStock->execute([$line['quantity'], $product['id'], $line['quantity']]);
                if (!$updateStock->rowCount()) {
                    fail('Stock changed during checkout. Refresh products and try again.', 409);
                }
            }
            $pdo->commit();
            $customerName = 'Walk-in';
            if ($customerId) {
                $check = $pdo->prepare('SELECT name FROM customers WHERE id=?');
                $check->execute([$customerId]);
                $customerName = (string)$check->fetchColumn();
            }
            respond(['sale' => [
                'receipt_number' => $receipt,
                'created_at' => date('Y-m-d H:i'),
                'total' => number_format($total, 2, '.', ''),
                'customer_name' => $customerName,
                'staff_name' => $user['name'],
                'items' => array_map(static fn(array $line): array => [
                    'name' => $line['product']['name'],
                    'quantity' => $line['quantity'],
                    'price' => $line['product']['price'],
                ], $saleItems),
            ]]);
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }

    if ($action === 'dashboard') {
        requireMethod('GET');
        $pdo = database();
        $today = date('Y-m-d');
        $tomorrow = date('Y-m-d', strtotime($today . ' +1 day'));
        $monthStart = date('Y-m-01');
        $monthEnd = date('Y-m-01', strtotime($monthStart . ' +1 month'));
        $yearStart = date('Y-01-01');
        $yearEnd = date('Y-01-01', strtotime($yearStart . ' +1 year'));
        $summary = static function (PDO $pdo, string $start, string $end): array {
            $statement = $pdo->prepare('SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS total FROM sales WHERE created_at>=? AND created_at<?');
            $statement->execute([$start, $end]);
            return $statement->fetch();
        };
        $weekStart = date('Y-m-d', strtotime($today . ' -6 days'));
        $weekStatement = $pdo->prepare('SELECT DATE(created_at) AS sale_date, SUM(total) AS total FROM sales WHERE created_at>=? AND created_at<? GROUP BY DATE(created_at)');
        $weekStatement->execute([$weekStart, $tomorrow]);
        $weekMap = [];
        foreach ($weekStatement->fetchAll() as $row) {
            $weekMap[$row['sale_date']] = (float)$row['total'];
        }
        $labels = $values = [];
        for ($offset = 0; $offset < 7; $offset++) {
            $date = date('Y-m-d', strtotime($weekStart . " +$offset days"));
            $labels[] = date('D', strtotime($date));
            $values[] = $weekMap[$date] ?? 0;
        }
        $lowStock = $pdo->query('SELECT id, name, category, stock, low_stock_threshold, image_url FROM products WHERE active=1 AND stock<=low_stock_threshold ORDER BY stock, name LIMIT 8')->fetchAll();
        $recent = saleRows($pdo, '1000-01-01', date('Y-m-d H:i:s', strtotime('+1 day')), 6);
        $count = $pdo->query('SELECT COUNT(*) FROM products WHERE active=1')->fetchColumn();
        respond([
            'today' => $summary($pdo, $today, $tomorrow),
            'month' => $summary($pdo, $monthStart, $monthEnd),
            'year' => $summary($pdo, $yearStart, $yearEnd),
            'product_count' => (int)$count,
            'low_stock' => $lowStock,
            'recent_sales' => $recent,
            'week' => ['labels' => $labels, 'values' => $values, 'total' => array_sum($values)],
        ]);
    }

    if ($action === 'reports') {
        requireMethod('GET');
        $period = $_GET['period'] ?? 'day';
        if (!in_array($period, ['day', 'month', 'year'], true)) {
            fail('Choose a valid report period.');
        }
        $date = validDate((string)($_GET['date'] ?? date('Y-m-d')));
        if ($period === 'day') {
            $start = $date->format('Y-m-d');
            $end = $date->modify('+1 day')->format('Y-m-d');
            $rangeLabel = $date->format('F j, Y');
            $labels = array_map(static fn(int $hour): string => sprintf('%02d:00', $hour), range(0, 23));
            $groupExpr = 'HOUR(created_at)';
            $bucketCount = 24;
        } elseif ($period === 'month') {
            $first = $date->modify('first day of this month');
            $start = $first->format('Y-m-d');
            $end = $first->modify('first day of next month')->format('Y-m-d');
            $rangeLabel = $date->format('F Y');
            $bucketCount = (int)$first->format('t');
            $labels = array_map(static fn(int $day): string => (string)$day, range(1, $bucketCount));
            $groupExpr = 'DAY(created_at)';
        } else {
            $start = $date->format('Y-01-01');
            $end = $date->modify('first day of January next year')->format('Y-m-d');
            $rangeLabel = $date->format('Y');
            $bucketCount = 12;
            $labels = array_map(static fn(int $month): string => date('M', mktime(0, 0, 0, $month, 1)), range(1, 12));
            $groupExpr = 'MONTH(created_at)';
        }
        $pdo = database();
        $summaryStatement = $pdo->prepare(
            'SELECT COUNT(*) AS count, COALESCE(SUM(s.total),0) AS total,
                    (SELECT COALESCE(SUM(si.quantity),0) FROM sale_items si JOIN sales item_sales ON item_sales.id=si.sale_id
                     WHERE item_sales.created_at>=? AND item_sales.created_at<?) AS items
             FROM sales s WHERE s.created_at>=? AND s.created_at<?'
        );
        $summaryStatement->execute([$start, $end, $start, $end]);
        $summary = $summaryStatement->fetch();
        $summary['average'] = (int)$summary['count'] ? (float)$summary['total'] / (int)$summary['count'] : 0;
        $sales = saleRows($pdo, $start, $end);
        $bucketStatement = $pdo->prepare("SELECT $groupExpr AS bucket, SUM(total) AS total FROM sales WHERE created_at>=? AND created_at<? GROUP BY bucket");
        $bucketStatement->execute([$start, $end]);
        $buckets = array_fill(1, $bucketCount, 0);
        foreach ($bucketStatement->fetchAll() as $row) {
            $buckets[(int)$row['bucket']] = (float)$row['total'];
        }
        respond(['summary' => $summary, 'sales' => $sales, 'range_label' => $rangeLabel, 'chart' => ['labels' => $labels, 'values' => array_values($buckets)]]);
    }

    fail('Unknown action.', 404);
} catch (Throwable $error) {
    error_log('Store API error: ' . $error->getMessage());
    fail('The store server could not complete the request. Check the database configuration and try again.', 500);
}
