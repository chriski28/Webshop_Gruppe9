<?php
class DBAccess
{
    private static $pdo = null; //Sie speichert die PDO-Verbindung zur Datenbank.

    public static function connect()
    {
        if (self::$pdo === null) { //Wenn keine Verngdung aufgebaut, dann wird eine neue erstellt
            $dsn = 'mysql:host=localhost;dbname=bookify_db;charset=utf8';
            $user = 'root';         // Standard-XAMPP-Benutzer
            $password = '';         // Standard: kein Passwort
            self::$pdo = new PDO($dsn, $user, $password);
        }
        return self::$pdo;
    }
}
