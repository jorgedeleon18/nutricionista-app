# Florencia Meccico · Nutrición

App web (React + Vite) para la nutricionista Florencia Meccico. Diseño "Clara" (claro, alto contraste).

## Estado de este mock

Primera versión **100% web / desktop**. Todavía no es responsive para celular/tablet — eso viene en la próxima etapa, sobre esta misma base.

Pantallas:
- Login con selector de rol (Nutricionista / Paciente).
- **Vista nutricionista**: mosaico de pacientes, y por cada paciente 5 solapas — Plan asignado, Registro del día (con selector de día L-D), Calendario (con panel de detalle del día elegido), Historia clínica (editable, solo la ve ella) y Mediciones corporales (tabla, compartida con el paciente).
- **Vista paciente**: Hoy (carga y edición de comidas del día), Calendario (historial) y Mediciones (solo lectura).

Todos los datos son de ejemplo (`src/data/patients.js`) — no hay backend todavía.

## Desarrollo

```bash
npm install
npm run dev
```

## Build / Deploy

```bash
npm run build
```

Genera `dist/`. `netlify.toml` ya está configurado (`npm run build` → publica `dist`) para conectar el repo en Netlify (Import from Git) y que deployee solo con cada push.

## Pendiente / próximos pasos

- Responsive para celular y tablet.
- Subida de la "ficha" tipo Word (plantilla editable) por paciente.
- Conectar a un backend real (hoy los datos son mock en `src/data/patients.js`).
