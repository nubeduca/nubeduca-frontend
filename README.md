# nubeduca-frontend

Shell del frontend de **Nubeduca**, el LMS SaaS multi-tenant del proyecto de Cloud Computing (UTEC, 2026-2).

Este repo deja la **base compartida** para que todos agreguen pantallas sin pisarse: layout, rutas, design system, login (simulado o Cognito), cliente de API y carpetas por módulo. Corresponde a la tarea **FE-01** del backlog.

> La app se publica en **AWS Amplify**. El login tiene dos modos: **simulado** (`VITE_AUTH_MODE=mock`, por defecto) y **Amazon Cognito** (`VITE_AUTH_MODE=cognito`), donde el tenant y el rol salen del ID token.

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
  - Con ms-cursos real, `src/lib/api/cursos.ts` copia los cursos y matrículas que responde a los mocks (`src/lib/mocks/bridge.ts`), así contenidos, evaluaciones y calificaciones simulados reconocen los cursos reales.
  - Con ms-usuarios real (miles de usuarios), los nombres que no vienen en `listUsers` se piden por id (`src/lib/hooks/useUsers.ts`) y el panel de matrícula busca por código institucional.

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

## Login: simulado y Cognito

El modo se elige con `VITE_AUTH_MODE`:

| Modo                 | Qué hace                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `mock` (por defecto) | Login simulado. El `token` es `mock.<tenant>.<ROL>.<userId>` y solo sirve con APIs en `authMode=mock` o con MSW. |
| `cognito`            | Login real con Amazon Cognito (`aws-amplify`). Es el modo de **producción**.                                     |

### Modo Cognito

```dotenv
VITE_AUTH_MODE=cognito
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_USE_MOCKS=false
```

- En Amplify estas variables las pone `nubeduca-backend/infra/frontend` desde SSM (`/nubeduca/<stage>/cognito/*`). El despliegue de prod (`scripts/desplegar.sh prod`) ya pasa `authMode=cognito`.
- El cliente de API manda `Authorization: Bearer <ID token>`. Tiene que ser el **ID token**, no el access token: solo el ID token trae `custom:tenant_id` y `custom:role`, y con el access token el authorizer responde 401.
- Amplify renueva el ID token con el refresh token. Si la API responde 401, la sesión se cierra y se vuelve a `/login`.
- Se valida que el `custom:tenant_id` del token sea el de la institución elegida en el formulario, y que `custom:role` sea `STUDENT`, `TEACHER` o `ADMIN`.
- En el primer login se llama a `POST /users/me` (ms-usuarios) para crear el perfil y publicar `user.provisioned`.

### Probar en local contra un stage

1. Con `nubeduca-backend` ya desplegado en un stage, crea los usuarios demo: `scripts/crear_usuarios_demo.sh <stage>` (clave `Nubeduca2026!`, o la de `DEMO_PASSWORD`). Crea `alumno.demo@`, `docente.demo@` y `admin.demo@` en `utec.edu.pe` y `upc.edu.pe`.
2. Copia `.env.example` a `.env.local`, pon el modo Cognito de arriba y las seis `VITE_API_*` del stage (salen de SSM: `/nubeduca/<stage>/api/<servicio>/url`).
3. `npm run dev`, elige la institución y entra con un usuario demo. En la pestaña _Network_ las llamadas deben llevar el `Bearer` y responder 200; sin sesión, 401.

### Modo simulado

- `AuthProvider` guarda la sesión en `localStorage` (`nubeduca.session`).
- `RequireAuth` protege el shell y permite restringir por rol.
- `GuestOnly` evita que un usuario logueado vuelva a `/login`.

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
