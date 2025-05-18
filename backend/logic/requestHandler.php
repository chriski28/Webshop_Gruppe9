
<?php
header("Content-Type: application/json");
session_start();

// database connection
require_once '../config/dataHandler.php';

// services
require_once 'services/userService.php';
require_once 'services/productService.php';
require_once 'services/cartService.php';
require_once 'services/orderService.php';
require_once 'services/invoiceService.php';

// Read incoming JSON and decide what action to take based on the 'action' field
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['action'])) {
    echo json_encode(['error' => 'No action specified']);
    exit;
}

switch ($input['action']) {

    // User Service -------------------------------

    case 'getUser':
        getUser();
        break;

    case 'createUser':
        createUser($input);
        break;

    case 'getAllUsers':
        getAllUsers();
        break;

    case 'login':
        login($input);
        break;

    case 'getSessionUser':
        getSessionUser();
        break;

    case 'loginWithToken':
        loginWithToken($input);
        break;

    case 'logout':
        logout();
        break;

    case 'updateUser':
        updateUser($input);
        break;

    case 'toggleUserActive':
        toggleUserActive($input);
        break;

    // Product Service -------------------------------

    case 'getEbooks':
        getEbooks($input);
        break;

    case 'searchEbooks':
        searchEbooks($input);
        break;

    case 'addEbook':
        addEbook($input);
        break;

    case 'updateEbook':
        updateEbook($input);
        break;

    case 'getAllEbooksWithDetails':
        getAllEbooksWithDetails();
        break;

    case 'deleteEbook':
        deleteEbook($input);
        break;

    // Cart Service -------------------------------

    case 'addToCart':
        addToCart($input);
        break;

    case 'getCart':
        getCart();
        break;

    case 'getCartCount':
        getCartCount();
        break;

    case 'updateCartItem':
        updateCartItem($input);
        break;

    case 'removeCartItem':
        removeCartItem($input);
        break;

    // Order Service -------------------------------

    case 'createOrder':
        createOrder();
        break;

    case 'getUserOrders':
        getUserOrders();
        break;

    case 'getOrderDetails':
        getOrderDetails($input);
        break;

    case 'getOrdersByUserAdmin':
        getOrdersByUserAdmin($input);
        break;

    case 'removeItemFromOrder':
        removeItemFromOrder($input);
        break;

    //Invoice Service -------------------------------

    case 'getInvoiceData':
        getInvoiceData($input);
        break;

    // Default case -------------------------------

    default:
        echo json_encode(['error' => 'Unknown action']);
        break;
}
