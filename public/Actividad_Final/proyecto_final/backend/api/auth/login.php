<?php
require_once '../../config/cors.php';
require_once '../../config/conexion.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    try {
        $email = htmlspecialchars(strip_tags($data->email));
        
        $query = "SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = :email";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $usuario = $stmt->fetch();
            
            if (password_verify($data->password, $usuario['password_hash'])) {
                
                // JWT Casero (Para cumplir de manera elegante sin librerías de composer en este nivel)
                $secret_key = "universidad_proyecto_secreto"; // Clave secreta fija
                
                $header = json_encode(["alg" => "HS256", "typ" => "JWT"]);
                $payload = json_encode([
                    "id" => $usuario['id'],
                    "nombre" => $usuario['nombre'],
                    "email" => $usuario['email'],
                    "rol" => $usuario['rol'],
                    "exp" => time() + (86400 * 7) // 7 dias
                ]);
                
                // Base64Url_Encode function for strict JWT format
                function base64UrlEncode($text) {
                    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
                }

                $base64UrlHeader = base64UrlEncode($header);
                $base64UrlPayload = base64UrlEncode($payload);
                $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret_key, true);
                $base64UrlSignature = base64UrlEncode($signature);
                
                $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

                http_response_code(200);
                echo json_encode([
                    "message" => "Login exitoso.",
                    "token" => $jwt,
                    "usuario" => [
                        "id" => $usuario['id'],
                        "nombre" => $usuario['nombre'],
                        "rol" => $usuario['rol']
                    ]
                ]);
            } else {
                http_response_code(401); 
                echo json_encode(["message" => "Contraseña incorrecta."]);
            }
        } else {
            http_response_code(404); 
            echo json_encode(["message" => "El usuario no existe."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error de BD: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Datos incompletos. Se requiere email y password."]);
}
?>
