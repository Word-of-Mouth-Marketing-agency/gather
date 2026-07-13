# Gather Website

Next.js e-commerce storefront for Gather (gather-eg.com).

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- JSON file-based data store (no database)
- Odoo 18 integration via JSON-RPC

## Local Development

```bash
npm install
npm run dev
```

Environment variables are in `.env.local`. See `.env.example` for the template.

## Odoo Integration

When `ODOO_SYNC_ENABLED=true`, the following entities sync automatically:

| Entity | Website → Odoo | Odoo → Website |
|---|---|---|
| Categories | Auto-sync on create/edit | Webhook |
| Products | Auto-sync on create/edit | Webhook + pull |
| Stock | Push on change | Pull (cron/manual) |
| Orders | Auto-sync on checkout | — |
| Customers | Auto-sync on signup/edit/checkout/address | Webhook |

Loop prevention: `gather_sync_origin` context + webhook cooldown.

See `A:\Projects\gather\docs\` for detailed sync documentation.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
