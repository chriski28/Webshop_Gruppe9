<?php
class DBAccess
{
    private static $pdo = null;

    public static function connect()
    {
        if (self::$pdo === null) {
            $dsn = 'mysql:host=localhost;dbname=bookify_db;charset=utf8';
            $user = 'bookify_user';
            $password = '1234';
            self::$pdo = new PDO($dsn, $user, $password);
        }
        return self::$pdo;
    }
}
