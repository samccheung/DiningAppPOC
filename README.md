# Genki — Sushi Takeaway Ordering POC (元気壽司)

A proof-of-concept fullstack web app modeled on the Genki Sushi Hong Kong online
ordering experience (order.genkisushi.com.hk): browse the menu, add items to a
persistent cart, and place pickup orders for a chosen branch and time slot.

> Demo only — not affiliated with Genki Sushi. Menu items are illustrative.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui (mobile-first, responsive)
- **Backend**: Hono + tRPC 11 (end-to-end typesafety)
- **Auth**: Kimi OAuth (JWT sessions)
- **DB**: MySQL via Drizzle ORM (`products`, `cart_items`, `orders`, `order_items`, `users`)

## Features

- **Menu** (`/menu`) — category tabs, plate-color price tiers, 新 / 每日限量 badges,
  seeded catalog (auto-seeds on first request)
- **Cart** (`/cart`) — per-user persistent cart (requires login), quantity steppers,
  branch + pickup-time checkout
- **Orders** (`/orders`) — order history with live status, cancel while `placed`/`preparing`
- Kimi login/logout; unauthenticated users are redirected to `/login`

## Getting started

```bash
npm install
cp .env.example .env   # fill in Kimi OAuth + MySQL credentials
npm run db:push          # sync drizzle schema to MySQL
npm run dev              # http://localhost:3000 (frontend + API + HMR)
```

Other commands: `npm run check` (typecheck), `npm run build` (frontend → `dist/public`,
API → bundled `dist/boot.js`), `npm start` (production server).

## Layout

```
api/            Hono app, tRPC routers (auth, menu, cart, orders)
db/             Drizzle schema (users/products/cart_items/orders/order_items)
contracts/      Shared types/constants across the API boundary
src/pages/      Menu, Cart, Orders, Login, NotFound
src/components/ StorefrontLayout (header/nav), PlateArt (SVG plate illustration)
```

This project was scaffolded with the Kimi webapp/backend building toolchain; the
platform-generated `api/lib`, `api/kimi`, `.env` and database credentials are
required to run it and are not committed.
