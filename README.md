# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Admin login (development only)

This project includes a seeded admin account for local development. The server seed script will create an admin user if one does not exist.

- Email: `admin@billsnack.id`
- Password: `admin`

How to seed the admin (from the project `server` folder):

```powershell
cd E:\bilsnack\billsnack-web\server
npm install
node .\scripts\seed_admin.js
```

If your MySQL credentials are different, export temporary environment variables when running the seed:

```powershell
$env:DB_USER='root'; $env:DB_PASSWORD='your_root_pw'; node .\scripts\seed_admin.js
```

To log in using the API directly (bypassing the UI):

```powershell
# $body = @{ email='admin@billsnack.id'; password='admin'; admin=$true } | ConvertTo-Json
# Invoke-RestMethod -Method Post -Uri 'http://localhost:4000/api/auth/login' -Body $body -ContentType 'application/json'
```

Security note: the seeded admin is intended for local development only. Do not use these credentials in production and change the password and `JWT_SECRET` before deploying.
