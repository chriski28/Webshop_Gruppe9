
<?php
header("Content-Type: application/json");
session_start();
require_once '../config/dataHandler.php';

// Read incoming JSON and decide what action to take based on the 'action' field
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['action'])) {
    echo json_encode(['error' => 'No action specified']);
    exit;
}

switch ($input['action']) {

    case 'getUser':
        if (isset($input['id'])) {
            $user = DataHandler::getUser($input['id']);

            if ($user === null) {
                echo json_encode(['error' => 'User not found']);
            } else {
                echo json_encode($user->toArray());
            }
        } else {
            echo json_encode(['error' => 'Missing user ID']);
        }
        break;

    case 'createUser':
        if (isset($input['first_name'], $input['last_name'], $input['address'], $input['postal_code'], $input['city'], $input['email'], $input['username'], $input['password'])) {
            $user = new User(
                0, // user_id (auto-increment, set to 0)
                false, // is_admin default false
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
        break;

        case 'getAllUsers':
            $users = DataHandler::getAllUsers();
            echo json_encode($users);
            break;
    
            case 'login':
                if (isset($input['username'], $input['password'])) {
                    $pdo = DBAccess::connect();
                    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
                    $stmt->execute(['username' => $input['username']]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
                    if ($user && password_verify($input['password'], $user['password'])) {
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
                break;
            
                case 'getSessionUser':
                    // Automatisches Login via Cookie
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
                    break;
                     
                    case 'loginWithToken':
                        if (!isset($input['token'])) {
                            echo json_encode(['success' => false, 'error' => 'Kein Token übergeben.']);
                            break;
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
                        break;

                        case 'logout':
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
                            break;
                        //shop
                        case 'getEbooks':
                            // Kategorie prüfen (wenn vorhanden)
                            $category = $input['category'] ?? null;
                        
                            $ebooks = DataHandler::getEbooks($category);
                            echo json_encode($ebooks);
                            break;
        
                        
                    
    
        default:
            echo json_encode(['error' => 'Unknown action']);
            break;
        }