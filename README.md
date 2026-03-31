# VITALBLAZE Retail Suite

Ultra-premium multi-tenant ERP and POS monorepo for the Saudi retail sector, built with MongoDB, Express.js, React, Vite, Tailwind CSS, and Node.js.

## Monorepo Structure

```text
.
├── apps
│   ├── api
│   │   ├── src
│   │   │   ├── config
│   │   │   ├── models
│   │   │   ├── routes
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   └── package.json
│   └── web
│       ├── src
│       │   ├── components
│       │   │   ├── dashboard
│       │   │   ├── layout
│       │   │   ├── marketing
│       │   │   └── ui
│       │   ├── data
│       │   ├── pages
│       │   ├── App.jsx
│       │   ├── i18n.js
│       │   ├── index.css
│       │   └── main.jsx
│       └── package.json
└── packages
    └── shared
        └── src
            ├── domain.js
            ├── index.js
            └── zatca.js
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `apps/api/.env.example` to `apps/api/.env` and set `MONGODB_URI`.
3. Start both apps:
   ```bash
   npm run dev
   ```

## Production Deployment on Plesk

- Install dependencies with `npm install`
- Build the project with `npm run build:plesk`
- Start the Node.js app with `npm start`
- Use `server.js` as the Plesk startup file
- See `PLESK.md` for the full deployment steps and environment variables

## Current Deliverables

- Shared business enums and capability flags for Bakala vs Grocery Store tenants
- Core Mongoose schemas for tenant, inventory, procurement, shift, and sales flows
- Strict ZATCA TLV-to-Base64 QR utility
- Premium RTL/LTR-ready React UI foundation for the marketing site and super admin dashboard
