<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';
require_once '../../config/jwt_helper.php';

$user = get_auth_user();
if (!$user || $user->rol !== 'admin') {
    http_response_code(403);
    die(json_encode(["message" => "Acceso denegado. Privilegios de administrador requeridos."]));
}

$data = json_decode(file_get_contents("php://input"));
if (!empty($data->id)) {
    try {
        if ($data->id == $user->id) {
            http_response_code(400); // Bad Request (Lógica de negocio)
            die(json_encode(["message" => "Operación inválida: No puedes eliminar tu propia cuenta de Administrador de esta forma."]));
        }

        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = :id AND rol != 'admin'");
        $stmt->bindParam(":id", $data->id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Usuario eliminado."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "El usuario no existe o ya fue eliminado."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error de BD."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Se requiere ID de usuario."]);
}
?>
