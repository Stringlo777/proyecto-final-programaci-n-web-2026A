// Auto-detecta el servidor: funciona con Laragon (proyecto_final.test),
// PHP built-in server (localhost:8000) y localhost/proyecto_final
const _path = window.location.pathname;
const _root = _path.includes('/frontend/') ? _path.substring(0, _path.indexOf('/frontend/')) : '';
const API_BASE_URL = window.location.origin + _root + '/backend/api';


const API = {
    /**
     * Endpoint sin autenticación (Login / Register)
     */
    post: async (endpoint, payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return { status: response.status, data };
        } catch (error) {
            console.error("Fetch Error:", error);
            return { status: 500, data: { message: "Error de conexión al servidor (Puede que no esté corriendo XAMPP/Servidor local)." } };
        }
    },

    /**
     * Petición Authenticated Petición GET
     */
    getAuth: async (endpoint) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return { status: response.status, data: await response.json() };
        } catch (error) {
            return { status: 500, data: { message: "Error de red." } };
        }
    },

    /**
     * Petición Authenticated POST / PUT / DELETE
     */
    postAuth: async (endpoint, method = 'POST', payload = {}) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            return { status: response.status, data: await response.json() };
        } catch (error) {
            return { status: 500, data: { message: "Error en la petición autenticada." } };
        }
    }
};
