<?php
require_once 'dbaccess.php';
require_once '../models/user.class.php';
require_once '../models/ebook.class.php';

class DataHandler
{
    // User Data Handler -------------------------------
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

    public static function toggleUserActive(int $userId, bool $active): void
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->prepare("UPDATE users SET active = ? WHERE user_id = ?");
        $stmt->execute([(int)$active, $userId]);
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

    // Product Data Handler -------------------------------
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

    public static function addEbook(array $data): array
    {
        $pdo = DBAccess::connect();

        $stmt = $pdo->prepare("
        INSERT INTO ebooks (title, author, description, price, isbn, rating, category)
        VALUES (:title, :author, :description, :price, :isbn, :rating, :category)
    ");

        $success = $stmt->execute([
            'title'       => $data['title'],
            'author'      => $data['author'],
            'description' => $data['description'],
            'price'       => $data['price'],
            'isbn'        => $data['isbn'] ?? '',
            'rating'      => $data['rating'] ?? 0,
            'category'    => $data['category']
        ]);

        if ($success) {
            return ['success' => true, 'id' => $pdo->lastInsertId()];
        } else {
            return ['success' => false, 'error' => 'Fehler beim Speichern des E-Books.'];
        }
    }


    public static function updateEbook(array $data): array
    {
        $pdo = DBAccess::connect();

        $stmt = $pdo->prepare("
        UPDATE ebooks
           SET title = :title,
               author = :author,
               description = :description,
               price = :price,
               isbn = :isbn,
               rating = :rating,
               category = :category,
               cover_image_path = :cover_image_path
         WHERE ebook_id = :ebook_id
    ");

        $success = $stmt->execute([
            'title'            => $data['title'],
            'author'           => $data['author'],
            'description'      => $data['description'],
            'price'            => $data['price'],
            'isbn'             => $data['isbn'] ?? '',
            'rating'           => $data['rating'] ?? 0,
            'category'         => $data['category'],
            'cover_image_path' => $data['cover_image_path'] ?? '',
            'ebook_id'         => $data['ebook_id']
        ]);

        if ($success) {
            return ['success' => true];
        } else {
            return ['success' => false, 'error' => 'Update fehlgeschlagen.'];
        }
    }


    public static function getAllEbooksWithDetails(): array
    {
        $pdo = DBAccess::connect();
        $stmt = $pdo->query("SELECT * FROM ebooks ORDER BY title ASC");
        $ebooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $ebooks ?: [];
    }

    public static function deleteEbook(int $ebook_id): array
    {
        $pdo = DBAccess::connect();

        $stmt = $pdo->prepare("DELETE FROM ebooks WHERE ebook_id = :id");
        $success = $stmt->execute(['id' => $ebook_id]);

        if ($success) {
            return ['success' => true];
        } else {
            return ['success' => false, 'error' => 'Löschen fehlgeschlagen.'];
        }
    }


    // Cart Data Handler -------------------------------

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
        "); //Wenn genau dieser Eintrag schon existiert, dann wird er nur aktualisiert (+ neue menge)
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
        "); //Holt alle E-Books, die im Warenkorb eines Users liegen.
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

    // Order Data Handler -------------------------------

    public static function createOrder(int $userId): array
    {
        $pdo = DBAccess::connect();
        $pdo->beginTransaction();

        // get cart_id
        $stmt = $pdo->prepare("SELECT cart_id FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cartId = $stmt->fetchColumn();
        if (!$cartId) {
            throw new Exception("Kein Warenkorb gefunden");
        }

        // sum total price
        $stmt = $pdo->prepare("
          SELECT SUM(e.price * i.quantity) 
            FROM items i 
            JOIN ebooks e ON i.ebook_id = e.ebook_id 
           WHERE i.cart_id = ?
        ");
        $stmt->execute([$cartId]);
        $total = (float)$stmt->fetchColumn();

        // insert order
        $stmt = $pdo->prepare("
          INSERT INTO orders (user_id, order_date, total_price)
          VALUES (?, NOW(), ?)
        ");
        $stmt->execute([$userId, $total]);
        $orderId = $pdo->lastInsertId();

        // move items: set order_id, clear cart_id
        $stmt = $pdo->prepare("
          UPDATE items
             SET order_id = ?, cart_id = NULL
           WHERE cart_id = ?
        ");
        $stmt->execute([$orderId, $cartId]);

        $pdo->commit();
        return ['success' => true, 'orderId' => $orderId];
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
              FROM items i
              JOIN ebooks e ON i.ebook_id = e.ebook_id
             WHERE i.order_id = ?
        ");
        $stmt->execute([$orderId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function removeItemFromOrder(int $orderId, int $ebookId): void
    {
        $pdo = DBAccess::connect();

        // Item löschen
        $stmt = $pdo->prepare("DELETE FROM items WHERE order_id = ? AND ebook_id = ?");
        $stmt->execute([$orderId, $ebookId]);

        // Neue Summe berechnen
        $stmt = $pdo->prepare("
        SELECT SUM(e.price * i.quantity)
        FROM items i
        JOIN ebooks e ON i.ebook_id = e.ebook_id
        WHERE i.order_id = ?
    ");
        $stmt->execute([$orderId]);
        $newTotal = (float)$stmt->fetchColumn();

        // In orders aktualisieren
        $stmt = $pdo->prepare("UPDATE orders SET total_price = ? WHERE order_id = ?");
        $stmt->execute([$newTotal, $orderId]);
    }

    //Invoice Data Handler -------------------------------

        public static function getInvoiceData(int $orderId): array
    {
            $pdo = DBAccess::connect();
            // Bestell- & Kundendaten
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

            // Positionen aus items (nicht order_items) holen
            $stmt = $pdo->prepare("
        SELECT
            i.ebook_id,
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

            // zufällige Rechnungsnummer erzeugen
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
