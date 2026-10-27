# POS Metropolitano

A small point of sale for a church cafeteria. Next.js (App Router) + React + TypeScript + SQLite.

## Setup

```bash
npm install
npm run db:seed   # creates data/pos.db with an admin user and a sample menu
npm run dev       # http://localhost:3000
```

Default login: `admin` / `admin123` — **change it** under Admin → Users right after first login.

## Features

- **Sell** (`/`): tap menu items by category, adjust quantities, pay cash/card/other, see change due, print a receipt.
- **Sales** (`/sales`): list by day, receipt view, void a sale (admin; restores stock).
- **Summary** (`/summary`): daily total, payment-method breakdown, items sold.
- **Menu** (`/items`, admin): categories, items, prices, optional stock tracking.
- **Admin** (`/admin`, admin): volunteer accounts (cashier/admin), password resets, store name, tax rate (default 0%), receipt footer.

## Notes

- Data lives in `data/pos.db` (override with `POS_DB_PATH`). Back this file up.
- Over plain HTTP on a LAN the session cookie works as-is; set `COOKIE_SECURE=true` when serving over HTTPS.
- Timestamps are stored in the server's local time.
- Scripts: `npm test`, `npm run lint`, `npm run build`, `npm start`.

## License

[MIT](LICENSE) © 2026 Luis Ochoa
