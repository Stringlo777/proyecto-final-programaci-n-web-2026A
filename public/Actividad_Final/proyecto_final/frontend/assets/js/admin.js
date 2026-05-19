document.addEventListener('DOMContentLoaded', () => {

    // ── Auth Check ────────────────────────────────────────────────
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userString);
    if (user.rol !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    // ── Page Transition (expuesta globalmente para onclick inline) ─
    window.navigateTo = function(url) {
        const overlay = document.getElementById('page-transition');
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = url; }, 380);
    };

    // ── Vista Toast System ────────────────────────────────────────
    function showConfirm(msg, onConfirm) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'aero-toast toast-danger';
        toast.style.cssText = 'min-width:320px;white-space:normal;flex-wrap:wrap;gap:8px;';
        toast.innerHTML = `
            <span class="toast-orb"></span>
            <span style="flex:1;font-size:.9rem;">${msg}</span>
            <div style="display:flex;gap:6px;margin-top:4px;width:100%;justify-content:flex-end;">
                <button class="btn-confirm-yes" style="background:rgba(255,255,255,0.25);color:#fff;border:1px solid rgba(255,255,255,0.55);border-radius:20px;padding:4px 14px;font-weight:700;font-size:.85rem;cursor:pointer;">Confirmar</button>
                <button class="btn-confirm-no"  style="background:rgba(0,0,0,0.3);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:4px 14px;font-weight:700;font-size:.85rem;cursor:pointer;">Cancelar</button>
            </div>`;
        container.appendChild(toast);
        const cleanup = () => {
            toast.style.animation = 'toastFadeOut 0.35s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 360);
        };
        toast.querySelector('.btn-confirm-yes').addEventListener('click', () => { cleanup(); onConfirm(); });
        toast.querySelector('.btn-confirm-no').addEventListener('click', cleanup);
        setTimeout(cleanup, 6000);
    }

    function showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `aero-toast toast-${type}`;
        toast.innerHTML = `<span class="toast-orb"></span>${msg}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.35s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 360);
        }, 3400);
    }

    // Logout with transition
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigateTo('index.html');
    });

    const usersList   = document.getElementById('usersList');
    const totalUsers  = document.getElementById('totalUsers');
    const searchUsers = document.getElementById('searchUsers');

    // Real-time user search
    searchUsers.addEventListener('input', () => {
        const q = searchUsers.value.toLowerCase().trim();
        usersList.querySelectorAll('tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });

    async function fetchUsers() {
        const res = await API.getAuth('/usuarios/read.php');
        usersList.innerHTML = '';

        if (res.status === 200) {
            const usuarios = res.data.usuarios || [];
            totalUsers.textContent = `${usuarios.length} Usuarios Registrados`;

            usuarios.forEach(u => {
                const tr = document.createElement('tr');
                const badgeClass = u.rol === 'admin' ? 'badge-admin' : 'badge-user';
                const deleteBtn = u.rol === 'admin'
                    ? `<span class="opacity-50 fst-italic text-white">🔒 Protegido</span>`
                    : `<button class="btn btn-sm rounded-pill btn-expulsar btn-delete" data-id="${u.id}">🚫 Expulsar</button>`;

                tr.innerHTML = `
                    <td>#${u.id}</td>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td>💎 <span class="fw-bold">${u.puntos}</span></td>
                    <td><span class="badge ${badgeClass} rounded-pill px-3 py-2 text-uppercase shadow-sm">${u.rol}</span></td>
                    <td>${new Date(u.creado_en).toLocaleString()}</td>
                    <td>${deleteBtn}</td>
                `;
                usersList.appendChild(tr);
            });
        } else {
            usersList.innerHTML = `<tr><td colspan="7" class="text-center text-danger fw-bold bg-light opacity-75">${res.data.message}</td></tr>`;
        }
    }

    usersList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = e.target.getAttribute('data-id');
            showConfirm('¿Expulsar al usuario? Se eliminará en cascada todo su historial y hábitos de forma permanente.', async () => {
                const res = await API.postAuth('/usuarios/delete.php', 'DELETE', { id });
                if (res.status === 200) {
                    showToast('Usuario purgado exitosamente del sistema.', 'success');
                    fetchUsers();
                } else {
                    showToast(res.data.message || 'Error de permisos al eliminar.', 'danger');
                }
            });
        }
    });

    fetchUsers();
});
