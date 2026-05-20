// ══════════════════════════════════════════════════════════════════
//  Supabase Client Adapter — HabitTracker
//  Expone la misma interfaz API que api.js → dashboard.js /
//  admin.js / app.js no necesitan ningún cambio.
// ══════════════════════════════════════════════════════════════════

const _supabase = window.supabase.createClient(
    'https://xjkfelthkpmifsrwvive.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqa2ZlbHRoa3BtaWZzcnd2aXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTcwNzMsImV4cCI6MjA5NDc5MzA3M30.68ivXRJeT-tTGwZcZ3ufG4XVTpDUI3JYzeIKQ05JJLE'
);

// ── Date helpers ───────────────────────────────────────────────────
const todayStr   = () => new Date().toISOString().split('T')[0];
const nDaysAgo   = n  => new Date(Date.now() - n * 864e5).toISOString().split('T')[0];

// ── Auth ───────────────────────────────────────────────────────────
async function loginWithSupabase({ email, password }) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
        const msg = error.message?.includes('Email not confirmed')
            ? 'Correo no confirmado. Contacta al administrador.'
            : error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')
            ? 'Correo o contraseña incorrectos.'
            : error.message || 'Error al iniciar sesión.';
        return { status: 401, data: { message: msg } };
    }

    const { data: profileArr } = await _supabase.rpc('get_my_profile');
    const profile = profileArr?.[0];

    return {
        status: 200,
        data: {
            token: data.session.access_token,
            usuario: {
                id:     data.user.id,
                email:  data.user.email,
                nombre: profile?.nombre || data.user.email.split('@')[0],
                rol:    profile?.rol    || 'user',
                puntos: profile?.puntos || 0
            }
        }
    };
}

async function registerWithSupabase({ nombre, email, password }) {
    if (!nombre || nombre.trim().length < 2)
        return { status: 400, data: { message: 'El nombre es obligatorio.' } };
    if (!email || !password || password.length < 6)
        return { status: 400, data: { message: 'Correo y contraseña (mín. 6 caracteres) son obligatorios.' } };

    const { data, error } = await _supabase.auth.signUp({
        email, password,
        options: { data: { nombre: nombre.trim() } }
    });
    if (error) return { status: 400, data: { message: error.message } };
    if (data.user?.identities?.length === 0)
        return { status: 400, data: { message: 'Este correo ya está registrado.' } };

    return { status: 201, data: { message: '¡Cuenta creada! Ya puedes iniciar sesión.' } };
}

// ── Hábitos ────────────────────────────────────────────────────────
async function fetchHabitsSupabase() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return { status: 401, data: { message: 'No autorizado.' } };

    const today   = todayStr();
    const weekAgo = nDaysAgo(6);

    const { data: habitos, error } = await _supabase
        .from('habitos').select('*').eq('activo', true).order('id', { ascending: false });
    if (error) return { status: 500, data: { message: error.message } };

    const { data: profileArr } = await _supabase.rpc('get_my_profile');
    const profile = profileArr?.[0];

    if (!habitos || habitos.length === 0)
        return { status: 200, data: { habitos: [], puntos: profile?.puntos || 0 } };

    const ids = habitos.map(h => h.id);
    const [{ data: todayRecs }, { data: rachaRecs }] = await Promise.all([
        _supabase.from('registros_habito').select('habito_id, completado').in('habito_id', ids).eq('fecha', today),
        _supabase.from('registros_habito').select('habito_id').in('habito_id', ids).eq('completado', true).gte('fecha', weekAgo)
    ]);

    const todayMap = {}, rachaMap = {};
    todayRecs?.forEach(r => { todayMap[r.habito_id] = r.completado ? 1 : 0; });
    rachaRecs?.forEach(r => { rachaMap[r.habito_id] = (rachaMap[r.habito_id] || 0) + 1; });

    const enriched = habitos.map(h => ({
        ...h,
        completado_hoy: todayMap[h.id] ?? 0,
        racha_semanal:  rachaMap[h.id]  || 0
    }));

    return { status: 200, data: { habitos: enriched, puntos: profile?.puntos || 0 } };
}

async function createHabitSupabase(payload) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return { status: 401, data: { message: 'No autorizado.' } };

    const { data, error } = await _supabase.from('habitos').insert({
        usuario_id:   user.id,
        nombre:       payload.nombre,
        descripcion:  payload.descripcion || null,
        frecuencia:   payload.frecuencia  || 'diaria',
        meta_semanal: parseInt(payload.meta_semanal) || 7,
        color:        payload.color      || '#0077b6',
        importancia:  Math.min(5, Math.max(1, parseInt(payload.importancia) || 3))
    }).select('id').single();

    if (error) return { status: 500, data: { message: error.message } };
    return { status: 201, data: { message: 'Hábito creado correctamente.', id: data.id } };
}

async function updateHabitSupabase(payload) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return { status: 401, data: { message: 'No autorizado.' } };

    const { error } = await _supabase.from('habitos').update({
        nombre:       payload.nombre,
        descripcion:  payload.descripcion || null,
        frecuencia:   payload.frecuencia  || 'diaria',
        meta_semanal: parseInt(payload.meta_semanal) || 7,
        color:        payload.color      || '#0077b6',
        importancia:  Math.min(5, Math.max(1, parseInt(payload.importancia) || 3))
    }).eq('id', payload.id).eq('usuario_id', user.id);

    if (error) return { status: 500, data: { message: error.message } };
    return { status: 200, data: { message: 'Hábito actualizado.' } };
}

async function deleteHabitSupabase({ id }) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return { status: 401, data: { message: 'No autorizado.' } };

    const { error } = await _supabase.from('habitos').delete().eq('id', id).eq('usuario_id', user.id);
    if (error) return { status: 500, data: { message: error.message } };
    return { status: 200, data: { message: 'Hábito eliminado correctamente.' } };
}

async function toggleRegistroSupabase({ habito_id }) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return { status: 401, data: { message: 'No autorizado.' } };

    const today = todayStr();
    const { data: existing } = await _supabase.from('registros_habito')
        .select('id, completado').eq('habito_id', habito_id).eq('fecha', today).maybeSingle();

    let nuevoEstado;
    if (existing) {
        nuevoEstado = !existing.completado;
        await _supabase.from('registros_habito').update({ completado: nuevoEstado }).eq('id', existing.id);
    } else {
        nuevoEstado = true;
        await _supabase.from('registros_habito').insert({ habito_id, fecha: today, completado: true });
    }

    const delta = nuevoEstado ? 10 : -10;
    const { data: profileArr } = await _supabase.rpc('get_my_profile');
    const newPoints = Math.max(0, (profileArr?.[0]?.puntos || 0) + delta);
    await _supabase.from('usuarios').update({ puntos: newPoints }).eq('id', user.id);

    return {
        status: 200,
        data: {
            message:        nuevoEstado ? '¡Hábito Completado Hoy! (+10 Puntos)' : 'Progreso desmarcado. (-10 Puntos)',
            completado_hoy: nuevoEstado,
            puntos:         newPoints
        }
    };
}

async function fetchHabitStatsSupabase(periodo) {
    const days      = periodo === 'mes' ? 29 : periodo === 'anio' ? 364 : 6;
    const startDate = nDaysAgo(days);
    const mult      = periodo === 'mes' ? 4 : periodo === 'anio' ? 52 : 1;

    const { data: habitos } = await _supabase.from('habitos')
        .select('id, nombre, color, importancia, meta_semanal')
        .eq('activo', true).order('importancia', { ascending: false });

    if (!habitos || habitos.length === 0)
        return { status: 200, data: { habitos: [], periodo } };

    const { data: records } = await _supabase.from('registros_habito')
        .select('habito_id').in('habito_id', habitos.map(h => h.id))
        .eq('completado', true).gte('fecha', startDate);

    const countMap = {};
    records?.forEach(r => { countMap[r.habito_id] = (countMap[r.habito_id] || 0) + 1; });

    return {
        status: 200,
        data: {
            habitos: habitos.map(h => ({
                ...h,
                importancia:  parseInt(h.importancia) || 3,
                completados:  countMap[h.id] || 0,
                meta_periodo: h.meta_semanal * mult
            })),
            periodo
        }
    };
}

// ── Admin ──────────────────────────────────────────────────────────
async function fetchUsersSupabase() {
    const { data, error } = await _supabase.rpc('get_all_users_for_admin');
    if (error) return { status: 403, data: { message: error.message } };
    return { status: 200, data: { usuarios: data || [] } };
}

async function deleteUserSupabase({ id }) {
    const { error } = await _supabase.rpc('delete_user_as_admin', { target_id: id });
    if (error) return { status: 403, data: { message: error.message } };
    return { status: 200, data: { message: 'Usuario purgado exitosamente del sistema.' } };
}

// ── API (misma interfaz que api.js) ────────────────────────────────
const API = {
    post: async (endpoint, payload) => {
        try {
            if (endpoint.includes('login'))    return await loginWithSupabase(payload);
            if (endpoint.includes('register')) return await registerWithSupabase(payload);
        } catch { }
        return { status: 400, data: { message: 'Endpoint desconocido.' } };
    },

    getAuth: async (endpoint) => {
        try {
            if (endpoint.includes('/habitos/read'))        return await fetchHabitsSupabase();
            if (endpoint.includes('/habitos/habit_stats')) {
                const periodo = new URL('http://x' + endpoint).searchParams.get('periodo') || 'semana';
                return await fetchHabitStatsSupabase(periodo);
            }
            if (endpoint.includes('/usuarios/read'))       return await fetchUsersSupabase();
            return { status: 200, data: {} };
        } catch { return { status: 500, data: { message: 'Error de red.' } }; }
    },

    postAuth: async (endpoint, method, payload) => {
        try {
            if (endpoint.includes('/habitos/create'))   return await createHabitSupabase(payload);
            if (endpoint.includes('/habitos/update'))   return await updateHabitSupabase(payload);
            if (endpoint.includes('/habitos/delete'))   return await deleteHabitSupabase(payload);
            if (endpoint.includes('/registros/toggle')) return await toggleRegistroSupabase(payload);
            if (endpoint.includes('/usuarios/read'))    return await fetchUsersSupabase();
            if (endpoint.includes('/usuarios/delete'))  return await deleteUserSupabase(payload);
        } catch { }
        return { status: 400, data: { message: 'Endpoint desconocido.' } };
    }
};
