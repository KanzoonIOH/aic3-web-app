# React + TypeScript + Vite

## How To Run Locally

You do not need to run anything else. The API and all the infra already live
on the server, you only point the app at it and run the dev server.

This project uses `pnpm` for package manager. But you can also use `npm`.

### 1. Setup .env

Make sure env is setted up

```bash
cp .env.example .env
```

Then change `VITE_API_URL` to the API on the server, for example
`http://<server>:6701/api`. That is the only value that matters, there is no
proxy here, the browser calls that URL directly.

### 2. Node

Make sure Node is installed. To check run

```bash
node --version
```

If not installed, please install using yout preference method, either natively, using `brew`, `asdf`, `nvm`, etc.

### 3. Install and run

Once everything set up, you can install and run everything by doing

```bash
# Use pnpm
pnpm i & pnpm dev

# Use npm
npm i & npm dev
```

Vite will print the URL it is running on. Open it and you are good to go.

If the requests fail with a CORS error, your URL is not in `ALLOWED_ORIGINS`
on the API. Ask whoever owns the server to add it.

## Other commands

```bash
pnpm build   # typecheck then build for production
pnpm lint    # eslint
pnpm preview # serve the built app locally
```

## Where things are

- `src/routes/` — the pages. Routing is file based (TanStack Router), so a new
  file here is a new route. Files starting with `-` are not routes, they are
  just components living next to the route that uses them.
- `src/components/ui/` — shadcn components, mostly untouched.
- `src/api/` — axios calls, one file per domain.
- `src/stores/` — zustand stores.
- `src/index.css` — Tailwind v4 setup and the design tokens. There is no
  `tailwind.config`, it all lives here.

`src/routeTree.gen.ts` is generated, do not edit it.
