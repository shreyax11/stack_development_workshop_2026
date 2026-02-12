Project Setup Guide
===================

This guide shows how to initialize the Next.js project and the minimal frontend structure used in this workspace.

1. Initialize project

Run:

```bash
npx create-next-app@latest frontend/portal
```

When prompted choose the following options (choose the last option when it asks about customizing):
- Project name: `frontend/portal` (or accept default)
- Use TypeScript? `No`
- Use ESLint? `No`
- Tailwind? `No`
- App Router? `Yes` (App Router)
- Use `src/` directory? `Yes`
- Use import alias? `No`

2. Project structure changes

- Create a `component` folder inside `src` for small reusable components: `src/component/`
- Create route folders for sign-up and login: `src/app/signup/page.js`, `src/app/login/page.js`
- Create an authentication context: `src/context/auth.js`
- Create a services folder with API helpers: `src/services/api.js`
- Remove the default template content from `src/app/layout.js` and wrap the app with the `AuthProvider`.

3. Install runtime dependencies

From the project root (`frontend/portal`) run:

```bash
npm install axios lucide-react framer-motion
```

4. Usage

- Start the dev server:

```bash
npm run dev
```

- The sample routes created are:
  - `/login` — login page
  - `/signup` — signup page
  - `/dashboard` — protected/dashboard demonstration page

5. Notes

- `src/services/api.js` contains centralized axios instance and helper functions (`loginUser`, `signupUser`, `fetchDashboard`).
- `src/context/auth.js` exposes an `AuthProvider` and a `useAuth()` hook for consuming auth state and actions.
- Update `NEXT_PUBLIC_API_URL` in your environment when pointing to a real backend.
