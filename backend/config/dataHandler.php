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
    public static function updateCartItem(int $userId, int $ebookId, int $qty): void
    {
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

    public static function removeCartItem(int $userId, int $ebookId): void
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("SELECT cart_id FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cartId = $stmt->fetchColumn();
        if (!$cartId) return;
        $pdo->prepare("DELETE FROM items WHERE cart_id = ? AND ebook_id = ?")
            ->execute([$cartId, $ebookId]);
    }


    public static function updateUser(User $user, string $currentPassword): bool
    {
        $pdo = DBAccess::connect();

        // Aktuelles Passwort prüfen
        $stmt = $pdo->prepare("SELECT password FROM users WHERE user_id = ?");
        $stmt->execute([$user->getUserId()]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !password_verify($currentPassword, $row['password'])) {
            return false; // Passwort falsch
        }

        // Stammdaten aktualisieren (username und password bleiben gleich)
        $stmt = $pdo->prepare("
            UPDATE users 
               SET salutation = :salutation,
                   first_name = :first_name,
                   last_name = :last_name,
                   address = :address,
                   postal_code = :postal_code,
                   city = :city,
                   email = :email
             WHERE user_id = :user_id
        ");

        return $stmt->execute([
            'salutation' => $user->getSalutation(),
            'first_name' => $user->getFirstName(),
            'last_name' => $user->getLastName(),
            'address' => $user->getAddress(),
            'postal_code' => $user->getPostalCode(),
            'city' => $user->getCity(),
            'email' => $user->getEmail(),
            'user_id' => $user->getUserId()
        ]);
    }
    public static function getOrdersByUser(int $userId): array
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("
        SELECT
          order_id,
          DATE_FORMAT(order_date, '%d.%m.%Y %H:%i:%s') AS order_date,
          total_price
        FROM orders
        WHERE user_id = :user_id
        ORDER BY order_date ASC
    ");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }



    public static function getOrderDetails(int $orderId): array
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("
            SELECT e.title, e.price, i.quantity, (e.price * i.quantity) AS line_total
              FROM order_items i
              JOIN ebooks e ON i.ebook_id = e.ebook_id
             WHERE i.order_id = ?
        ");
        $stmt->execute([$orderId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function createOrder(int $userId): array
    {
        $pdo = DBAccess::connect();
        $pdo->beginTransaction();

        // 1) get cart_id
        $stmt = $pdo->prepare("SELECT cart_id FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cartId = $stmt->fetchColumn();
        if (!$cartId) {
            throw new Exception("Kein Warenkorb gefunden");
        }

        // 2) sum total price
        $stmt = $pdo->prepare("
          SELECT SUM(e.price * i.quantity) 
            FROM items i 
            JOIN ebooks e ON i.ebook_id = e.ebook_id 
           WHERE i.cart_id = ?
        ");
        $stmt->execute([$cartId]);
        $total = (float)$stmt->fetchColumn();

        // 3) insert order
        $stmt = $pdo->prepare("
          INSERT INTO orders (user_id, order_date, total_price)
          VALUES (?, NOW(), ?)
        ");
        $stmt->execute([$userId, $total]);
        $orderId = $pdo->lastInsertId();

        // 4) move items: set order_id, clear cart_id
        $stmt = $pdo->prepare("
          UPDATE items
             SET order_id = ?, cart_id = NULL
           WHERE cart_id = ?
        ");
        $stmt->execute([$orderId, $cartId]);

        $pdo->commit();
        return ['success' => true, 'orderId' => $orderId];
    }
    /**
     * Liefert alle Daten für eine Rechnung:
     *  - Bestelldaten (order_date, total_price)
     *  - Kundendaten (Adresse, PLZ, Ort)
     *  - alle Positionen (Titel, Autor, Einzelpreis, Menge, Zeilengesamt)
     *  - eine zufällige Rechnungsnummer
     */
    public static function getInvoiceData(int $orderId): array
    {
        $pdo = DBAccess::connect();
        // 1) Bestell- & Kundendaten
        $stmt = $pdo->prepare("
      SELECT
        o.order_id,
        DATE_FORMAT(o.order_date, '%d.%m.%Y %H:%i:%s') AS order_date,
        o.total_price,
        u.salutation, u.first_name, u.last_name,
        u.address, u.postal_code, u.city
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    ");
        $stmt->execute([$orderId]);
        $meta = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$meta) {
            throw new Exception('Bestellung nicht gefunden');
        }

        // 2) Positionen aus items (nicht order_items) holen
        $stmt = $pdo->prepare("
      SELECT
        e.title,
        e.author,
        e.price,
        i.quantity,
        (e.price * i.quantity) AS line_total
      FROM items i
      JOIN ebooks e ON i.ebook_id = e.ebook_id
      WHERE i.order_id = ?
    ");
        $stmt->execute([$orderId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3) Rechnungsnummer erzeugen
        $invoiceNumber = strtoupper(substr(md5(uniqid((string)$orderId, true)), 0, 10));

        return [
            'order'          => [
                'order_id'    => $meta['order_id'],
                'order_date'  => $meta['order_date'],
                'total_price' => $meta['total_price'],
            ],
            'user'           => [
                'salutation'  => $meta['salutation'],
                'first_name'  => $meta['first_name'],
                'last_name'   => $meta['last_name'],
                'address'     => $meta['address'],
                'postal_code' => $meta['postal_code'],
                'city'        => $meta['city'],
            ],
            'items'          => $items,
            'invoice_number' => $invoiceNumber
        ];
    }
}
