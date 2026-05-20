# HabitTracker

Aplicación web de seguimiento de hábitos con gamificación. Proyecto Final — Programación Web 2026A, UDG.

**Stack:** HTML · CSS · JavaScript · Supabase (PostgreSQL + Auth) · Vercel

---

## Diagrama Entidad-Relación

```mermaid
erDiagram
    usuarios {
        uuid id PK
        varchar nombre
        text rol
        int puntos
        timestamptz creado_en
    }
    habitos {
        bigserial id PK
        uuid usuario_id FK
        varchar nombre
        text descripcion
        text frecuencia
        int meta_semanal
        varchar color
        smallint importancia
        boolean activo
    }
    registros_habito {
        bigserial id PK
        bigint habito_id FK
        date fecha
        boolean completado
    }

    usuarios ||--o{ habitos : "tiene"
    habitos ||--o{ registros_habito : "registra"
```

---

## Usuarios demo

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| jefe@habittracker.com | Jefe2026! | admin |
| admin@admin.com | Admin2026! | admin |
| demo@habittracker.com | Demo2026! | user |
| carlos@demo.com | Carlos2026! | user |
| sofia@demo.com | Sofia2026! | user |
| maria@demo.com | Maria2026! | user |
