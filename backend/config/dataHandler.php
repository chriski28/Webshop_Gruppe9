<?php
require_once 'dbaccess.php';
require_once '../models/user.class.php';

class DataHandler
{
    public static function getUser($id)
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC); //man bekommt die Daten als assoziatives Array

        if (!$row) {
            return null;
        }

        $user = new User(
            (int) $row['user_id'],
            (bool) $row['is_admin'],
            $row['salutation'],
            $row['first_name'],
            $row['last_name'],
            $row['address'],
            $row['postal_code'],
            $row['city'],
            $row['email'],
            $row['username'],
            $row['password'],
            (bool) $row['active']
        );

        return $user;
    }
    public static function createUser(User $user): bool
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("
        INSERT INTO users 
        (is_admin, salutation, first_name, last_name, address, postal_code, city, email, username, password, active)
        VALUES 
        (:is_admin, :salutation, :first_name, :last_name, :address, :postal_code, :city, :email, :username, :password, :active)
    ");

        return $stmt->execute([
            'is_admin' => (int) $user->isAdmin(), //setzt den Platzhalter :is_admin im SQL-Statement mit dem tatsächlichen Wert von $is_admin
            'salutation' => $user->getSalutation(),
            'first_name' => $user->getFirstName(),
            'last_name' => $user->getLastName(),
            'address' => $user->getAddress(),
            'postal_code' => $user->getPostalCode(),
            'city' => $user->getCity(),
            'email' => $user->getEmail(),
            'username' => $user->getUsername(),
            'password' => $user->getPassword(),
            'active' =>  $user->isActive()
        ]);
    }

    public static function getAllUsers(): array
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->query("SELECT * FROM users");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $users = [];
        foreach ($rows as $row) {
            $user = new User(
                (int) $row['user_id'],
                (bool) $row['is_admin'],
                $row['salutation'],
                $row['first_name'],
                $row['last_name'],
                $row['address'],
                $row['postal_code'],
                $row['city'],
                $row['email'],
                $row['username'],
                $row['password'],
                (bool) $row['active']
            );
            $users[] = $user->toArray();
        }

        return $users;
    }

    public static function getUserByUsername(string $username): ?User
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return null;

        return new User(
            (int) $row['user_id'],
            (bool) $row['is_admin'],
            $row['salutation'],
            $row['first_name'],
            $row['last_name'],
            $row['address'],
            $row['postal_code'],
            $row['city'],
            $row['email'],
            $row['username'],
            $row['password'],
            (bool) $row['active']
        );
    }

    public static function getEbooks(?string $category = null): array
    {
        $pdo = DBAccess::connect();

        if ($category) {
            $stmt = $pdo->prepare("SELECT ebook_id, title, price, cover_image_path FROM ebooks WHERE category = :category");
            $stmt->execute(['category' => $category]);
        } else {
            $stmt = $pdo->query("SELECT ebook_id, title, price, cover_image_path FROM ebooks");
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $ebooks = [];

        foreach ($rows as $row) {
            $ebooks[] = [
                'id' => (int)$row['ebook_id'],
                'title' => $row['title'],
                'price' => (float)$row['price'],
                'image' => $row['cover_image_path']
            ];
        }

        return $ebooks;
    }

    public static function searchEbooks(string $searchTerm): array|string
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("SELECT ebook_id, title, price, cover_image_path FROM ebooks WHERE title LIKE :search");
        $stmt->execute(['search' => '%' . $searchTerm . '%']);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$rows) {
            return ['error' => 'Keine E-Books gefunden.'];
        }

        $ebooks = [];
        foreach ($rows as $row) {
            $ebooks[] = [
                'id' => (int)$row['ebook_id'],
                'title' => $row['title'],
                'price' => (float)$row['price'],
                'image' => $row['cover_image_path']
            ];
        }

        return $ebooks;
    }
    public static function addToCart(int $userId, int $ebookId, int $qty): void
    {
        $pdo = DBAccess::connect();
        // existierenden Warenkorb finden oder neu anlegen
        $stmt = $pdo->prepare("SELECT cart_id FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cartId = $stmt->fetchColumn();
        if (!$cartId) {
            $pdo->prepare("INSERT INTO carts(user_id, created_at) VALUES (?, NOW())")
                ->execute([$userId]);
            $cartId = $pdo->lastInsertId();
        }
        // upsert ins items-Table
        $stmt = $pdo->prepare("
            INSERT INTO items(ebook_id, quantity, cart_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        ");
        $stmt->execute([$ebookId, $qty, $cartId]);
    }

    public static function getCartItems(int $userId): array
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("
            SELECT i.ebook_id AS id, e.title, e.price, i.quantity
              FROM items i
              JOIN carts c ON i.cart_id = c.cart_id
              JOIN ebooks e ON i.ebook_id = e.ebook_id
             WHERE c.user_id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getCartCount(int $userId): int
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("
            SELECT SUM(i.quantity) 
              FROM items i
              JOIN carts c ON i.cart_id = c.cart_id
             WHERE c.user_id = ?
        ");
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }
    public static function updateCartItem(int $userId, int $ebookId, int $qty): void {
        $pdo = DBAccess::connect();
        // Warenkorb-ID laden
        $stmt = $pdo->prepare("SELECT cart_id FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cartId = $stmt->fetchColumn();
        if (!$cartId) return;
        if ($qty <= 0) {
            // löschen
            $pdo->prepare("DELETE FROM items WHERE cart_id = ? AND ebook_id = ?")
                ->execute([$cartId, $ebookId]);
        } else {
            // updaten
            $pdo->prepare("UPDATE items SET quantity = ? WHERE cart_id = ? AND ebook_id = ?")
                ->execute([$qty, $cartId, $ebookId]);
        }
    }
    
    public static function removeCartItem(int $userId, int $ebookId): void {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("SELECT cart_id FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cartId = $stmt->fetchColumn();
        if (!$cartId) return;
        $pdo->prepare("DELETE FROM items WHERE cart_id = ? AND ebook_id = ?")
            ->execute([$cartId, $ebookId]);
    }
    
}
