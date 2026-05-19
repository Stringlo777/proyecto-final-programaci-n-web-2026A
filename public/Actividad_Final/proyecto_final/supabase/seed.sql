-- ══════════════════════════════════════════════════════════════════
--  HabitTracker — Seed de usuarios demo
--  Ejecutar DESPUÉS de schema.sql
--  Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_admin_id  uuid;
  v_maria_id  uuid;
  v_hab1      bigint;
  v_hab2      bigint;
  v_hab3      bigint;
  v_hab4      bigint;
  v_hab5      bigint;
BEGIN

  -- ──────────────────────────────────────────────────────────────
  -- 1. admin@admin.com  /  contraseña: Admin123!
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'admin@admin.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Admin"}',
    NOW(), NOW()
  )
  RETURNING id INTO v_admin_id;

  -- El trigger on_auth_user_created ya creó el perfil en public.usuarios
  UPDATE public.usuarios SET rol = 'admin', nombre = 'Admin' WHERE id = v_admin_id;

  -- ──────────────────────────────────────────────────────────────
  -- 2. maria@demo.com  /  contraseña: Maria123!
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'maria@demo.com',
    crypt('Maria123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"María García"}',
    NOW() - INTERVAL '30 days', NOW()
  )
  RETURNING id INTO v_maria_id;

  UPDATE public.usuarios SET nombre = 'María García', puntos = 210 WHERE id = v_maria_id;

  -- ──────────────────────────────────────────────────────────────
  -- 3. Hábitos demo para María
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO public.habitos (usuario_id, nombre, descripcion, frecuencia, meta_semanal, color, importancia)
  VALUES (v_maria_id, 'Beber 2L de agua', 'Mantener botella siempre a la mano', 'diaria', 7, '#00b4d8', 4)
  RETURNING id INTO v_hab1;

  INSERT INTO public.habitos (usuario_id, nombre, descripcion, frecuencia, meta_semanal, color, importancia)
  VALUES (v_maria_id, 'Ejercicio 30 min', 'Caminar, correr o ir al gimnasio', 'diaria', 5, '#70e000', 5)
  RETURNING id INTO v_hab2;

  INSERT INTO public.habitos (usuario_id, nombre, descripcion, frecuencia, meta_semanal, color, importancia)
  VALUES (v_maria_id, 'Leer 20 páginas', 'Cualquier libro que me inspire', 'diaria', 7, '#ffe566', 3)
  RETURNING id INTO v_hab3;

  INSERT INTO public.habitos (usuario_id, nombre, descripcion, frecuencia, meta_semanal, color, importancia)
  VALUES (v_maria_id, 'Meditar 10 min', 'Mindfulness antes del trabajo', 'diaria', 5, '#c77dff', 4)
  RETURNING id INTO v_hab4;

  INSERT INTO public.habitos (usuario_id, nombre, descripcion, frecuencia, meta_semanal, color, importancia)
  VALUES (v_maria_id, 'Sin redes antes de las 9am', 'No Instagram ni TikTok hasta empezar el día', 'diaria', 7, '#ff6b6b', 5)
  RETURNING id INTO v_hab5;

  -- ──────────────────────────────────────────────────────────────
  -- 4. Registros históricos (últimas 2 semanas, ~75% cumplimiento)
  -- ──────────────────────────────────────────────────────────────
  INSERT INTO public.registros_habito (habito_id, fecha, completado)
  SELECT v_hab1, CURRENT_DATE - s, true
  FROM generate_series(1, 13) AS s WHERE random() > 0.25;

  INSERT INTO public.registros_habito (habito_id, fecha, completado)
  SELECT v_hab2, CURRENT_DATE - s, true
  FROM generate_series(1, 13) AS s WHERE random() > 0.2;

  INSERT INTO public.registros_habito (habito_id, fecha, completado)
  SELECT v_hab3, CURRENT_DATE - s, true
  FROM generate_series(1, 13) AS s WHERE random() > 0.35;

  INSERT INTO public.registros_habito (habito_id, fecha, completado)
  SELECT v_hab4, CURRENT_DATE - s, true
  FROM generate_series(1, 13) AS s WHERE random() > 0.3;

  INSERT INTO public.registros_habito (habito_id, fecha, completado)
  SELECT v_hab5, CURRENT_DATE - s, true
  FROM generate_series(1, 13) AS s WHERE random() > 0.15;

  -- Hoy: María tiene 3 hábitos completados
  INSERT INTO public.registros_habito (habito_id, fecha, completado) VALUES
    (v_hab1, CURRENT_DATE, true),
    (v_hab2, CURRENT_DATE, true),
    (v_hab4, CURRENT_DATE, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed completado. admin_id=%, maria_id=%', v_admin_id, v_maria_id;

END $$;
