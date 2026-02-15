# NFT Marketplace Backend

A **Node.js + Express** backend that indexes on-chain NFT marketplace and ERC-721 events, stores them in PostgreSQL, and exposes REST APIs for the frontend.

---

## What does this backend do?

1. **Listens to the blockchain** – Subscribes to your marketplace contract (list, sell, cancel, price update) and NFT contract (mint, transfer).
2. **Stores data in a database** – Saves listings, NFTs, and activity so the frontend can load them fast without querying the chain every time.
3. **Catches up after restarts** – On every startup, it runs a short "gap-fill" from the last indexed block so missed events are not lost.
4. **Exposes REST APIs** – Endpoints for listings, user NFTs, user listings, and activity feed.

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **PostgreSQL** (local or hosted, e.g. Neon, Supabase)
- **Alchemy (or other RPC)** – You need an RPC URL for the chain your contracts use (e.g. Sepolia)

---

## Quick start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Set up the database

Create a PostgreSQL database, then:

```bash
npx prisma generate
npx prisma migrate dev
```

This creates the tables (Listing, NFT, Activity).

### 3. Configure environment variables

Copy the example env file (if you have one) or create a `.env` file in the `backend` folder with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"
ALCHEMY_RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
MARKETPLACE_ADDRESS="0xYourMarketplaceContractAddress"
NFT_ADDRESS="0xYourNFTContractAddress"
```

- **DATABASE_URL** – Your PostgreSQL connection string.
- **ALCHEMY_RPC** – RPC URL for the chain (e.g. Sepolia). Get a free key from [Alchemy](https://www.alchemy.com/).
- **MARKETPLACE_ADDRESS** – Deployed marketplace contract address.
- **NFT_ADDRESS** – Deployed ERC-721 NFT contract address.

### 4. Run the backend

**Development (with auto-reload):**

```bash
npm run dev
```

**Production (after building):**

```bash
npm run build
npm start
```

The server listens on **port 5173** by default. The indexer starts automatically and will:

1. Run a gap-fill (catch up any missed blocks since last run).
2. Start listening for new marketplace and NFT events.

---

## Project structure

```
backend/
├── prisma/
│   └── schema.prisma     # Database models (Listing, NFT, Activity)
├── src/
│   ├── index.ts         # App entry: Express server + start indexer
│   ├── config/          # Contracts, RPC provider (Alchemy)
│   ├── db/              # Prisma client
│   ├── indexer/         # Blockchain listeners + backfill
│   │   ├── index.ts     # Starts indexer + gap-fill on startup
│   │   ├── marketplace.ts           # Live listener: marketplace events
│   │   ├── nftMintingContract.ts    # Live listener: NFT Transfer events
│   │   ├── marketplace-backfill.ts  # Script: full marketplace backfill
│   │   └── nft-contract-backfill.ts # Script: full NFT backfill
│   ├── routes/          # API routes (marketplace, users, activity)
│   ├── services/        # Business logic + database (listing, nft, activity, indexer-state)
│   └── utils/           # Helpers (e.g. event-order / isStaleEvent)
├── .env                 # Your env vars (do not commit)
├── package.json
└── README.md
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/marketplace/listings` | List all active listings |
| GET | `/users/:wallet/nfts` | NFTs owned by a wallet |
| GET | `/users/:wallet/listings` | Listings by a wallet (optional `?status=ACTIVE\|SOLD\|CANCELLED`) |
| GET | `/activity/recent` | Recent activity (optional `?wallet=0x...` and `?limit=20`) |

Responses are JSON. Example:

```json
GET /marketplace/listings
{
  "count": 2,
  "listings": [
    {
      "listingId": "0",
      "seller": "0x...",
      "nftContract": "0x...",
      "tokenId": "1",
      "price": "1000000000000000000",
      "createdAt": "..."
    }
  ]
}
```

---

## Indexer and gap-fill (beginner-friendly)

- **Live indexer** – Subscribes to contract events and writes new listings/NFTs/activity to the DB as they happen.
- **Gap-fill** – When the backend starts, it looks at the highest block already stored in the DB, then fetches and processes any events from the next block up to the current chain block (capped so startup doesn’t take too long). So if the backend was down or missed some events, it catches up automatically.
- **Full backfill** – For the first time or after a long outage, you can run the backfill scripts once to fill history (see below).

---

## Running a full backfill (optional)

Use these only when you need to backfill from block 0 (or your configured start block), e.g. first setup or after a long downtime.

**Marketplace events (list, sell, cancel, price update):**

```bash
npx tsx src/indexer/marketplace-backfill.ts
```

Or after building:

```bash
node dist/indexer/marketplace-backfill.js
```

**NFT Transfer events (mint, transfer):**

```bash
npx tsx src/indexer/nft-contract-backfill.ts
```

Or:

```bash
node dist/indexer/nft-contract-backfill.js
```

These scripts run until they reach the latest block, then exit. The main app does **not** run these by default; it only runs the built-in gap-fill on startup.

---

## Environment variables summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ALCHEMY_RPC` | Yes | RPC URL for the chain (e.g. Sepolia) |
| `MARKETPLACE_ADDRESS` | Yes | Marketplace contract address |
| `NFT_ADDRESS` | Yes | ERC-721 NFT contract address |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run with tsx watch (auto-reload on file change) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled app (`node dist/index.js`) |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Run migrations (dev) |
| `npx prisma migrate deploy` | Run migrations (production) |

---

## Troubleshooting

- **"Cannot find module" or Prisma errors** – Run `npx prisma generate` and ensure `DATABASE_URL` is set.
- **No events / empty listings** – Check `MARKETPLACE_ADDRESS` and `NFT_ADDRESS` match your deployed contracts and that `ALCHEMY_RPC` is for the correct chain (e.g. Sepolia).
- **Port already in use** – Change `PORT` in `src/index.ts` (or add it to `.env` and read it there) if 5173 is taken.
- **CORS errors from frontend** – The app allows `http://localhost:3000` by default. For production, configure CORS to allow your frontend origin (e.g. via an env var).

---

## License

MIT
