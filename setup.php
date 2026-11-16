<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
startStoreSession();

try {
    $count = (int)database()->query('SELECT COUNT(*) FROM users')->fetchColumn();
} catch (Throwable $error) {
    http_response_code(503);
    exit('The database is not ready. Follow the database setup steps in README.md, then reload this page.');
}

$message = '';
$complete = $count > 0;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$complete) {
    $token = $_POST['csrf'] ?? '';
    if (!is_string($token) || empty($_SESSION['setup_csrf']) || !hash_equals($_SESSION['setup_csrf'], $token)) {
        $message = 'The setup session expired. Reload this page and try again.';
    } else {
        $name = trim((string)($_POST['name'] ?? ''));
        $email = filter_var(trim((string)($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';
        if ($name === '' || mb_strlen($name) > 120 || !$email || !is_string($password) || strlen($password) < 12 || strlen($password) > 200) {
            $message = 'Enter a name, valid email, and a password of at least 12 characters.';
        } else {
            try {
                $statement = database()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")');
                $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
                $complete = true;
                $_SESSION['setup_csrf'] = '';
            } catch (Throwable $error) {
                error_log('Store setup error: ' . $error->getMessage());
                $message = 'The admin account could not be created. Check the server logs and try again.';
            }
        }
    }
}
if (!$complete && empty($_SESSION['setup_csrf'])) {
    $_SESSION['setup_csrf'] = bin2hex(random_bytes(32));
}
$csrf = htmlspecialchars($_SESSION['setup_csrf'] ?? '', ENT_QUOTES, 'UTF-8');
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Set up Daliwan's Builders</title><link rel="stylesheet" href="styles.css"></head>
<body><main class="setup-page"><form method="post" class="dialog setup-card">
  <div class="login-brand"><span class="brand-icon"><svg viewBox="0 0 32 32"><path d="M5 25V9l11-5 11 5v16H5Z"/><path d="M11 25v-9h10v9M4 13l12 6 12-6M16 19v6"/></svg></span><span><strong>DALIWAN'S</strong><small>BUILDERS SUPPLY</small></span></div>
  <p class="eyebrow">ONE-TIME SETUP</p>
  <?php if ($complete): ?>
    <h1>Setup complete</h1><p class="muted">An administrator account already exists. For safety, this setup page cannot create another one.</p><a class="button button-primary full-button" href="index.html">Open the store system →</a>
  <?php else: ?>
    <h1>Create your admin account</h1><p class="muted setup-intro">This first account will manage products, reports, and team access.</p>
    <?php if ($message !== ''): ?><p class="form-error"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
    <input type="hidden" name="csrf" value="<?= $csrf ?>">
    <label class="field-label">FULL NAME<input name="name" required maxlength="120" autocomplete="name"></label>
    <label class="field-label">EMAIL ADDRESS<input name="email" type="email" required maxlength="190" autocomplete="email"></label>
    <label class="field-label">PASSWORD<input name="password" type="password" required minlength="12" maxlength="200" autocomplete="new-password"><small>Use at least 12 characters. Choose a unique password.</small></label>
    <button class="button button-primary full-button" type="submit">Create admin account →</button>
    <p class="setup-warning">After setup, restrict or remove access to this page on your production server.</p>
  <?php endif; ?>
</form></main></body></html>
