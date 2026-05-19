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

if (!empty($data->habito_id)) {
    try {
        // Verificar que el hábito pertenece a este usuario por seguridad
        $verify = $pdo->prepare("SELECT id FROM habitos WHERE id = :habito_id AND usuario_id = :user_id");
        $verify->bindParam(":habito_id", $data->habito_id);
        $verify->bindParam(":user_id", $user->id);
        $verify->execute();

        if ($verify->rowCount() === 0) {
            http_response_code(403);
            die(json_encode(["message" => "Hábito no encontrado o no te pertenece."]));
        }

        $hoy = date("Y-m-d");

        // Buscar si ya hay un registro hoy
        $query = "SELECT id, completado FROM registros_habito WHERE habito_id = :habito_id AND fecha = :fecha";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(":habito_id", $data->habito_id);
        $stmt->bindParam(":fecha", $hoy);
        $stmt->execute();

        $nuevo_estado = true;

        $puntos_delta = 0;

        if ($stmt->rowCount() > 0) {
            // Ya existe, hacemos un TOGGLE (alternar entre 1 y 0)
            $registro = $stmt->fetch();
            $nuevo_estado = !$registro['completado'];

            $update = $pdo->prepare("UPDATE registros_habito SET completado = :estado WHERE id = :id");
            $val = intval($nuevo_estado);
            $update->bindParam(":estado", $val, PDO::PARAM_INT);
            $update->bindParam(":id", $registro['id']);
            $update->execute();
            
            $puntos_delta = $nuevo_estado ? 10 : -10;
        } else {
            // No existe, creamos el check en TRUE
            $insert = $pdo->prepare("INSERT INTO registros_habito (habito_id, fecha, completado) VALUES (:habito_id, :fecha, 1)");
            $insert->bindParam(":habito_id", $data->habito_id);
            $insert->bindParam(":fecha", $hoy);
            $insert->execute();
            $nuevo_estado = true;
            
            $puntos_delta = 10;
        }

        // Gamificación: Actualizar puntos en la DB
        if ($puntos_delta !== 0) {
            $up_points = $pdo->prepare("UPDATE usuarios SET puntos = GREATEST(0, puntos + :delta) WHERE id = :id");
            $up_points->execute([':delta' => $puntos_delta, ':id' => $user->id]);
        }
        
        // Obtener nuevos puntos para actualizar UI
        $pts_stmt = $pdo->prepare("SELECT puntos FROM usuarios WHERE id = :id");
        $pts_stmt->execute([':id' => $user->id]);
        $nuevos_puntos = $pts_stmt->fetchColumn();

        http_response_code(200);
        echo json_encode([
            "message" => $nuevo_estado ? "¡Hábito Completado Hoy! (+10 Puntos)" : "Progreso desmarcado. (-10 Puntos)",
            "completado_hoy" => $nuevo_estado,
            "puntos" => $nuevos_puntos
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error de BD: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "ID de hábito requerido."]);
}
?>
