# Selah Pilates Studio Website

Website for Selah Pilates Studio (Purok 16, Valero Street, Valencia City, Bukidnon). Setup only: real pages are built after the agreement is signed and the first payment is received. Placeholder pages show their title.

## Stack (same for every client; do not change)
- Next.js 15 (App Router), React 19, TypeScript in strict mode
- Tailwind CSS v4. Colours, spacing and type sizes are tokens in `app/globals.css` (`@theme`). No colour typed into a component
- `next/font`, set up once in `lib/fonts.ts`
- No UI kit, animation library or CMS unless agreed with the owner first
- Scripts: `dev`, `build`, `lint` (zero warnings), `typecheck`. Lint, typecheck and build all pass before anything is handed over

## Folders
- `app/`: `layout.tsx`, `globals.css`, `page.tsx` and one folder per page
- `components/`: shared parts (Navigation, Footer, Button, Section, Reveal)
- `content/`: plain data. `site.ts`, `hours.ts`, then one file for each kind of content (here: `classes.ts`). The business words and facts live here, never typed into a component, so a CMS can replace them later
- `lib/`: `fonts.ts`, small helpers
- `public/images/`: empty until the client's own photos arrive

## Rules
- Less is more, above every other rule and every skill's advice: one purpose per screen, cut words, boxes, colours and effects before adding any, nothing decorative. Less is not ugly: keep spacing, type and motion crafted, and add real information (never decoration) if a screen looks empty
- Plain, everyday English in everything the visitor reads. No filler words
- Never invent facts, reviews, prices or photos. Anything missing is marked as missing (`null` plus an entry in `missing` in `content/site.ts`)
- Phones first. Checked at 360, 768 and 1280 px wide. Keyboard works, text is easy to read on its background
- Every clickable thing is a real link or button
- Basic SEO on every page: its own title and description, one clear main heading, a sitemap and robots file, and structured data for the business

## Skills (use if installed; they work inside the rules above, never against them)
- design-taste-frontend: building the pages
- vercel-react-best-practices: writing or changing React and Next.js code
- web-design-guidelines: accessibility, layout and forms review before handover
- impeccable: hierarchy, spacing, type, colour and copy review
- emil-design-eng: small details: hover, press, spacing, motion (150 to 250 ms, still when reduced motion is asked)

## The client
- Business: Selah Pilates Studio. Kind: fitness and sports
- Place: Purok 16, Valero Street, Valencia City, Bukidnon
- Offer: classes (too short to rely on: ask the client)
- The site must: get more bookings or appointments, more sales, better brand credibility
- Project: the website. They also asked for a business dashboard
- Package: not set yet
- Pages: Home, About, Class, Contact only, until the client confirms
- Style they like: clean and minimal; elegant and calm; warm and friendly
- Design direction: pastel blue, calm and soft. Serif headings (Lora), clean sans body (Plus Jakarta Sans), large rounded panels, pill buttons. Colours live only in `globals.css`. Fonts and exact blues are still placeholders until the client confirms

## The dashboard
It lives in the `dashboard` folder inside this website (its own install, port 3100), made from the master dashboard (Desktop\Dev\modular-dashboard, docs/architecture/client-setup.md). The shell and the content system are the same for every client: change them in the master, not here. What is Selah's own is `dashboard/src/systems/content/site/`. Work in `dashboard`, read its `CLAUDE.md` first, and keep this website's code and the dashboard's code apart (the website's tsconfig, eslint and styles skip `dashboard`).
- Keep everything the owner will edit in `content/` files, so the dashboard content system can take over without changing the pages
- The contact page has a booking request form. It sends to the dashboard public booking connection, whose address is in `NEXT_PUBLIC_BOOKING_URL` (see `.env.example`), never in code. The form works but stays unconnected while that setting is empty
