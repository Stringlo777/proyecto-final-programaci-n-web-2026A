<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';
require_once '../../config/jwt_helper.php';

$user = get_auth_user();
if (!$user) {
    http_response_code(401);
    die(json_encode(["message" => "No autorizado."]));
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        // Solo puede eliminar si es suyo
        $query = "DELETE FROM habitos WHERE id = :id AND usuario_id = :user_id";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":user_id", $user->id);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(["message" => "Hábito eliminado correctamente (y su historial en cascada)."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "El hábito no existe o no te pertenece."]);
            }
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar el hábito."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error de BD: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Se requiere un ID válido para eliminar."]);
}
?>
