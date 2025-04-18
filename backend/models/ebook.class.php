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

/*
✅ 1. Produkte nach Kategorien anzeigen (7 Punkte)
(5 + 2 Punkte: Name, Bild, Preis UND Bewertung)

Was?

Lade alle E-Books aus der Datenbank

Zeige sie je nach Kategorie an

Zeige: Name, Bild, Preis und Bewertung

Wo umsetzen?

shop.html → HTML-Struktur für Kategorien + Produkte

script.js → Funktion schreiben, um Produkte dynamisch via AJAX zu laden

requestHandler.php → neue Action getProductsByCategory

dataHandler.php → neue Methode zum Abrufen nach Kategorie

ebook.class.php → falls noch nicht vorhanden: getters




Perfekt! Dann fangen wir **strukturiert** an. Wir gehen Schritt für Schritt vor und bauen zuerst das Backend, danach das Frontend.

---

## 🔧 **Schritt 1: `ebook.class.php` – Getter hinzufügen (falls nötig)**

Stelle sicher, dass deine `Ebook`-Klasse Getter für alle Eigenschaften hat:

```php
public function getId() { return $this->id; }
public function getTitle() { return $this->title; }
public function getAuthor() { return $this->author; }
public function getPrice() { return $this->price; }
public function getRating() { return $this->rating; }
public function getImage() { return $this->image; }
public function getCategory() { return $this->category; }
```

Wenn du willst, kannst du auch eine Methode `toArray()` einbauen wie bei `User`.

---

## 🧠 **Schritt 2: `dataHandler.php` – Methode `getEbooksByCategory($category)`**

Neue Methode schreiben:

```php
public static function getEbooksByCategory(string $category): array
{
    $pdo = DBAccess::connect();
    $stmt = $pdo->prepare("SELECT * FROM ebooks WHERE category = :category");
    $stmt->execute(['category' => $category]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $ebooks = [];
    foreach ($rows as $row) {
        $ebooks[] = [
            'id' => $row['ebook_id'],
            'title' => $row['title'],
            'author' => $row['author'],
            'price' => $row['price'],
            'rating' => $row['rating'],
            'image' => $row['image'],
            'category' => $row['category']
        ];
    }

    return $ebooks;
}
```

---

## 🔁 **Schritt 3: `requestHandler.php` – Neue Action `getProductsByCategory`**

```php
case 'getProductsByCategory':
    if (!isset($input['category'])) {
        echo json_encode(['error' => 'Kategorie fehlt']);
        break;
    }
    $ebooks = DataHandler::getEbooksByCategory($input['category']);
    echo json_encode($ebooks);
    break;
```

---

## 🌐 **Schritt 4: `shop.html` – Platzhalter für Kategorie & Produkte**

Füge in `shop.html` irgendwo so etwas ein:

```html
<select id="categorySelect" class="form-select w-50 mx-auto my-4">
  <option value="Romance">Romance</option>
  <option value="Thriller">Thriller</option>
  <option value="Fantasy">Fantasy</option>
  <!-- Weitere Kategorien -->
</select>

<div class="container">
  <div id="product-container" class="row">
    <!-- Produkte werden hier per JS eingefügt -->
  </div>
</div>
```

---

## 🧠 **Schritt 5: `script.js` – Kategorieauswahl & Produktausgabe**

Schreibe in `script.js`:

```js
document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("categorySelect");
  select.addEventListener("change", () => loadProducts(select.value));
  loadProducts(select.value); // direkt beim Laden die erste Kategorie anzeigen
});

function loadProducts(category) {
  fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getProductsByCategory", category })
  })
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("product-container");
      container.innerHTML = "";

      data.forEach(product => {
        const html = `
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow">
              <img src="../productpictures/${product.image}" class="card-img-top" alt="${product.title}">
              <div class="card-body">
                <h5 class="card-title">${product.title}</h5>
                <p class="card-text"><strong>Autor:</strong> ${product.author}</p>
                <p class="card-text"><strong>Preis:</strong> ${product.price} €</p>
                <p class="card-text"><strong>Bewertung:</strong> ${product.rating} ⭐</p>
                <button class="btn btn-primary w-100">In den Warenkorb</button>
              </div>
            </div>
          </div>`;
        container.innerHTML += html;
      });
    });
}
```

---

Wenn du bereit bist, sag mir, **mit welchem Teil du beginnen willst** oder ob du schon etwas davon gemacht hast – dann gehen wir gemeinsam durch!
*/
