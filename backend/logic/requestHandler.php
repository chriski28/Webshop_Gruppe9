<?php
header("Content-Type: application/json");

require_once '../config/dataHandler.php';

// Read incoming JSON and decide what action to take based on the 'action' field
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['action'])) {
    echo json_encode(['error' => 'No action specified']);
    exit;
}

switch ($input['action']) {

    case 'getUser':
        if (isset($input['id'])) {
            $user = DataHandler::getUser($input['id']);

            if ($user === null) {
                echo json_encode(['error' => 'User not found']);
            } else {
                echo json_encode($user->toArray());
            }
        } else {
            echo json_encode(['error' => 'Missing user ID']);
        }
        break;

    case 'createUser':
        if (isset($input['first_name'], $input['last_name'], $input['address'], $input['postal_code'], $input['city'], $input['email'], $input['username'], $input['password'])) {
            $user = new User(
                0, // user_id (auto-increment, set to 0)
                false, // is_admin default false
                $input['first_name'],
                $input['last_name'],
                $input['address'],
                $input['postal_code'],
                $input['city'],
                $input['email'],
                $input['username'],
                $input['password'],
                true // active (default true)
            );

            $success = DataHandler::createUser($user);

            echo json_encode(['success' => $success]);
        } else {
            echo json_encode(['error' => 'Missing user data']);
        }
        break;

    case 'getAllUsers':
        $users = DataHandler::getAllUsers();
        echo json_encode($users);
        break;

    default:
        echo json_encode(['error' => 'Unknown action']);
        break;
}
