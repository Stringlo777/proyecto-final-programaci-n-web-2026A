<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';
require_once '../../config/jwt_helper.php';

$user = get_auth_user();
if (!$user) {
    http_response_code(401);
    die(json_encode(["message" => "No autorizado."]));
}

$periodo = $_GET['periodo'] ?? 'semana';

// Integer comes from a whitelist — safe to interpolate in INTERVAL clause
$days = match ($periodo) {
    'mes'  => 29,
    'anio' => 364,
    default => 6,
};

try {
    $query = "SELECT h.id, h.nombre, h.color, h.importancia, h.meta_semanal,
              COUNT(CASE WHEN r.completado = 1 THEN 1 END) as completados
              FROM habitos h
              LEFT JOIN registros_habito r ON r.habito_id = h.id
                  AND r.fecha >= DATE_SUB(CURDATE(), INTERVAL {$days} DAY)
              WHERE h.usuario_id = :user_id AND h.activo = 1
              GROUP BY h.id, h.nombre, h.color, h.importancia, h.meta_semanal
              ORDER BY h.importancia DESC, completados DESC";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":user_id", $user->id);
    $stmt->execute();
    $habitos = $stmt->fetchAll();

    $multiplier = match ($periodo) {
        'mes'  => 4,
        'anio' => 52,
        default => 1,
    };

    foreach ($habitos as &$h) {
        $h['importancia']  = (int)($h['importancia'] ?? 3);
        $h['completados']  = (int)$h['completados'];
        $h['meta_periodo'] = (int)$h['meta_semanal'] * $multiplier;
    }

    echo json_encode(["habitos" => $habitos, "periodo" => $periodo]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
