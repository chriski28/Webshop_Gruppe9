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
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

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
            'is_admin' => (int) $user->isAdmin(),
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

}
