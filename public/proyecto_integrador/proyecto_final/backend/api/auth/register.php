<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->nombre) && !empty($data->email) && !empty($data->password) && strlen($data->password) >= 6) {
    try {
        $check_query = "SELECT id FROM usuarios WHERE email = :email";
        $check_stmt = $pdo->prepare($check_query);
        $check_stmt->bindParam(":email", $data->email);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            http_response_code(400); 
            echo json_encode(["message" => "El correo electrónico ya está registrado."]);
            exit();
        }

        $query = "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (:nombre, :email, :password_hash, 'user')";
        $stmt = $pdo->prepare($query);

        $nombre = htmlspecialchars(strip_tags($data->nombre));
        $email = htmlspecialchars(strip_tags($data->email));
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

        $stmt->bindParam(":nombre", $nombre);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password_hash", $password_hash);

        if ($stmt->execute()) {
            http_response_code(201); 
            echo json_encode(["message" => "Usuario registrado exitosamente."]);
        } else {
            http_response_code(503); 
            echo json_encode(["message" => "No se pudo registrar el usuario."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error del servidor: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Datos incompletos. Nombre, email y contraseña (mín. 6 caracteres) son obligatorios."]);
}
?>
