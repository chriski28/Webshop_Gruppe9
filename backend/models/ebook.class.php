<?php

class Ebook
{
    private $ebook_id;
    private $title;
    private $author;
    private $description;
    private $price;
    private $isbn;
    private $rating;
    private $cover_image_path;
    private $category;

    // Constructor
    public function __construct(int $ebook_id, string $title, string $author, string $description, float $price,
        string $isbn, float $rating, string $cover_image_path, string $category) {
        $this->ebook_id = $ebook_id;
        $this->title = $title;
        $this->author = $author;
        $this->description = $description;
        $this->price = $price;
        $this->isbn = $isbn;
        $this->rating = $rating;
        $this->cover_image_path = $cover_image_path;
        $this->category = $category;
    }

    // Getters & Setters 
    public function getEbookId(): int
    {
        return $this->ebook_id;
    }

    public function setEbookId(int $ebook_id): void
    {
        $this->ebook_id = $ebook_id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function getAuthor(): string
    {
        return $this->author;
    }

    public function setAuthor(string $author): void
    {
        $this->author = $author;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): void
    {
        $this->description = $description;
    }

    public function getPrice(): float
    {
        return $this->price;
    }

    public function setPrice(float $price): void
    {
        $this->price = $price;
    }

    public function getIsbn(): string
    {
        return $this->isbn;
    }

    public function setIsbn(string $isbn): void
    {
        $this->isbn = $isbn;
    }

    public function getRating(): float
    {
        return $this->rating;
    }

    public function setRating(float $rating): void
    {
        $this->rating = $rating;
    }

    public function getCoverImagePath(): string
    {
        return $this->cover_image_path;
    }

    public function setCoverImagePath(string $cover_image_path): void
    {
        $this->cover_image_path = $cover_image_path;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function setCategory(string $category): void
    {
        $this->category = $category;
    }

    // Convert Object to Array
    public function toArray(): array
    {
        return [
            'ebook_id' => $this->ebook_id,
            'title' => $this->title,
            'author' => $this->author,
            'description' => $this->description,
            'price' => $this->price,
            'isbn' => $this->isbn,
            'rating' => $this->rating,
            'cover_image_path' => $this->cover_image_path,
            'category' => $this->category
        ];
    }
}