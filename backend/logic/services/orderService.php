<?php

function createOrder()
{
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'Nicht eingeloggt']);
        return;
    }
    $userId = $_SESSION['user_id'];
    $result = DataHandler::createOrder($userId);
    echo json_encode($result);
}
function getUserOrders()
{
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'orders' => [],
            'error'  => 'Nicht eingeloggt'
        ]);
        return;
    }
    $orders = DataHandler::getOrdersByUser($_SESSION['user_id']);
    echo json_encode([
        'orders' => $orders
    ]);
}

function getOrderDetails($input)
{
    if (!isset($input['order_id'])) {
        echo json_encode(['error' => 'Fehlende Bestell-ID']);
        return;
    }

    $details = DataHandler::getOrderDetails($input['order_id']);
    echo json_encode($details);
}

function getOrdersByUserAdmin($input)
{
    if (!isset($input['user_id'])) {
        echo json_encode(['error' => 'Fehlende User-ID']);
        return;
    }
    $orders = DataHandler::getOrdersByUser((int)$input['user_id']);
    echo json_encode(['orders' => $orders]);
}

function removeItemFromOrder($input)
{
    if (!isset($input['order_id'], $input['ebook_id'])) {
        echo json_encode(['success' => false, 'error' => 'Fehlende Parameter']);
        return;
    }

    try {
        DataHandler::removeItemFromOrder((int)$input['order_id'], (int)$input['ebook_id']);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
