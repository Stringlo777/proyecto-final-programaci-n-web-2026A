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

if (!empty($data->id) && !empty($data->nombre)) {
    try {
        // Un usuario NO debe poder editar el hábito de OTRO, validamos usuario_id = user->id
        $query = "UPDATE habitos SET nombre = :nombre, descripcion = :descripcion, frecuencia = :frecuencia, meta_semanal = :meta, color = :color, importancia = :importancia WHERE id = :id AND usuario_id = :user_id";
        $stmt = $pdo->prepare($query);

        $nombre = htmlspecialchars(strip_tags($data->nombre));
        $descripcion = isset($data->descripcion) ? htmlspecialchars(strip_tags($data->descripcion)) : null;
        $frecuencia = isset($data->frecuencia) ? htmlspecialchars(strip_tags($data->frecuencia)) : 'diaria';
        $meta = isset($data->meta_semanal) ? (int)$data->meta_semanal : 7;
        $color = isset($data->color) ? htmlspecialchars(strip_tags($data->color)) : '#0077b6';
        $importancia = isset($data->importancia) ? max(1, min(5, (int)$data->importancia)) : 3;

        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":user_id", $user->id);
        $stmt->bindParam(":nombre", $nombre);
        $stmt->bindParam(":descripcion", $descripcion);
        $stmt->bindParam(":frecuencia", $frecuencia);
        $stmt->bindParam(":meta", $meta);
        $stmt->bindParam(":color", $color);
        $stmt->bindParam(":importancia", $importancia);

        if ($stmt->execute()) {
            if($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(["message" => "Hábito actualizado."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "No se encontró el hábito o no te pertenece."]);
            }
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Error al actualizar."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error interno: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios (ID, nombre)."]);
}
?>
