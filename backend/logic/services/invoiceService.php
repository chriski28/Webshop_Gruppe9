<?php
function getInvoiceData($input){
        // Auth check
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Nicht eingeloggt']);
            return;
        }
        // Parameter prüfen
        $orderId = $input['order_id'] ?? null;
        if (!$orderId) {
            echo json_encode(['error' => 'Fehlende Bestell-ID']);
            return;
        }
        // Daten holen & ausgeben
        try {
            $data = DataHandler::getInvoiceData((int)$orderId);
            echo json_encode($data);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
}