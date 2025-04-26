<?php

class User
{
    private $user_id; // int
    private $is_admin; // bool
    private $salutation; //string
    private $first_name; // string
    private $last_name; // string
    private $address; // string
    private $postal_code; // string
    private $city; // string
    private $email; // string
    private $username; // string
    private $password; // string
    private $active; // bool

    // Constructor
    public function __construct(int $user_id, bool $is_admin,string $salutation, string $first_name, string $last_name, string $address, string $postal_code, string $city, string $email, string $username, string $password, bool $active)
    {
        $this->user_id = $user_id;
        $this->is_admin = $is_admin;
        $this->salutation = $salutation;
        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->address = $address;
        $this->postal_code = $postal_code;
        $this->city = $city;
        $this->email = $email;
        $this->username = $username;
        $this->password = $password;
        $this->active = $active;
    }

    // Getter and Setter for user_id
    public function getUserId(): ?int
    {
        return $this->user_id;
    }

    public function setUserId(int $user_id): void
    {
        $this->user_id = $user_id;
    }

    // Getter and Setter for is_admin
    public function isAdmin(): ?bool
    {
        return $this->is_admin;
    }

    public function setIsAdmin(bool $is_admin): void
    {
        $this->is_admin = $is_admin;
    }

     // Getter and Setter for salutation (NEU)
     public function getSalutation(): string
     {
         return $this->salutation;
     }
 
     public function setSalutation(string $salutation): void
     {
         $this->salutation = $salutation;
     }

    // Getter and Setter for first_name
    public function getFirstName(): string
    {
        return $this->first_name;
    }

    public function setFirstName(string $first_name): void
    {
        $this->first_name = $first_name;
    }

    // Getter and Setter for last_name
    public function getLastName(): string
    {
        return $this->last_name;
    }

    public function setLastName(string $last_name): void
    {
        $this->last_name = $last_name;
    }

    // Getter and Setter for address
    public function getAddress(): string
    {
        return $this->address;
    }

    public function setAddress(string $address): void
    {
        $this->address = $address;
    }

    // Getter and Setter for postal_code
    public function getPostalCode(): string
    {
        return $this->postal_code;
    }

    public function setPostalCode(string $postal_code): void
    {
        $this->postal_code = $postal_code;
    }

    // Getter and Setter for city
    public function getCity(): string
    {
        return $this->city;
    }

    public function setCity(string $city): void
    {
        $this->city = $city;
    }

    // Getter and Setter for email
    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    // Getter and Setter for username
    public function getUsername(): string
    {
        return $this->username;
    }

    public function setUsername(string $username): void
    {
        $this->username = $username;
    }

    // Getter and Setter for password
    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    // Getter and Setter for active
    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): void
    {
        $this->active = $active;
    }

    

    // Convert Object to Array
    public function toArray(): array
    {
        return [
            'user_id' => $this->user_id,
            'is_admin' => $this->is_admin,
            'salutation' => $this->salutation,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'address' => $this->address,
            'postal_code' => $this->postal_code,
            'city' => $this->city,
            'email' => $this->email,
            'username' => $this->username,
            'password' => $this->password,
            'active' => $this->active
        ];
    }
}
