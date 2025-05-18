<?php
function getUser()
{
    if (isset($_SESSION['user_id'])) {
        $user = DataHandler::getUser($_SESSION['user_id']);
        if ($user === null) {
            echo json_encode(['error' => 'User not found']);
        } else {
            echo json_encode($user->toArray());
        }
    } else {
        echo json_encode(['error' => 'Not logged in']);
    }
}

function getAllUsers()
{
    $users = DataHandler::getAllUsers();
    echo json_encode($users);
}

function createUser($input)
{
    if (isset(
        $input['salutation'],
        $input['first_name'],
        $input['last_name'],
        $input['address'],
        $input['postal_code'],
        $input['city'],
        $input['email'],
        $input['username'],
        $input['password']
    )) {
        $user = new User(
            0, // user_id (auto-increment, set to 0)
            false, // is_admin default false
            $input['salutation'],
            $input['first_name'],
            $input['last_name'],
            $input['address'],
            $input['postal_code'],
            $input['city'],
            $input['email'],
            $input['username'],
            password_hash($input['password'], PASSWORD_DEFAULT),
            true // active (default true)
        );

        $success = DataHandler::createUser($user);

        echo json_encode(['success' => $success]);
    } else {
        echo json_encode(['error' => 'Missing user data']);
    }
}

function login($input)
{
    if (isset($input['username'], $input['password'])) {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
        $stmt->execute(['username' => $input['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($input['password'], $user['password'])) {
            if (!$user['active']) {
                echo json_encode(['success' => false, 'error' => 'Account ist deaktiviert.']);
            }
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['is_admin'] = $user['is_admin'];
            $_SESSION['active'] = $user['active'];


            // === NEU: Cookie setzen, wenn rememberMe aktiv ===
            $rememberToken = null;
            if (!empty($input['rememberMe'])) {
                $rememberToken = bin2hex(random_bytes(32)); // sicheres Token
                $stmt = $pdo->prepare("UPDATE users SET remember_token = :token WHERE user_id = :id");
                $stmt->execute(['token' => $rememberToken, 'id' => $user['user_id']]);
            }

            echo json_encode(['success' => true, 'remember_token' => $rememberToken]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Benutzername oder Passwort ist falsch!']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Benutzername oder Passwort fehlt.']);
    }
}

function loginWithToken($input)
{
    if (!isset($input['token'])) {
        echo json_encode(['success' => false, 'error' => 'Kein Token übergeben.']);
        return;
    }

    $pdo = DBAccess::connect();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
    $stmt->execute(['token' => $input['token']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_admin'] = $user['is_admin'];
        $_SESSION['active'] = $user['active'];

        echo json_encode([
            'success' => true,
            'username' => $user['username'],
            'is_admin' => $user['is_admin']
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Ungültiger Token.']);
    }
}

function getSessionUser()
{
    if (!isset($_SESSION['user_id']) && isset($_COOKIE['remember_token'])) {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $_COOKIE['remember_token']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['is_admin'] = $user['is_admin'];
            $_SESSION['active'] = $user['active'];
        } else {
            setcookie('remember_token', '', time() - 3600, '/');
        }
    }

    // Rückgabe der Session-Info
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'username' => $_SESSION['username'],
            'is_admin' => $_SESSION['is_admin'],
            'active' => $_SESSION['active']
        ]);
    } else {
        echo json_encode(['username' => null]);
    }
}

function logout()
{
    session_unset();
    session_destroy();

    // Optionale: Cookie aus Datenbank entfernen
    if (isset($_COOKIE['remember_token'])) {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("UPDATE users SET remember_token = NULL WHERE remember_token = :token");
        $stmt->execute(['token' => $_COOKIE['remember_token']]);
    }

    // Cookie löschen (wird im Frontend auch gelöscht, zur Sicherheit hier nochmal)
    setcookie('remember_token', '', time() - 3600, '/');

    echo json_encode(['success' => true]);
}

function updateUser($input)
{
    if (isset($input['salutation'], $input['first_name'], $input['last_name'], $input['address'], $input['postal_code'], $input['city'], $input['email'], $input['currentPassword'])) {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Not logged in']);
            return;
        }

        $user = new User(
            $_SESSION['user_id'],
            false, // is_admin bleibt wie es ist
            $input['salutation'],
            $input['first_name'],
            $input['last_name'],
            $input['address'],
            $input['postal_code'],
            $input['city'],
            $input['email'],
            '', // username und password ändern wir hier NICHT
            '',
            true // active bleibt true
        );

        $success = DataHandler::updateUser($user, $input['currentPassword']);
        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Falsches Passwort oder Fehler beim Aktualisieren.']);
        }
    } else {
        echo json_encode(['error' => 'Fehlende Felder']);
    }
}

function toggleUserActive($input)
{
    if (!isset($input['user_id'], $input['active'])) {
        echo json_encode(['error' => 'Fehlende Parameter']);
        return;
    }
    DataHandler::toggleUserActive((int)$input['user_id'], (bool)$input['active']);
    echo json_encode(['success' => true]);
}
