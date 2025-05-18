<?php
function getEbooks($input){
    // Kategorie prüfen (wenn vorhanden)
    $category = $input['category'] ?? null;

    $ebooks = DataHandler::getEbooks($category);
    echo json_encode($ebooks);
}
function searchEbooks($input){
    if (isset($input['search'])) {
        $searchTerm = $input['search'];
        $ebooks = DataHandler::searchEbooks($searchTerm);
        echo json_encode($ebooks);
    } else {
        echo json_encode(['error' => 'No search term provided']);
    }
}
function addEbook($input){
    // Nur eingeloggte Admins dürfen neue E-Books anlegen
    if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
        echo json_encode(['success' => false, 'error' => 'Nur Admins dürfen E-Books anlegen.']);
        return;
    }

    // Pflichtfelder prüfen
    $requiredFields = ['title', 'author', 'description', 'price', 'category'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            echo json_encode(['success' => false, 'error' => "Feld '$field' fehlt oder ist leer."]);
            return;
        }
    }

    // Datenstruktur vorbereiten
    $data = [
        'title'       => trim($input['title']),
        'author'      => trim($input['author']),
        'description' => trim($input['description']),
        'price'       => (float) $input['price'],
        'isbn'        => trim($input['isbn'] ?? ''),
        'rating'      => isset($input['rating']) ? (float) $input['rating'] : 0,
        'category'    => trim($input['category']),
        'cover_image_path' => trim($input['cover_image_path'] ?? '') // für Bild-Upload später
    ];

    // E-Book speichern
    $result = DataHandler::addEbook($data);
    echo json_encode($result);
}
function updateEbook($input){
    // Nur Admins dürfen bearbeiten
    if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
        echo json_encode(['success' => false, 'error' => 'Nur Admins dürfen E-Books bearbeiten.']);
        return;
    }

    // Pflichtfelder prüfen
    $requiredFields = ['ebook_id', 'title', 'author', 'description', 'price', 'category'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            echo json_encode(['success' => false, 'error' => "Feld '$field' fehlt oder ist leer."]);
            return;
        }
    }

    // Datenstruktur vorbereiten
    $data = [
        'ebook_id'    => (int)$input['ebook_id'],
        'title'       => trim($input['title']),
        'author'      => trim($input['author']),
        'description' => trim($input['description']),
        'price'       => (float)$input['price'],
        'isbn'        => trim($input['isbn'] ?? ''),
        'rating'      => isset($input['rating']) ? (float)$input['rating'] : 0,
        'category'    => trim($input['category']),
        'cover_image_path' => trim($input['cover_image_path'] ?? '')
    ];

    $success = DataHandler::updateEbook($data);
    echo json_encode(['success' => $success]);
}
// für Produktverwaltung (alle Details)
function getAllEbooksWithDetails(){
    // Nur Admins dürfen alle Details sehen
    if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
        echo json_encode(['error' => 'Nur Admins dürfen alle Produkte sehen.']);
        return;
    }

    $ebooks = DataHandler::getAllEbooksWithDetails();
    echo json_encode($ebooks);
}
function deleteEbook($input){
    // Nur Admins dürfen löschen
    if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
        echo json_encode(['success' => false, 'error' => 'Nur Admins dürfen löschen.']);
        return;
    }

    if (!isset($input['ebook_id'])) {
        echo json_encode(['success' => false, 'error' => 'Keine ID übergeben.']);
        return;
    }

    $ebook_id = (int)$input['ebook_id'];
    $result = DataHandler::deleteEbook($ebook_id);
    echo json_encode($result);
}