<?php
session_start();
header('Content-Type: application/json');

$dsn = 'mysql:host=localhost;dbname=task_management;charset=utf8';
$username = 'root';
$password = '';

try {
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

function safe($data) {
    global $pdo;
    return $pdo->quote($data);
}

function respond($data) {
    echo json_encode($data);
    exit;
}

function checkAuth($roles = []) {
    if (!isset($_SESSION['user_id']) || (count($roles) && !in_array($_SESSION['role'], $roles))) {
        respond(['success' => false, 'message' => 'Unauthorized']);
    }
}

function login($pdo) {
    $id = $_POST['id'];
    $password = $_POST['password'];
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        respond(['success' => true, 'userId' => $user['id'], 'role' => $user['role']]);
    } else {
        respond(['success' => false, 'message' => 'Invalid credentials']);
    }
}

function logout() {
    session_destroy();
    respond(['success' => true]);
}

function createUser($pdo) {
    checkAuth(['admin', 'manager']);
    $name = $_POST['name'];
    $last_name = $_POST['last_name'];
    $role = $_POST['role'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $department = $_POST['department'];

    if (empty($name) || empty($last_name) || empty($role) || empty($password) || empty($department)) {
        respond(['success' => false, 'message' => 'All fields are required']);
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, last_name, role, password_hash, department) VALUES (:name, :last_name, :role, :password_hash, :department)");
    $stmt->execute(['name' => $name, 'last_name' => $last_name, 'role' => $role, 'password_hash' => $password, 'department' => $department]);
    
    respond(['success' => true]);
}

function getUsers($pdo) {
    checkAuth(['admin', 'manager']);
    $stmt = $pdo->query("SELECT id, name, last_name, role, department FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond($users);
}

function updateUser($pdo) {
    checkAuth(['admin', 'manager']);
    
    $user_id = $_POST['user_id'];
    $name = $_POST['name'];
    $last_name = $_POST['last_name'];
    $role = $_POST['role'];
    $department = $_POST['department'];

    $stmt = $pdo->prepare("UPDATE users SET name = :name, last_name = :last_name, role = :role, department = :department WHERE id = :user_id");
    $stmt->execute(['name' => $name, 'last_name' => $last_name, 'role' => $role, 'department' => $department, 'user_id' => $user_id]);

    respond(['success' => true]);
}

function deleteUser($pdo) {
    checkAuth(['admin', 'manager']);
    
    $user_id = $_POST['user_id'];

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = :user_id");
    $stmt->execute(['user_id' => $user_id]);

    respond(['success' => true]);
}

function updateUserRole($pdo) {
    checkAuth(['admin', 'manager']);
    
    $user_id = $_POST['user_id'];
    $role = $_POST['role'];

    $stmt = $pdo->prepare("UPDATE users SET role = :role WHERE id = :user_id");
    $stmt->execute(['role' => $role, 'user_id' => $user_id]);

    respond(['success' => true]);
}


function createTask($pdo) {
    checkAuth();
    
    $name = $_POST['name'];
    $description = $_POST['description'];
    $manager_id = $_SESSION['user_id'];
    $worker_id = $_POST['worker_id'];

    if (empty($name) || empty($description) || empty($worker_id)) {
        respond(['success' => false, 'message' => 'All fields are required']);
    }

    $stmt = $pdo->prepare("INSERT INTO tasks (name, description, manager_id, worker_id) VALUES (:name, :description, :manager_id, :worker_id)");
    $stmt->execute(['name' => $name, 'description' => $description, 'manager_id' => $manager_id, 'worker_id' => $worker_id]);
    
    respond(['success' => true]);
}

function getAllTasks($pdo) {
    checkAuth(['admin', 'manager']);
    
    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE status = 'active'");
    $stmt->execute();
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($tasks);
}

function getAllArchiveTasks($pdo) {
    checkAuth(['admin', 'manager']);
    
    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE status = 'archive'");
    $stmt->execute();
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($tasks);
}

function updateTaskStatus($pdo) {
    checkAuth();
    
    $task_id = $_POST['task_id'];
    $status = $_POST['status'];

    if (!in_array($status, ['active', 'archive'])) {
        respond(['success' => false, 'message' => 'Invalid status']);
    }

    $stmt = $pdo->prepare("UPDATE tasks SET status = :status WHERE id = :task_id");
    $stmt->execute(['status' => $status, 'task_id' => $task_id]);

    respond(['success' => true]);
}

function deleteTask($pdo) {
    checkAuth();
    
    $task_id = $_POST['task_id'];

    $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = :task_id");
    $stmt->execute(['task_id' => $task_id]);

    respond(['success' => true]);
}

function getUserTasks($pdo) {
    checkAuth();
    
    $worker_id = $_GET['worker_id'];

    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE worker_id = :worker_id AND status = 'active'");
    $stmt->execute(['worker_id' => $worker_id]);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($tasks);
}

function getUserArchiveTasks($pdo) {
    checkAuth();
    
    $worker_id = $_GET['worker_id'];

    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE worker_id = :worker_id AND status = 'archive'");
    $stmt->execute(['worker_id' => $worker_id]);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($tasks);
}

function updateTask($pdo) {
    checkAuth(['admin', 'manager']);
    
    $task_id = $_POST['task_id'];
    $name = $_POST['name'];
    $description = $_POST['description'];

    $stmt = $pdo->prepare("UPDATE tasks SET name = :name, description = :description WHERE id = :task_id");
    $stmt->execute(['name' => $name, 'description' => $description, 'task_id' => $task_id]);

    respond(['success' => true]);
}

function addComment($pdo) {
    checkAuth();
    
    $task_id = $_POST['task_id'];
    $comment = $_POST['comment'];

    $stmt = $pdo->prepare("SELECT comments FROM tasks WHERE id = :task_id");
    $stmt->execute(['task_id' => $task_id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    $comments = json_decode($task['comments'], true) ?? [];
    $comments[] = $comment;

    $stmt = $pdo->prepare("UPDATE tasks SET comments = :comments WHERE id = :task_id");
    $stmt->execute(['comments' => json_encode($comments), 'task_id' => $task_id]);

    respond(['success' => true]);
}

function uploadFile($pdo) {
    checkAuth();

    if (!isset($_POST['task_id'])) {
        respond(['success' => false, 'message' => 'Task ID is required']);
        return;
    }

    $task_id = intval($_POST['task_id']);

    if (!isset($_FILES['file'])) {
        respond(['success' => false, 'message' => 'No file uploaded']);
        return;
    }

    $file = $_FILES['file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        respond(['success' => false, 'message' => 'File upload error: ' . $file['error']]);
        return;
    }

    $uploadDir = __DIR__ . "/../uploads/$task_id/";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $uploadFile = $uploadDir . basename($file['name']);

    if (file_exists($uploadFile)) {
        respond(['success' => false, 'message' => 'File already exists']);
        return;
    }

    if (move_uploaded_file($file['tmp_name'], $uploadFile)) {
        $stmt = $pdo->prepare("SELECT files FROM tasks WHERE id = :task_id");
        $stmt->execute(['task_id' => $task_id]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$task) {
            respond(['success' => false, 'message' => 'Task not found']);
            return;
        }

        $files = json_decode($task['files'], true) ?? [];
        $files[] = basename($uploadFile);

        $stmt = $pdo->prepare("UPDATE tasks SET files = :files WHERE id = :task_id");
        $stmt->execute(['files' => json_encode($files), 'task_id' => $task_id]);

        respond(['success' => true, 'filePath' => $uploadFile]);
    } else {
        respond(['success' => false, 'message' => 'File upload failed']);
    }
}

function getFileList($pdo) {
    checkAuth();

    if (!isset($_GET['taskId'])) {
        respond(['success' => false, 'message' => 'Task ID is required.']);
        return;
    }

    $taskId = intval($_GET['taskId']);

    $stmt = $pdo->prepare("SELECT files FROM tasks WHERE id = :taskId");
    $stmt->execute(['taskId' => $taskId]);
    $filesJson = $stmt->fetchColumn();

    if (!$filesJson) {
        respond(['success' => false, 'message' => 'No files found for this task.']);
        return;
    }

    $filesArray = json_decode($filesJson, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        respond(['success' => false, 'message' => 'Error decoding JSON: ' . json_last_error_msg()]);
        return;
    }

    $fileList = [];
    $uploadDir = realpath(__DIR__ . '/../uploads/' . $taskId . '/');

    if (!is_dir($uploadDir)) {
        respond(['success' => false, 'message' => 'Upload directory does not exist.']);
        return;
    }

    foreach ($filesArray as $file) {
        $filePath = $uploadDir . '/' . $file;

        if (file_exists($filePath)) {
            $fileList[] = [
                'name' => $file,
                'path' => $filePath
            ];
        } else {
            error_log("File does not exist: $filePath");
        }
    }

    if (empty($fileList)) {
        respond(['success' => false, 'message' => 'No valid files found for this task.']);
    } else {
        respond(['success' => true, 'files' => $fileList]);
    }
}

function getDepartments($pdo) {
    checkAuth(['admin', 'manager']);
    $stmt = $pdo->query("SELECT DISTINCT department FROM users");
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond($departments);
}

function getWorkersByDepartment($pdo) {
    checkAuth(['admin', 'manager']);
    
    $department = $_GET['department'];
    $stmt = $pdo->prepare("SELECT id, name, last_name FROM users WHERE department = :department");
    $stmt->execute(['department' => $department]);
    $workers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($workers);
}

function getFilteredTasks($pdo) {
    checkAuth(['admin', 'manager']);
    
    $department = $_GET['department'] ?? null;
    $worker_id = $_GET['worker_id'] ?? null;

    $query = "SELECT * FROM tasks WHERE status = 'active'";
    $params = [];

    if ($department) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE department = :department");
        $stmt->execute(['department' => $department]);
        $worker_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if ($worker_ids) {
            $query .= " AND worker_id IN (" . implode(',', array_fill(0, count($worker_ids), '?')) . ")";
            $params = array_merge($params, $worker_ids);
        }
    }

    if ($worker_id) {
        $query .= " AND worker_id = :worker_id";
        $params['worker_id'] = $worker_id;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($tasks);
}

function getArchiveFilteredTasks($pdo) {
    checkAuth(['admin', 'manager']);
    
    $department = $_GET['department'] ?? null;
    $worker_id = $_GET['worker_id'] ?? null;

    $query = "SELECT * FROM tasks WHERE status = 'archive'";
    $params = [];

    if ($department) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE department = :department");
        $stmt->execute(['department' => $department]);
        $worker_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if ($worker_ids) {
            $query .= " AND worker_id IN (" . implode(',', array_fill(0, count($worker_ids), '?')) . ")";
            $params = array_merge($params, $worker_ids);
        }
    }

    if ($worker_id) {
        $query .= " AND worker_id = :worker_id";
        $params['worker_id'] = $worker_id;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($tasks);
}

function getFilteredUsers($pdo) {
    checkAuth(['admin', 'manager']);
    
    $department = $_GET['department'] ?? null;
    $role = $_GET['role'] ?? null;

    $query = "SELECT id, name, last_name, role, department FROM users WHERE 1=1";
    $params = [];

    if ($department) {
        $query .= " AND department = :department";
        $params['department'] = $department;
    }

    if ($role) {
        $query .= " AND role = :role";
        $params['role'] = $role;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($users);
}


$action = $_POST['action'] ?? $_GET['action'] ?? null;
$requestMethod = $_SERVER['REQUEST_METHOD'];

switch ($requestMethod) {
    case 'POST':
        switch ($action) {
            case 'login':
                login($pdo);
                break;
            case 'logout':
                logout();
                break;
            case 'createUser':
                createUser($pdo);
                break;
            case 'updateUser':
                updateUser($pdo);
                break;
            case 'updateUserRole':
                updateUserRole($pdo);
                break;
            case 'deleteUser':
                deleteUser($pdo);
                break;
            case 'createTask':
                createTask($pdo);
                break;
            case 'updateTaskStatus':
                updateTaskStatus($pdo);
                break;
            case 'updateTask':
                updateTask($pdo);
                break;
            case 'deleteTask':
                deleteTask($pdo);
                break;
            case 'addComment':
                addComment($pdo);
                break;
            case 'uploadFile':
                uploadFile($pdo);
                break;
            default:
                respond(['success' => false, 'message' => 'Invalid action']);
        }
        break;

    case 'GET':
        switch ($action) {
            case 'getUsers':
                getUsers($pdo);
                break;
            case 'getTasks':
                getAllTasks($pdo);
                break;
            case 'getUserTasks':
                getUserTasks($pdo);
                break;
            case 'getArchiveTasks':
                getAllArchiveTasks($pdo);
                break;
            case 'getUserArchiveTasks':
                getUserArchiveTasks($pdo);
                break;
            case 'getFileList':
                getFileList($pdo);
                break;
            case 'getDepartments':
                getDepartments($pdo);
                break;
            case 'getWorkersByDepartment':
                getWorkersByDepartment($pdo);
                break;
            case 'getFilteredTasks':
                getFilteredTasks($pdo);
                break;
            case 'getArchiveFilteredTasks':
                getArchiveFilteredTasks($pdo);
                break;
            case 'getFilteredUsers':
                getFilteredUsers($pdo)($pdo);
                break;
            default:
                respond(['success' => false, 'message' => 'Invalid action']);
        }
        break;

    default:
        respond(['success' => false, 'message' => 'Invalid request method']);
}
