document.addEventListener('DOMContentLoaded', () => {

    // ── Auth Check ────────────────────────────────────────────────
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    if (!token || !userString) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userString);
    document.getElementById('userNameDisplay').textContent = `Hola, ${user.nombre.split(' ')[0]} ✨`;

    // Admin button injection
    function insertAdminBtn() {
        if (document.getElementById('adminNavBtn')) return;
        const adminBtn = document.createElement('button');
        adminBtn.id = 'adminNavBtn';
        adminBtn.className = 'btn btn-sm rounded-pill fw-bold me-3';
        adminBtn.style.cssText = 'background:linear-gradient(135deg,rgba(255,0,110,0.5),rgba(200,0,80,0.4));color:#fff;border:1px solid rgba(255,100,150,0.7);backdrop-filter:blur(5px);';
        adminBtn.textContent = '🛡️ Mi Panel';
        adminBtn.addEventListener('click', () => navigateTo('admin.html'));
        document.getElementById('btnLogout').before(adminBtn);
    }

    // Mostrar si localStorage ya tiene rol admin
    if (user.rol === 'admin') insertAdminBtn();

    // Siempre verificar rol real en DB via RPC (bypasea RLS)
    if (typeof _supabase !== 'undefined') {
        _supabase.rpc('get_my_profile').then(({ data: arr }) => {
            const p = arr?.[0];
            if (!p) return;
            if (p.rol !== user.rol) {
                user.rol = p.rol;
                localStorage.setItem('user', JSON.stringify(user));
            }
            if (p.rol === 'admin') insertAdminBtn();
        });
    }

    // Logout — sin confirmación, la transición de página es feedback suficiente
    document.getElementById('btnLogout').addEventListener('click', async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof _supabase !== 'undefined') await _supabase.auth.signOut();
        navigateTo('index.html');
    });

    // ── UI References ─────────────────────────────────────────────
    const habitsGrid        = document.getElementById('habitsGrid');
    const emptyState        = document.getElementById('empty-state');
    const searchEmpty       = document.getElementById('search-empty');
    const habitForm         = document.getElementById('habitForm');
    const searchInput       = document.getElementById('searchHabits');
    const habitModalEl      = document.getElementById('habitModal');
    const importanciaSlider = document.getElementById('hImportancia');
    const importanciaDisplay= document.getElementById('importanciaDisplay');

    const STARS = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

    importanciaSlider.addEventListener('input', () => {
        importanciaDisplay.textContent = STARS[importanciaSlider.value];
    });

    function getModal() {
        if (typeof bootstrap !== 'undefined') {
            return bootstrap.Modal.getOrCreateInstance(habitModalEl);
        }
        return null;
    }

    // ── Page Transition ───────────────────────────────────────────
    function navigateTo(url) {
        const overlay = document.getElementById('page-transition');
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = url; }, 380);
    }

    // ── Vista Toast System ────────────────────────────────────────
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

    // ── Aero Confirm Toast ────────────────────────────────────────
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

    // ── Particle Burst on completion ──────────────────────────────
    function burstParticles(el) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const colors = ['#70e000', '#00b4d8', '#ffffff', '#ffe566', '#90e0ef', '#aaff40'];

        for (let i = 0; i < 14; i++) {
            const p = document.createElement('div');
            const angle = (i / 14) * 360;
            const dist = 55 + Math.random() * 45;
            const size = 6 + Math.random() * 7;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const rad = (angle * Math.PI) / 180;

            p.style.cssText = `
                position:fixed;left:${cx}px;top:${cy}px;
                width:${size}px;height:${size}px;border-radius:50%;
                background:${color};box-shadow:0 0 8px ${color};
                pointer-events:none;z-index:9998;
                transform:translate(-50%,-50%);
                transition:transform 0.65s ease-out,opacity 0.65s ease-out;
                opacity:1;
            `;
            document.body.appendChild(p);

            // Forzar reflow para que el navegador pinte el estado inicial
            // antes de aplicar la transición al estado final
            p.getBoundingClientRect();

            p.style.transform = `translate(calc(-50% + ${Math.cos(rad) * dist}px), calc(-50% + ${Math.sin(rad) * dist}px)) scale(0)`;
            p.style.opacity = '0';

            setTimeout(() => { if (p.parentNode) p.remove(); }, 720);
        }
    }

    // ── Live search ───────────────────────────────────────────────
    searchInput.addEventListener('input', applySearch);

    function applySearch() {
        const q = searchInput.value.toLowerCase().trim();
        let visible = 0;
        habitsGrid.querySelectorAll('.col-md-6').forEach(col => {
            const nombre = col.querySelector('h5')?.textContent.toLowerCase() || '';
            const show = !q || nombre.includes(q);
            col.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        // Mostrar mensaje "sin resultados" solo cuando hay búsqueda activa y ninguna tarjeta coincide
        if (searchEmpty) {
            searchEmpty.style.display = (q && visible === 0) ? 'block' : 'none';
        }
    }

    // ── Fetch Habits ──────────────────────────────────────────────
    let cardIndex = 0;

    async function fetchHabits() {
        const res = await API.getAuth('/habitos/read.php');
        habitsGrid.innerHTML = '';
        cardIndex = 0;

        if (res.status === 200) {
            document.getElementById('scoreDisplay').textContent = `💎 ${res.data.puntos || 0} Puntos`;
            const habitos = res.data.habitos || [];

            summaryHabits = habitos;
            if (habitos.length === 0) {
                emptyState.style.display = 'block';
                renderSummarySection([]);
            } else {
                emptyState.style.display = 'none';
                habitos.forEach(hab => renderHabitCard(hab));
                applySearch();
                renderSummarySection(habitos);
            }

        } else if (res.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
        } else {
            showToast('Error al conectar con la base de datos.', 'danger');
            emptyState.style.display = 'block';
        }
    }

    // ── Render Habit Card ─────────────────────────────────────────
    function renderHabitCard(hab) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4 position-relative z-1 card-enter';
        col.style.animationDelay = `${cardIndex * 0.07}s`;
        cardIndex++;

        const isCompleted = parseInt(hab.completado_hoy) === 1;
        const racha = parseInt(hab.racha_semanal) || 0;
        const meta  = parseInt(hab.meta_semanal)  || 7;
        const pct   = Math.min(100, Math.round((racha / meta) * 100));
        const freqColor  = hab.frecuencia === 'diaria' ? '#00b4d8' : '#70e000';
        const rachaColor = pct >= 100 ? '#70e000' : pct >= 50 ? '#00b4d8' : 'rgba(255,255,255,0.5)';
        const cardGlow   = isCompleted ? ' glow-success' : '';
        const btnClass   = isCompleted ? 'btn-success-aero' : 'btn-aero';
        const btnText    = isCompleted ? '✨ Completado Hoy' : '✅ Marcar Realizado Hoy';

        col.innerHTML = `
            <div class="habit-card p-4 h-100 d-flex flex-column${cardGlow}" style="--habit-color:${hab.color || '#0077b6'};">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="mb-0 text-truncate pe-2" title="${hab.nombre}">${hab.nombre}</h5>
                    <div class="dropdown">
                        <button class="btn btn-sm rounded-circle d-flex align-items-center justify-content-center text-white"
                                type="button" data-bs-toggle="dropdown"
                                style="background:rgba(255,255,255,0.2);width:30px;height:30px;line-height:1;">⋮</button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0"
                            style="background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);">
                            <li><a class="dropdown-item fw-bold text-primary edit-btn" href="#" data-id="${hab.id}" data-nombre="${hab.nombre}">✏️ Editar</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item fw-bold text-danger delete-btn" href="#" data-id="${hab.id}" data-nombre="${hab.nombre}">🗑 Eliminar</a></li>
                        </ul>
                    </div>
                </div>

                <p class="mb-3 opacity-75 flex-grow-1" style="font-size:.95rem;">${hab.descripcion || 'Sin descripción adicional.'}</p>

                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2" style="font-size:.8rem;color:rgba(255,255,255,0.85);">
                        <span>Progreso semanal</span>
                        <span style="font-weight:800;color:${rachaColor};">${racha} / ${meta} días</span>
                    </div>
                    <div class="progress-gel-track">
                        <div class="progress-gel" style="width:${pct}%;"></div>
                    </div>
                </div>

                <div class="pt-2 border-top d-flex justify-content-between align-items-center"
                     style="border-color:rgba(255,255,255,0.28)!important;">
                    <span class="badge rounded-pill fw-bold text-uppercase px-3 py-2"
                          style="background:${freqColor};box-shadow:0 2px 6px rgba(0,0,0,0.22);">${hab.frecuencia}</span>
                    <span class="text-white fw-bold badge py-2"
                          style="background:rgba(0,0,0,0.22);">Meta: ${meta}/sem</span>
                </div>

                <button class="btn ${btnClass} w-100 mt-3 rounded-pill fw-bold action-check text-uppercase shadow"
                        data-id="${hab.id}" style="padding:10px;transition:all 0.3s ease;">
                    ${btnText}
                </button>
            </div>`;
        habitsGrid.appendChild(col);
    }

    // ── Create / Edit Form ────────────────────────────────────────
    habitForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = habitForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        const id = document.getElementById('habitId').value;
        const payload = {
            nombre:       document.getElementById('hNombre').value.trim(),
            descripcion:  document.getElementById('hDesc').value.trim(),
            frecuencia:   document.getElementById('hFreq').value,
            meta_semanal: document.getElementById('hMeta').value,
            color:        document.getElementById('hColor').value,
            importancia:  parseInt(importanciaSlider.value)
        };

        let res;
        if (id) {
            payload.id = id;
            res = await API.postAuth('/habitos/update.php', 'PUT', payload);
        } else {
            res = await API.postAuth('/habitos/create.php', 'POST', payload);
        }

        btn.disabled = false;
        btn.textContent = 'Guardar Metas';

        if (res.status === 201 || res.status === 200) {
            const modal = getModal();
            if (modal) modal.hide();
            showToast(res.data.message || 'Hábito guardado correctamente.', 'success');
            await fetchHabits();
        } else {
            showToast(res.data.message || 'Error al guardar. Intenta de nuevo.', 'danger');
        }
    });

    // Reset form on modal close
    habitModalEl.addEventListener('hidden.bs.modal', () => {
        habitForm.reset();
        document.getElementById('habitId').value = '';
        document.getElementById('modalTitle').textContent = 'Nuevo Hábito ✨';
        document.getElementById('hColor').value = '#00b4d8';
        importanciaSlider.value = '3';
        importanciaDisplay.textContent = STARS[3];
    });

    // ── Card Event Delegation ─────────────────────────────────────
    habitsGrid.addEventListener('click', async (e) => {

        // DELETE — confirmación con toast
        if (e.target.classList.contains('delete-btn')) {
            e.preventDefault();
            const id = e.target.getAttribute('data-id');
            const nombre = e.target.getAttribute('data-nombre') || 'este hábito';
            showConfirm(`¿Eliminar "${nombre}"? Se borrará todo su historial.`, async () => {
                const res = await API.postAuth('/habitos/delete.php', 'DELETE', { id });
                if (res.status === 200) {
                    showToast('Hábito eliminado correctamente.', 'success');
                    await fetchHabits();
                } else {
                    showToast(res.data.message || 'Error al eliminar.', 'danger');
                }
            });
        }

        // EDIT — muestra el nombre del hábito en el título del modal
        if (e.target.classList.contains('edit-btn')) {
            e.preventDefault();
            const id = e.target.getAttribute('data-id');
            const nombre = e.target.getAttribute('data-nombre') || '';
            const res = await API.getAuth('/habitos/read.php');
            if (res.status === 200) {
                const hab = res.data.habitos.find(h => h.id == id);
                if (hab) {
                    document.getElementById('habitId').value    = hab.id;
                    document.getElementById('hNombre').value    = hab.nombre;
                    document.getElementById('hDesc').value      = hab.descripcion || '';
                    document.getElementById('hFreq').value      = hab.frecuencia;
                    document.getElementById('hMeta').value      = hab.meta_semanal;
                    document.getElementById('hColor').value     = hab.color || '#00b4d8';
                    const imp = hab.importancia || 3;
                    importanciaSlider.value      = imp;
                    importanciaDisplay.textContent = STARS[imp];
                    document.getElementById('modalTitle').textContent = `✏️ Editando: ${hab.nombre}`;
                    const modal = getModal();
                    if (modal) modal.show();
                }
            }
        }

        // TOGGLE done for today
        if (e.target.classList.contains('action-check')) {
            e.preventDefault();
            const btn  = e.target;
            const id   = btn.getAttribute('data-id');
            const card = btn.closest('.habit-card');

            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Guardando...`;

            const res = await API.postAuth('/registros/toggle.php', 'POST', { habito_id: id });
            btn.disabled = false;

            if (res.status === 200) {
                document.getElementById('scoreDisplay').textContent = `💎 ${res.data.puntos} Puntos`;
                if (res.data.completado_hoy) {
                    btn.className = 'btn btn-success-aero w-100 mt-3 rounded-pill fw-bold action-check text-uppercase shadow';
                    btn.innerHTML = '✨ Completado Hoy';
                    card.classList.add('glow-success');
                    burstParticles(btn);
                    showToast('¡Hábito completado! +10 puntos 🎉', 'success');
                } else {
                    btn.className = 'btn btn-aero w-100 mt-3 rounded-pill fw-bold action-check text-uppercase shadow';
                    btn.innerHTML = '✅ Marcar Realizado Hoy';
                    card.classList.remove('glow-success');
                    showToast('Hábito desmarcado.', 'info');
                }
                // Update "completados hoy" chip without full re-render
                const habToggled = summaryHabits.find(h => h.id == id);
                if (habToggled) {
                    habToggled.completado_hoy = res.data.completado_hoy ? 1 : 0;
                    renderSummarySection(summaryHabits);
                }
            } else {
                showToast(res.data.message || 'Error al guardar.', 'danger');
                btn.innerHTML = '✅ Marcar Realizado Hoy';
            }
        }
    });

    // ── Summary Stats + Daily Quote ───────────────────────────────
    let summaryHabits = [];

    const QUOTES = [
        { text: "Primero formas tus hábitos, luego tus hábitos te forman a ti.", author: "John Dryden" },
        { text: "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.", author: "Augusta F. Kantra" },
        { text: "No tienes que ser grande para empezar, pero tienes que empezar para ser grande.", author: "Zig Ziglar" },
        { text: "La motivación te pone en marcha. El hábito te mantiene en camino.", author: "Jim Ryun" },
        { text: "Las grandes cosas no se hacen por impulso, sino por una serie de pequeñas cosas unidas.", author: "Vincent Van Gogh" },
        { text: "La excelencia no es un acto, es un hábito.", author: "Aristóteles" },
        { text: "Somos lo que hacemos repetidamente. La excelencia, entonces, no es un acto sino un hábito.", author: "Aristóteles" },
        { text: "Un viaje de mil millas comienza con un solo paso.", author: "Lao-Tsé" },
        { text: "El secreto para salir adelante es comenzar.", author: "Mark Twain" },
        { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
        { text: "La constancia es la madre del éxito.", author: "Proverbio" },
        { text: "Pequeños progresos diarios llevan a grandes resultados.", author: "Anónimo" },
        { text: "Tu único competidor eres tú mismo de ayer.", author: "Anónimo" },
        { text: "El cuerpo logra lo que la mente cree.", author: "Anónimo" },
        { text: "Cada día es una nueva oportunidad para mejorar.", author: "Anónimo" },
        { text: "No esperes el momento perfecto. Toma el momento y hazlo perfecto.", author: "Anónimo" },
        { text: "Haz cada día algo que te acerque más a tus metas.", author: "Anónimo" },
        { text: "Los hábitos son primero telarañas, luego cables.", author: "Proverbio español" },
        { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
        { text: "Trabaja en silencio, deja que el éxito haga el ruido.", author: "Anónimo" },
    ];

    function renderDailyQuote() {
        const dateStr = new Date().toDateString();
        let seed = 0;
        for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);
        const q = QUOTES[seed % QUOTES.length];
        document.getElementById('quote-text').textContent = `"${q.text}"`;
        document.getElementById('quote-author').textContent = `— ${q.author}`;
    }

    function renderSummarySection(habitos) {
        if (!habitos || habitos.length === 0) {
            document.getElementById('stat-hoy').textContent    = '0/0';
            document.getElementById('stat-racha').textContent  = '0 días';
            document.getElementById('stat-camino').textContent = '0%';
            return;
        }
        const completadosHoy = habitos.filter(h => parseInt(h.completado_hoy) === 1).length;
        const mejorRacha     = Math.max(...habitos.map(h => parseInt(h.racha_semanal) || 0));
        const enCamino       = Math.round(
            (habitos.filter(h => {
                const racha = parseInt(h.racha_semanal) || 0;
                const meta  = parseInt(h.meta_semanal)  || 1;
                return (racha / meta) >= 0.5;
            }).length / habitos.length) * 100
        );
        document.getElementById('stat-hoy').textContent    = `${completadosHoy}/${habitos.length}`;
        document.getElementById('stat-racha').textContent  = `${mejorRacha} días`;
        document.getElementById('stat-camino').textContent = `${enCamino}%`;
    }

    // ── Habit Analysis Modal ──────────────────────────────────────
    let habitStatsChartInstance = null;
    let currentStatsPeriod = 'semana';

    function hexToRgba(hex, alpha) {
        const h = hex.replace('#', '');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    async function loadStatsModal(periodo) {
        const wrapper = document.getElementById('statsChartWrapper');
        wrapper.innerHTML = '<div class="text-center py-5"><div class="aqua-spinner mx-auto"></div></div>';

        const res = await API.getAuth(`/habitos/habit_stats.php?periodo=${periodo}`);
        if (res.status !== 200) {
            wrapper.innerHTML = '<p class="text-center fw-bold py-4" style="color:rgba(255,100,100,0.9);">Error al cargar estadísticas.</p>';
            return;
        }

        const habitos = res.data.habitos || [];
        if (habitos.length === 0) {
            wrapper.innerHTML = '<p class="text-center py-5 fw-bold" style="color:rgba(255,255,255,0.6);">No tienes hábitos registrados aún.</p>';
            return;
        }

        const chartHeight = Math.max(280, habitos.length * 58 + 60);
        wrapper.style.minHeight = chartHeight + 'px';
        wrapper.innerHTML = '<canvas id="habitStatsChart"></canvas>';

        const ctx = document.getElementById('habitStatsChart').getContext('2d');
        if (habitStatsChartInstance) habitStatsChartInstance.destroy();

        const importanceAlpha = { 1: 0.28, 2: 0.48, 3: 0.68, 4: 0.86, 5: 1.0 };

        const labels     = habitos.map(h => h.nombre);
        const data       = habitos.map(h => h.completados);
        const metas      = habitos.map(h => h.meta_periodo);
        const bgColors   = habitos.map(h => hexToRgba(h.color || '#0077b6', importanceAlpha[h.importancia] ?? 0.68));
        const borders    = habitos.map(h => h.color || '#0077b6');
        const impLabels  = habitos.map(h => STARS[h.importancia] || '⭐⭐⭐');

        habitStatsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Completados',
                        data,
                        backgroundColor: bgColors,
                        borderColor: borders,
                        borderWidth: 2,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        label: 'Meta del período',
                        data: metas,
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255,255,255,0.75)',
                            font: { family: 'Inter', weight: 'bold', size: 12 },
                            boxWidth: 14,
                            padding: 18
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,20,50,0.9)',
                        titleColor: 'rgba(255,255,255,0.9)',
                        bodyColor: 'rgba(200,230,255,0.85)',
                        padding: 12,
                        callbacks: {
                            label: (ctx) => {
                                if (ctx.datasetIndex === 0) {
                                    return `  ${ctx.parsed.x} completados  ${impLabels[ctx.dataIndex]}`;
                                }
                                return `  Meta: ${ctx.parsed.x}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.65)', stepSize: 1, font: { size: 12 } },
                        grid:  { color: 'rgba(255,255,255,0.09)' },
                        beginAtZero: true
                    },
                    y: {
                        ticks: { color: 'rgba(255,255,255,0.88)', font: { weight: 'bold', size: 13 } },
                        grid:  { display: false }
                    }
                }
            }
        });
    }

    // Open stats modal
    document.getElementById('btnOpenStats').addEventListener('click', () => {
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('statsModal'));
        modal.show();
    });

    // Load chart data when modal becomes visible
    document.getElementById('statsModal').addEventListener('shown.bs.modal', () => {
        loadStatsModal(currentStatsPeriod);
    });

    // Period toggle buttons
    document.querySelectorAll('.stats-period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.stats-period-btn').forEach(b => b.classList.remove('active-period'));
            btn.classList.add('active-period');
            currentStatsPeriod = btn.getAttribute('data-period');
            loadStatsModal(currentStatsPeriod);
        });
    });

    // ── Init ──────────────────────────────────────────────────────
    renderDailyQuote();
    fetchHabits();
});
