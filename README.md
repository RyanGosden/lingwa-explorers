# Lingwa Explorers

Public site for the Lingwa Explorers app, served at https://lingwaexplorers.com
by a Cloudflare Worker: a landing page with an animated beach scene, About,
Contact (with a form), and the privacy policy Google Play links to.

The game itself lives in a separate, private repository. The artwork in
`assets/` is web-sized copies of the game's own.

## Layout

- `index.html`, `about/`, `contact/`, `privacy/`, `404.html` — plain HTML, no
  build step. The header and footer are repeated in each page; change them in
  all five.
- `assets/site.css`, `assets/site.js` — shared styles and behaviour.
- `assets/img`, `assets/shots` — WebP art and screenshots.
- `src/worker.js` — runs only when no file matches: handles `POST /api/contact`
  and otherwise serves `404.html`.
- `play/` — the Godot web build, not deployed (see `wrangler.jsonc`).

## Deploying

Pushing to `main` deploys automatically (Cloudflare Workers Builds).

The contact form emails through Cloudflare Email Routing and needs one secret,
set in the dashboard under the Worker's Settings > Variables and Secrets:
`CONTACT_TO`, a verified Email Routing destination address.

## Running locally

Wrangler watches the assets directory, and this site's assets directory is the
repo root, where Wrangler also writes `.wrangler/` — so `wrangler dev` run here
reloads itself in a loop. Run it from a folder outside the repo with a
`public` symlink to it and a copy of `wrangler.jsonc` whose `main` is
`public/src/worker.js` and `assets.directory` is `public`. Put
`CONTACT_TO=someone@example.com` in `.dev.vars` there; sent mail is written to
`.wrangler/tmp/email/` instead of being delivered.
