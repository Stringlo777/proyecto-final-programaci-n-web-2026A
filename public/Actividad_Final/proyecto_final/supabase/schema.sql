-- HabitTracker — Supabase / PostgreSQL Schema
-- Supabase Dashboard → SQL Editor → New Query → Run

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre    VARCHAR(100) NOT NULL,
    rol       TEXT DEFAULT 'user' CHECK (rol IN ('admin', 'user')),
    puntos    INT DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crea perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.usuarios (id, nombre)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
    );
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabla habitos
CREATE TABLE IF NOT EXISTS public.habitos (
    id           BIGSERIAL PRIMARY KEY,
    usuario_id   UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre       VARCHAR(150) NOT NULL,
    descripcion  TEXT,
    frecuencia   TEXT DEFAULT 'diaria' CHECK (frecuencia IN ('diaria', 'semanal', 'personalizada')),
    meta_semanal INT DEFAULT 7,
    color        VARCHAR(20) DEFAULT '#00ffcc',
    importancia  SMALLINT DEFAULT 3 CHECK (importancia BETWEEN 1 AND 5),
    activo       BOOLEAN DEFAULT TRUE,
    creado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla registros_habito
CREATE TABLE IF NOT EXISTS public.registros_habito (
    id         BIGSERIAL PRIMARY KEY,
    habito_id  BIGINT NOT NULL REFERENCES public.habitos(id) ON DELETE CASCADE,
    fecha      DATE NOT NULL,
    completado BOOLEAN DEFAULT TRUE,
    UNIQUE (habito_id, fecha)
);

-- Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfil propio" ON public.usuarios
    FOR ALL USING (auth.uid() = id);

ALTER TABLE public.habitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Habitos propios" ON public.habitos
    FOR ALL USING (usuario_id = auth.uid());

ALTER TABLE public.registros_habito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registros propios" ON public.registros_habito
    FOR ALL USING (
        habito_id IN (SELECT id FROM public.habitos WHERE usuario_id = auth.uid())
    );

-- Función: perfil propio (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE(nombre TEXT, rol TEXT, puntos INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT u.nombre::TEXT, u.rol::TEXT, u.puntos
    FROM public.usuarios u
    WHERE u.id = auth.uid();
END;
$$;

-- Función admin: ver todos los usuarios
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(id UUID, nombre TEXT, email TEXT, rol TEXT, puntos INT, creado_en TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.usuarios u0
        WHERE u0.id = auth.uid() AND u0.rol = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo administradores.';
    END IF;
    RETURN QUERY
    SELECT u.id, u.nombre::TEXT, au.email::TEXT, u.rol::TEXT, u.puntos, u.creado_en
    FROM public.usuarios u
    JOIN auth.users au ON u.id = au.id
    ORDER BY u.creado_en ASC;
END;
$$;

-- Función admin: eliminar usuario
CREATE OR REPLACE FUNCTION public.delete_user_as_admin(target_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.usuarios u0
        WHERE u0.id = auth.uid() AND u0.rol = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acceso denegado.';
    END IF;
    IF target_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes eliminarte a ti mismo.';
    END IF;
    DELETE FROM auth.users WHERE id = target_id;
END;
$$;
