<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';
require_once '../../config/jwt_helper.php';

$user = get_auth_user();
if (!$user) {
    http_response_code(401);
    die(json_encode(["message" => "No autorizado."]));
}

try {
    // Para renderizar correctamente SPRINT 4, traemos los metadatos pero añadiendo
    // si el hábito ya fue completado HOY (basado en registros_habito fecha=CURDATE)
    $query = "SELECT h.id, h.nombre, h.descripcion, h.frecuencia, h.meta_semanal, h.color, h.importancia, h.activo, h.creado_en,
              IF(r.completado IS NULL, 0, r.completado) as completado_hoy,
              (SELECT COUNT(*) FROM registros_habito rh
               WHERE rh.habito_id = h.id AND rh.completado = 1
               AND rh.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)) as racha_semanal
              FROM habitos h
              LEFT JOIN registros_habito r ON h.id = r.habito_id AND r.fecha = CURDATE()
              WHERE h.usuario_id = :user_id
              ORDER BY h.id DESC";
              
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":user_id", $user->id);
    $stmt->execute();
    
    $habitos = $stmt->fetchAll();
    
    // Sprint 5: Obtener los puntos globales del usuario para Scoreboard
    $stmt_pt = $pdo->prepare("SELECT puntos FROM usuarios WHERE id = :id");
    $stmt_pt->execute([':id' => $user->id]);
    $puntos = $stmt_pt->fetchColumn();
    
    echo json_encode([
        "habitos" => $habitos,
        "puntos"  => $puntos
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener hábitos: " . $e->getMessage()]);
}
?>
