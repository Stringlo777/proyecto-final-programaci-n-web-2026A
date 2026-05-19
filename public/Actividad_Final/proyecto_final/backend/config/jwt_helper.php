<?php
// Utilidad para extraer y verificar la firma HMAC SHA256 del JWT casero

function verify_jwt($jwt, $secret_key = "universidad_proyecto_secreto") {
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) return false;

    $header = $tokenParts[0];
    $payload = $tokenParts[1];
    $signature_provided = $tokenParts[2];

    // Verificar firma re-calculándola
    $signature = hash_hmac('sha256', $header . "." . $payload, $secret_key, true);
    
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    // ¿Firmas coinciden?
    if ($signature_provided !== $base64UrlSignature) {
        return false;
    }

    // Decodificar Base64Url → Base64 estándar (añadir padding perdido)
    $paddedPayload = str_replace(['-', '_'], ['+', '/'], $payload);
    $paddedPayload .= str_repeat('=', (4 - strlen($paddedPayload) % 4) % 4);
    $payloadDecoded = json_decode(base64_decode($paddedPayload));
    
    // Verificar expiración
    if ($payloadDecoded->exp < time()) {
        return false;
    }

    return $payloadDecoded;
}

// Extrae el Bearer token del Header HTTP
function get_auth_user() {
    // apache_request_headers() o $_SERVER cubren las diferentes APIS
    $headers = null;
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    } else {
        $headers = array();
        foreach ($_SERVER as $key => $value) {
            if (substr($key, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))))] = $value;
            }
        }
    }

    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwt = $matches[1];
        return verify_jwt($jwt);
    }
    
    return false;
}
?>
