<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "habitos_db";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    // Activar el modo de errores detallados y el retorno de arrays asociativos por defecto
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Mejor protección SQL inyección
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión a la Base de Datos: " . $e->getMessage()]));
}
?>
