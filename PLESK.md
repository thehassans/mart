# Plesk Deployment Guide

## Deployment Model

This project is configured to run on Plesk as a single Node.js application:

- Plesk runs `server.js` from the repository root
- the frontend is built into `apps/web/dist`
- Express serves the built frontend and all `/api/*` routes from the same Node process

## Plesk Node.js Settings

Use these values in the Plesk Node.js app screen:

- **Application root**: repository root
- **Application startup file**: `server.js`
- **Document root**: repository root
- **Application mode**: `production`
- **Node.js version**: `20.x` or newer

## Install Command

```bash
npm install
```

## Build Command

```bash
npm run build:plesk
```

## Startup Command

```bash
npm start
```

## Environment Variables

Set these in the Plesk environment variables UI:

- `NODE_ENV=production`
- `PORT=5000`
- `CLIENT_ORIGIN=https://your-domain.com`
- `JWT_SECRET=replace-with-a-long-random-secret`
- `MONGODB_URI=replace-with-your-mongodb-uri`
- `SUPER_ADMIN_USERNAME=superadmin`
- `SUPER_ADMIN_PASSWORD=replace-with-your-super-admin-password`
- `SUPER_ADMIN_EMAIL=admin@your-domain.com`
- `SUPER_ADMIN_NAME=Super Admin`
- `SUPER_ADMIN_TENANT_ID=replace-with-a-fixed-24-char-objectid`
- `SUPER_ADMIN_BUSINESS_TYPE=GROCERY_STORE`
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=replace-with-your-admin-password`
- `ADMIN_EMAIL=branch@your-domain.com`
- `ADMIN_NAME=Branch Admin`
- `ADMIN_TENANT_ID=replace-with-a-fixed-24-char-objectid`
- `ADMIN_BUSINESS_TYPE=GROCERY_STORE`

## Notes

- If MongoDB is reachable, the API starts in full mode.
- If MongoDB is not reachable, the API still starts in demo mode.
- `/api/auth/demo-login` uses the super admin env values as its default login payload.
- SPA routes are served by Express in production, while `/api/*` remains available for backend routes.
