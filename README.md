# わんにゃん肖像 — Pet Illustration Demo

A working prototype of an **AI-powered pet illustration service for veterinary clinics**, built for evaluation by Sustainer Inc. (株式会社サスティナ).

## What it does

1. Pet owner / clinic staff uploads a pet photo.
2. OpenAI `gpt-image-1` transforms the photo into a hand-drawn watercolor illustration **while preserving the pet's individual features** (fur color, ear shape, body type, eye expression).
3. The result is composed into a "本日のご様子" report card with editable Japanese annotation bubbles — the same format clinics already use today.

Three illustration styles available:

- 🎨 **水彩イラスト** — soft watercolor + pencil
- ✨ **アニメ風** — clean anime / manga
- 📖 **絵本風** — children's picture book

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript, Tailwind 4
- OpenAI Images API (`gpt-image-1`, `image.edit`, `input_fidelity: "high"`)
- `sharp` for input normalization

## Local development

```bash
pnpm install
echo 'OPENAI_API_KEY=sk-...' > .env.local
pnpm dev
```

Open <http://localhost:3000>.

## Deployment

Deployed on Vercel. Set the `OPENAI_API_KEY` environment variable in the Vercel project settings.

## Architecture (production extension)

For the production LINE-integrated service, this prototype maps onto the following components:

```
LINE Webhook (Messaging API)
  → /api/line-webhook  (signature verify, image content fetch)
  → /api/generate      (this prototype's core)
  → upload result to object storage
  → reply via LINE replyMessage / pushMessage

Clinic-side admin console
  → annotation templates per clinic
  → per-pet history
  → usage metering / billing
```

## License

For evaluation only. © 2026 Cognitive AppDev.
