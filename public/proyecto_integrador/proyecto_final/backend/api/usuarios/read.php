<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';
require_once '../../config/jwt_helper.php';

$user = get_auth_user();
// Verificamos si existe el JWT y si el payload dicta que el ROL es admin
if (!$user || $user->rol !== 'admin') {
    http_response_code(403);
    die(json_encode(["message" => "Acceso denegado. Privilegios de administrador requeridos."]));
}

try {
    $query = "SELECT id, nombre, email, rol, puntos, creado_en FROM usuarios ORDER BY id ASC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    echo json_encode(["usuarios" => $stmt->fetchAll()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de BD: " . $e->getMessage()]);
}
?>
