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
    // Cuenta los hábitos completados en los últimos 7 días.
    $query = "SELECT fecha, COUNT(id) as completados 
              FROM registros_habito r 
              JOIN habitos h ON r.habito_id = h.id 
              WHERE h.usuario_id = :user_id 
              AND r.completado = 1 
              AND r.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) 
              GROUP BY fecha 
              ORDER BY fecha ASC";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":user_id", $user->id);
    $stmt->execute();
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $labels = [];
    $data = [];
    
    // Rellenamos el chart para que salgan todos los 7 dias incluso con 0.
    for ($i = 6; $i >= 0; $i--) {
        $fecha_iter = date('Y-m-d', strtotime("-$i days"));
        // Formato estético para Graph: DD/MMM (ej. 15/Abril)
        $labels[] = date('d/m', strtotime("-$i days"));
        
        $encontrado = 0;
        foreach ($resultados as $row) {
            if ($row['fecha'] == $fecha_iter) {
                $encontrado = (int)$row['completados'];
                break;
            }
        }
        $data[] = $encontrado;
    }

    echo json_encode(["labels" => $labels, "data" => $data]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de Servidor: " . $e->getMessage()]);
}
?>
