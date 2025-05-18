<?php
function addToCart($input)
{
    DataHandler::addToCart($_SESSION['user_id'], $input['ebook_id'], $input['quantity']);
    echo json_encode(['success' => true]);
}
function getCart()
{
    $items = DataHandler::getCartItems($_SESSION['user_id']);
    echo json_encode($items);
}
function getCartCount()
{
    $count = DataHandler::getCartCount($_SESSION['user_id']);
    echo json_encode(['count' => $count]);
}
function updateCartItem($input)
{
    DataHandler::updateCartItem($_SESSION['user_id'], $input['ebook_id'], $input['quantity']);
    echo json_encode(['success' => true]);
}
function removeCartItem($input)
{
    DataHandler::removeCartItem($_SESSION['user_id'], $input['ebook_id']);
    echo json_encode(['success' => true]);
}