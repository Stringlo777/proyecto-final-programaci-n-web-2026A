<?php
// Configuración de encabezados para permitir peticiones del Frontend (CORS) y responder en JSON
header("Access-Control-Allow-Origin: *"); // En producción, especificar el dominio
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si es una petición OPTIONS (pre-flight de navegadores), terminamos la ejecución temprano devolviendo ok.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
