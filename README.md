This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Checks

Quality gates from [ADR 0006](docs/adr/0006-quality-bar.md). CI runs them on every PR and on `main`.

| Gate | Command | Notes |
|---|---|---|
| Everything except e2e and Lighthouse | `bun run check` | `tsc --noEmit`, `eslint`, `bun test`, then `next build` |
| Unit tests | `bun test` | Pure logic only, files sit next to their module as `*.test.ts` |
| Playwright e2e + axe | `bunx playwright install chromium` once, then `bun run e2e` | Chromium only, builds and starts the production server itself. Set `E2E_SKIP_BUILD=1` to reuse an existing build |
| Bundle budgets | `bun run budget` | Run after a build. Initial-route JS ≤ 170 KB gzipped, 3D chunk ≤ 400 KB gzipped. The 3D chunk is any non-initial chunk containing `WebGLRenderer`, so it passes trivially until three is bundled |
| Lighthouse CI | `bun run build && bun run lhci` | Home page, mobile preset, median of 3 runs: LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms, Performance ≥ 90 |

Changing a budget means amending the ADR.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
