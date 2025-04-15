<?php
class DBAccess
{
    private static $pdo = null;

    public static function connect()
    {
        if (self::$pdo === null) {
            $dsn = 'mysql:host=localhost;dbname=bookify_db;charset=utf8';
            $user = 'root';         // Standard-XAMPP-Benutzer
            $password = '';         // Standard: kein Passwort
            self::$pdo = new PDO($dsn, $user, $password);
        }
        return self::$pdo;
    }
}
