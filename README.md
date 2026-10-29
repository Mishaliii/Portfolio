# Muhammed Mishal: AI / ML Engineer Portfolio

Interactive portfolio showcasing computer vision, RAG, and production backend systems.

## Tech Stack

- TanStack Start and TanStack Router
- React 19 and TypeScript
- GSAP Observer and motion ticker
- Tailwind CSS

## Architecture

- Paged state machine on desktop via GSAP Observer.
- Natural smooth scroll on mobile via Lenis and ScrollTrigger.
- Zero mixed-blend or filter paint penalties on full-screen layers.
- Content-driven architecture centered in `src/content.ts`.

## Development

Install dependencies:

```sh
bun install
```

Start the development server:

```sh
bun run dev
```

## Production Build

Build for production:

```sh
bun run build
```

Run the production server:

```sh
node .output/server/index.mjs
```
