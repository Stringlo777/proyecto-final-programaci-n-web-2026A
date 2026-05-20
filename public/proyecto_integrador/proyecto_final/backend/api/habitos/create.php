<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';
require_once '../../config/jwt_helper.php';

// Validar seguridad Middleware
$user = get_auth_user();
if (!$user) {
    http_response_code(401);
    die(json_encode(["message" => "No autorizado. Token ausente, alterado o expirado."]));
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->nombre) && !empty($data->frecuencia)) {
    try {
        $query = "INSERT INTO habitos (usuario_id, nombre, descripcion, frecuencia, meta_semanal, color, importancia) VALUES (:user_id, :nombre, :descripcion, :frecuencia, :meta, :color, :importancia)";
        $stmt = $pdo->prepare($query);

        $nombre = htmlspecialchars(strip_tags($data->nombre));
        $descripcion = isset($data->descripcion) ? htmlspecialchars(strip_tags($data->descripcion)) : null;
        $frecuencia = htmlspecialchars(strip_tags($data->frecuencia));
        $meta = isset($data->meta_semanal) ? (int)$data->meta_semanal : 7;
        $color = isset($data->color) ? htmlspecialchars(strip_tags($data->color)) : '#0077b6';
        $importancia = isset($data->importancia) ? max(1, min(5, (int)$data->importancia)) : 3;

        $stmt->bindParam(":user_id", $user->id);
        $stmt->bindParam(":nombre", $nombre);
        $stmt->bindParam(":descripcion", $descripcion);
        $stmt->bindParam(":frecuencia", $frecuencia);
        $stmt->bindParam(":meta", $meta);
        $stmt->bindParam(":color", $color);
        $stmt->bindParam(":importancia", $importancia);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Hábito creado correctamente.", "id" => $pdo->lastInsertId()]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Ocurrió un error al guardar."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error interno: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Nombre y frecuencia son obligatorios."]);
}
?>
