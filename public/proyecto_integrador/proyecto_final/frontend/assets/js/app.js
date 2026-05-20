document.addEventListener('DOMContentLoaded', () => {

    // ── Page Transition ───────────────────────────────────────────
    function navigateTo(url) {
        const overlay = document.getElementById('page-transition');
        if (overlay) {
            overlay.classList.add('active');
            setTimeout(() => { window.location.href = url; }, 380);
        } else {
            window.location.href = url;
        }
    }

    // UI Elements
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    const loginAlert = document.getElementById('login-alert');
    const registerAlert = document.getElementById('register-alert');

    // Manejo del Login/Register Toggle
    if (showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'none';
            // Simple fade in effect
            registerContainer.style.opacity = '0';
            registerContainer.style.display = 'block';
            setTimeout(() => registerContainer.style.opacity = '1', 50);
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.style.display = 'none';
            loginContainer.style.opacity = '0';
            loginContainer.style.display = 'block';
            setTimeout(() => loginContainer.style.opacity = '1', 50);
        });
    }

    // Helper: Mostrar alertas de Bootstrap/Glass
    function showAlert(element, message, isSuccess = false) {
        element.style.display = 'block';
        element.textContent = message;
        element.style.background = isSuccess ? 'rgba(56, 176, 0, 0.6)' : 'rgba(255, 0, 0, 0.5)';
        element.style.borderColor = isSuccess ? 'rgba(112, 224, 0, 0.8)' : 'rgba(255, 100, 100, 0.8)';
        
        // Auto ocultar después de 5 segundos
        setTimeout(() => { element.style.display = 'none'; }, 5000);
    }

    // Lógica de Submit LOGIN
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verificando...';

            const res = await API.post('/auth/login.php', { email, password });
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar Sesión';

            if(res.status === 200) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.usuario));
                showAlert(loginAlert, "¡Acceso correcto! Redirigiendo...", true);

                const destino = res.data.usuario.rol === 'admin' ? 'admin.html' : 'dashboard.html';
                setTimeout(() => navigateTo(destino), 800);
            } else {
                showAlert(loginAlert, res.data.message || "Usuario o contraseña inválidos");
            }
        });
    }

    // Lógica de Submit REGISTER
    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('regNombre').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creando...';

            const res = await API.post('/auth/register.php', { nombre, email, password });
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Cuenta';

            if(res.status === 201) {
                showAlert(registerAlert, "Registro exitoso. ¡Ya puedes iniciar sesión!", true);
                registerForm.reset();
                setTimeout(() => {
                    showLoginBtn.click(); // Regresar a la vista de login automáticamente
                }, 2500);
            } else {
                showAlert(registerAlert, res.data.message || "No se pudo crear la cuenta (Es posible que el correo ya exista).");
            }
        });
    }

    // Protección Básica Frontend: Si ya hay un token y estamos en index.html, lo enviamos al Dashboard automático
    const existingToken = localStorage.getItem('token');
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    
    if(existingToken && isIndex) {
        const savedUser = localStorage.getItem('user');
        const rol = savedUser ? JSON.parse(savedUser).rol : 'user';
        window.location.href = rol === 'admin' ? 'admin.html' : 'dashboard.html';
    }
});
