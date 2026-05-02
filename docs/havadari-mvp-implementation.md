# Havadari MVP Implementation (Iran Version)

This repository now includes a first implementation slice of the Havadari game design.

## Implemented Backend Pieces

- Auth OTP hardening:
  - Added `/api/auth/phone/send-otp`
  - Added `/api/auth/phone/verify`
  - Added `/api/auth/refresh` alias
  - OTP is now hashed with `HMAC-SHA256` (`OTP_SECRET`)
  - OTP attempt limit and send rate-limit added
  - OTP is single-use and deleted after successful verification
  - Kavenegar verify lookup support added via env vars

- Game API scaffold (`GameModule`):
  - `GET /api/user/profile`
  - `PUT /api/user/profile`
  - `GET /api/user/cards`
  - `GET /api/user/squad`
  - `PUT /api/user/squad`
  - `GET /api/user/stats`
  - `POST /api/battle/find-match`
  - `POST /api/battle/start`
  - `POST /api/battle/play-round`
  - `POST /api/battle/end`
  - `GET /api/battle/history`
  - `GET /api/market/listings`
  - `POST /api/market/list`
  - `POST /api/market/buy/:listingId`
  - `POST /api/market/bid/:listingId`
  - `DELETE /api/market/listing/:listingId`
  - `GET /api/shop/chests`
  - `POST /api/chest/open/:chestType`
  - `POST /api/purchase/gems`
  - `GET /api/purchase/history`
  - `GET /api/prediction/matches`
  - `POST /api/prediction/place`
  - `GET /api/prediction/my-predictions`
  - `GET /api/leaderboard/:type?region=IR`

## Current State

- Implemented services are in-memory and ready for frontend integration/testing.
- Next step is replacing in-memory game state with TypeORM entities and migrations.

## Required Environment Variables

- `KAVENEGAR_API_KEY`
- `KAVENEGAR_OTP_TEMPLATE`
- `OTP_SECRET`

## Hosting Decision Snapshot

- Primary target: Arvan Cloud
- Secondary standby: Liara.ir
- Redis + PostgreSQL + Object storage in Iran region
