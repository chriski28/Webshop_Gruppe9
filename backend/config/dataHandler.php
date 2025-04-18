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
        (is_admin, first_name, last_name, address, postal_code, city, email, username, password, active)
        VALUES 
        (:is_admin, :first_name, :last_name, :address, :postal_code, :city, :email, :username, :password, :active)
    ");

        return $stmt->execute([
            'is_admin' => (int) $user->isAdmin(), //setzt den Platzhalter :is_admin im SQL-Statement mit dem tatsächlichen Wert von $is_admin
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


}
