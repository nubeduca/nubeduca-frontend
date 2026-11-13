# nubeduca-frontend

Shell del frontend de **Nubeduca**, el LMS SaaS multi-tenant del proyecto de Cloud Computing (UTEC, 2026-2).

Este repo deja la **base compartida** para que todos agreguen pantallas sin pisarse: layout, rutas, design system, login simulado, cliente de API y carpetas por módulo. Corresponde a la tarea **FE-01** del backlog.

> La app se publica en **AWS Amplify**. El login todavía es **simulado**; en AUTH-01 se reemplaza por Cognito y el tenant/rol saldrán del token.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Lucide (iconos)
- `fetch` nativo para el cliente de API

## Empezar

```bash
npm install
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

Para probar el login simulado elige institución (`UTEC`, `UPC`, `PUCP`), rol (`Estudiante`, `Docente`, `Administrador`) y escribe cualquier contraseña. Los correos de demo son:

- Docente: `docente.demo@utec.edu.pe`
- Estudiante: `alumno.demo@utec.edu.pe`

## Scripts

| Script                 | Qué hace                                  |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Servidor local con HMR                    |
| `npm run build`        | Typecheck + build de producción (`dist/`) |
| `npm run typecheck`    | Solo TypeScript                           |
| `npm run lint`         | Oxlint                                    |
| `npm run format`       | Prettier (escribe)                        |
| `npm run format:check` | Prettier (verifica)                       |
| `npm run preview`      | Sirve el build local                      |

## Estructura

```text
src/
├── app/                    # App, router, guards, dashboard y 404
├── components/
│   ├── ui/                 # Design system: Button, Input, Select, Card, Table...
│   └── layout/             # AppShell, Sidebar, Topbar, NotificationBell
├── features/auth/          # AuthProvider y LoginPage (simulado)
├── modules/                # Una carpeta de pantallas por módulo
│   ├── usuarios/
│   ├── cursos/
│   ├── contenidos/
│   ├── evaluaciones/
│   ├── calificaciones/
│   └── notificaciones/
├── lib/                    # api/client, env, session, tipos y utilidades
└── styles/                 # Tailwind y tokens del design system
```

Cada módulo expone sus pantallas desde su `index.ts`; `src/app/App.tsx` las carga con `lazy`.

## Cómo agregar pantallas

1. Crea el archivo dentro de `src/modules/<modulo>/screens/`.
2. Expórtalo desde `src/modules/<modulo>/index.ts`.
3. Agrega la ruta en `src/app/App.tsx`.
4. Si el ítem debe salir en el menú, agrégalo a `src/components/layout/navigation.ts` con los roles permitidos.

Convenciones del contrato v1:

- IDs, rutas y campos en inglés/camelCase; textos para el usuario en español.
- El `tenantId` y el rol salen del token (`custom:tenant_id`, `custom:role`), nunca del body.
- Errores con forma `{ code, message, requestId }`.
- Las URLs base van en `VITE_API_*`. **Modo mixto:** con `VITE_USE_MOCKS=true`, el servicio que tenga su `VITE_API_*` llena usa la API real y el resto sigue en MSW (p. ej. solo `VITE_API_NOTIFICACIONES`).

## Cliente de API

```ts
import { api } from '@/lib/api/client'

const cursos = await api.get<Curso[]>('cursos', '/courses')
const creado = await api.post<Curso>('cursos', '/courses', { title: 'Cloud' })
```

El cliente lee la URL base del servicio, agrega `Authorization: <token>` si hay sesión y normaliza los errores del contrato. Si falta la variable de entorno lanza `ApiError` con código `SERVICIO_NO_CONFIGURADO`.

Variables en `.env` / Amplify:

```dotenv
VITE_API_USUARIOS=
VITE_API_CURSOS=
VITE_API_CONTENIDOS=
VITE_API_EVALUACIONES=
VITE_API_CALIFICACIONES=
VITE_API_NOTIFICACIONES=
```

## Login simulado (temporal)

- `AuthProvider` guarda la sesión en `localStorage` (`nubeduca.session`).
- `RequireAuth` protege el shell y permite restringir por rol.
- `GuestOnly` evita que un usuario logueado vuelva a `/login`.
- La campana de notificaciones es un **placeholder navegable**; la bandeja real llega con ENG-01.

Cuando AUTH-01 esté listo, se reemplaza el login simulado por Cognito y el `token` mock por el ID token real.

## Desplegar en AWS Amplify

1. Sube este repo a `nubeduca/nubeduca-frontend` y usa la rama `main`.
2. En la consola de AWS Amplify: **New app → Host web app → GitHub** y conecta el repo.
3. Amplify detecta `amplify.yml` (`npm ci`, `npm run build`, artefacto `dist`). Usa **Node 22**; si el build usa una versión anterior, cámbiala en la configuración de la imagen de build.
4. En **Environment variables** agrega las `VITE_API_*` (pueden quedar vacías hasta FE-02).
5. Despliega y guarda la URL pública.
6. En **Hosting → Rewrites and redirects** agrega la regla SPA:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`

> `amplify.yml` es solo la configuración de build; las rewrites se configuran en Amplify, no en ese archivo.

## Verificación de FE-01

- [ ] `npm run lint` y `npm run build` pasan.
- [ ] El login simulado entra y permite cambiar tenant/rol.
- [ ] El menú muestra los módulos según el rol.
- [ ] Las 6 carpetas de `src/modules` existen y sus rutas navegan.
- [ ] La app está publicada en Amplify y la URL responde.
