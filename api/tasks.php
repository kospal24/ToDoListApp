<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "aps_todo";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all tasks or tasks by user
        $user = isset($_GET['user']) ? $_GET['user'] : '';
        if ($user) {
            $stmt = $conn->prepare("SELECT * FROM tasks WHERE user = ? ORDER BY created_at DESC");
            $stmt->bind_param("s", $user);
        } else {
            $stmt = $conn->prepare("SELECT * FROM tasks ORDER BY created_at DESC");
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }
        echo json_encode($tasks);
        break;

    case 'POST':
        // Create new task
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['user'], $data['text'], $data['priority'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields"]);
            exit();
        }
        $user = $data['user'];
        $text = $data['text'];
        $priority = $data['priority'];
        $due_date = isset($data['due_date']) ? $data['due_date'] : null;
        $completed = 0;

        $stmt = $conn->prepare("INSERT INTO tasks (user, text, completed, priority, due_date) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssiss", $user, $text, $completed, $priority, $due_date);
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Task created", "id" => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to create task"]);
        }
        break;

    case 'PUT':
        // Update task
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing task id"]);
            exit();
        }
        $id = $data['id'];
        $text = isset($data['text']) ? $data['text'] : null;
        $completed = isset($data['completed']) ? $data['completed'] : null;
        $priority = isset($data['priority']) ? $data['priority'] : null;
        $due_date = isset($data['due_date']) ? $data['due_date'] : null;

        $fields = [];
        $params = [];
        $types = "";

        if ($text !== null) {
            $fields[] = "text = ?";
            $params[] = $text;
            $types .= "s";
        }
        if ($completed !== null) {
            $fields[] = "completed = ?";
            $params[] = $completed;
            $types .= "i";
        }
        if ($priority !== null) {
            $fields[] = "priority = ?";
            $params[] = $priority;
            $types .= "s";
        }
        if ($due_date !== null) {
            $fields[] = "due_date = ?";
            $params[] = $due_date;
            $types .= "s";
        }

        if (count($fields) === 0) {
            http_response_code(400);
            echo json_encode(["error" => "No fields to update"]);
            exit();
        }

        $sql = "UPDATE tasks SET " . implode(", ", $fields) . " WHERE id = ?";
        $params[] = $id;
        $types .= "i";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Task updated"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update task"]);
        }
        break;

    case 'DELETE':
        // Delete task
        parse_str(file_get_contents("php://input"), $data);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing task id"]);
            exit();
        }
        $id = $data['id'];
        $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Task deleted"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to delete task"]);
        }
        break;

    case 'OPTIONS':
        // Handle preflight requests
        http_response_code(200);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}

$conn->close();
?>
