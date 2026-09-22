# RUSKAV Food Service Products — Website & Shop

Marketing site, product catalogue and B2B shop for RUSKAV Food Service Products,
built from the 2023 print catalogue. React 19 + TypeScript + Vite + Tailwind CSS v4,
with Supabase for data, auth and image storage, and Razorpay for online payment.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
npm run lint     # oxlint
npm run social   # regenerate public/og-image.jpg + apple-touch-icon.png
npm run seed:sql # regenerate supabase/seed-catalogue.sql from catalogue.ts
```

**It browses with no configuration at all.** Without Supabase every page renders
and the shop lists all 39 catalogue codes as price-on-request. Supabase is what
makes it transactional: both forms post straight into the admin dashboard, so
until it is configured they say so and point at the phone number instead.
Razorpay adds card payment on top.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Scroll-scrubbed hero, company summary, the five ranges, featured products |
| `/about` | Company story, how a piece is made, sectors served, bio-composite line |
| `/products` | All five ranges, plus a searchable index of every product code |
| `/products/:categoryId` | One range: editorial, imagery, full specification tables |
| `/shop` | Wholesale grid with search, range/rating filters, sorting, add-to-order |
| `/shop/:code` | Single product: gallery, price, specs, colourways, quantity picker |
| `/cart` | Line items, totals, customer details → enquiry or online payment |
| `/account` | The customer's own quotes, orders and trade band |
| `/quality` | Certifications, the four materials compared, what TÜV tests |
| `/contact` | Quote request (who you are, what you need), contact routes, FAQs |
| `/login` | Trade login, sign-up and password reset — unlocks pricing, and the staff door |
| `/admin` | Products, pricing, discounts, images, orders, enquiries and trade bands |

It is a single-page app with real URLs, so the host must rewrite unknown paths to
`index.html` or a reload on `/shop` will 404. `public/_redirects` covers Netlify
and Cloudflare Pages; `vercel.json` covers Vercel. For nginx: `try_files $uri /index.html;`

## Setup: Supabase

Needed for live prices, the admin dashboard and orders.

1. Create a free project at [supabase.com](https://supabase.com).
2. **Schema** — open SQL Editor → New query, paste all of `supabase/schema.sql`,
   run it. It is re-runnable by design — `create table if not exists`, and every
   policy is dropped before being recreated — so re-run it whenever the schema
   changes here. It never drops data.
3. **Keys** — copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY` from Project Settings → API. Restart `npm run dev`.
   The anon key is *meant* to be public; row level security is what protects the
   data. Never put the `service_role` key in `.env.local` — Vite ships everything
   there to the browser.
4. **Make yourself an admin** — Authentication → Users → Add user (email +
   password, with *Auto Confirm User* ticked). Then run `supabase/make-admin.sql`
   in the SQL editor, with your email substituted in — it looks the UUID up for
   you.

   Signing in is not enough on its own: a row in `admins` is what grants write
   access, and the database enforces that independently of the UI.
5. **Load the catalogue** — run `supabase/seed-catalogue.sql` in the SQL editor.
   It inserts the five ranges and all 39 product codes with their sizes, case
   packs, materials, colourways, certifications and specification tables,
   published but unpriced. Set a price on a line and it starts showing a real
   figure in the shop instead of "price on request".

   The admin dashboard has an **Import print catalogue** button that does the
   same thing over the API, but that path needs a working admin account first
   (step 4), whereas the SQL editor runs as `postgres` and bypasses row level
   security. Both are safe to run repeatedly — existing codes are left exactly
   as they are, so prices you have already set are never overwritten.

   `supabase/seed-catalogue.sql` is generated from `src/data/catalogue.ts`; run
   `npm run seed:sql` after editing the print catalogue to regenerate it.
6. **Google sign-in** — this is how customers get an account, and it is three
   settings in two dashboards:

   - *Google Cloud Console* -> APIs & Services -> Credentials -> Create
     credentials -> OAuth client ID -> Web application. Under **Authorised
     redirect URIs** add exactly
     `https://<your-project-ref>.supabase.co/auth/v1/callback`. Copy the client
     ID and secret.
   - *Supabase* -> Authentication -> Providers -> Google: enable it and paste
     the two values in.
   - *Supabase* -> Authentication -> URL Configuration: set **Site URL** to the
     live domain, and add both `https://www.ruskav.com/login` and
     `http://localhost:5173/login` to **Redirect URLs**. Sign-in returns people
     to `/login`, so an address that is not on this list is rejected by
     Supabase and the round trip fails silently.

   Until this is configured the Google button returns an error; the password
   form on `/login` keeps working throughout, which is also the way back in if
   Google is ever misconfigured.

### Accounts

Nobody has to sign in to *browse*. Building an order, sending an enquiry and
paying all work as a guest — but prices do not, so in practice a buyer signs in
(see **Trade pricing is gated** below).

There are two ways in, both on `/login`:

- **Google**, which creates the account with no form to fill in.
- **Email and password** — name, email, password — with a reset-by-email link
  for the inevitable forgotten one. The same form signs staff in; an admin is
  an ordinary account with a row in `admins`.

Two settings in the Supabase dashboard decide how email sign-up behaves:

- **Authentication → Providers → Email → Confirm email.** On (the default) means
  a new account is not usable until the link is clicked; the form says so rather
  than appearing to do nothing. Off means the session arrives immediately.
- **Authentication → URL Configuration → Redirect URLs** must list your live
  origin *and* `http://localhost:5173`, or the confirmation and recovery links
  bounce. Password recovery returns to `/login?recovery=1`, where the page
  offers a "set a new password" form instead of the usual redirect.

The name typed at sign-up is stored in `user_metadata.full_name`, the same field
Google fills, so the rest of the site reads one place either way.

`auth.users` is not readable with the anon key, by design, so a
`public.profiles` table mirrors it — a trigger on `auth.users` writes name,
email, avatar, provider and last sign-in on every sign-up and every sign-in, and
`schema.sql` backfills anyone who registered before the table existed. Profiles
are readable by their owner and by admins. The only column writable from the
browser is the trade band, and only by an admin — the trigger maintains the
rest.

Orders and enquiries carry a nullable `user_id`. The row level security check
is `user_id is null or user_id = auth.uid()`, so a signed-in visitor can attach
their own account to an order and nobody can attach anybody else's.

Being signed in is not the same as being staff: dashboard access is still a row
in `admins`, checked by the database, not by the browser.

### Security model

Two kinds of visitor, and the policies in `schema.sql` say so explicitly:

- **The public** may read published products and *create* an order. They cannot
  read orders back — otherwise one customer could enumerate everyone else's
  contact details.
- **Admins** (a row in `public.admins`) may do anything.

The client-side `isAdmin` check only decides what to render. A tampered client
gains nothing, because every write is checked again by row level security.

## Setup: Razorpay

Card, UPI and netbanking on the cart page. Skip this and the cart still works —
the pay button simply does not appear.

The key **secret** must never reach the browser, so order creation and payment
verification run in two Supabase Edge Functions:

```bash
npm i -g supabase          # if you don't have the CLI
supabase login
supabase link --project-ref <your-project-ref>

supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=yyy
supabase functions deploy razorpay-create-order --no-verify-jwt
supabase functions deploy razorpay-verify --no-verify-jwt
```

Then put only the publishable id in `.env.local`:

```
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

**Why two functions rather than paying straight from the browser:**

- `razorpay-create-order` re-reads the order total from the database and asks
  Razorpay for *that* amount. The browser sends only an order id, so a tampered
  client cannot pay ₹1 for a pallet of trays.
- `razorpay-verify` recomputes the HMAC of `order_id|payment_id` under the key
  secret and compares it in constant time. It is the only thing that may set
  `status = 'paid'`. A client that merely claims to have paid changes nothing.

Use `rzp_test_` keys until you have tested the whole flow end to end.

## Admin dashboard

`/admin`, staff only.

**Products & pricing** — create, edit, publish/hide and delete products.

The editor opens on six fields and the image uploader: **code**, **name**,
**range**, **size**, **case pack**, **price**. That is a listing that works,
and it is all that is asked for. Everything else — MRP (rendered
struck-through), discount %, GST %, unit (case or piece), minimum order, stock
status, product line, description, material and recycling code, surface,
free-form specification rows, quality notes, colourways, ratings, trade and
dispatch — waits behind **Add more detail**.

Nothing was removed; a form that puts thirty fields in front of somebody adding
a tray is what makes adding a tray feel like filing a return.

*Colourways & ratings* also takes **a photo per colourway**. Upload one against
a colour and that swatch becomes pressable on the product page, swapping the
main image to it; colours with no photo stay plain swatches. Stored as
`products.color_images`, a jsonb map of colour key → url — a handful of urls
always read with the product and never queried across products, which is a
column rather than a table.

*Trade & dispatch* holds the four things a distributor asks before ordering:
**HSN code**, **lead time** (free text — "Ships in 3–5 working days"), **gross
case weight** in kg and **carton size**. All four are optional and each one is
simply left off the product page when empty, so a half-filled product still
reads as finished rather than as a form with gaps in it. Case weight is what
the cart totals into a shipment weight for the freight quote. Images upload to the `product-images` Supabase Storage bucket (5 MB cap,
namespaced per product so filenames can't collide), or can be pasted in as URLs —
`/gallery/...` paths work for the committed renders. The first image is the one
used in every product grid. Changes are live for customers as soon as you save.

**Orders** — cart orders, newest first, with line items, contact details and
totals, plus counts and paid revenue. Status moves between quoted / pending /
paid / cancelled.

**Customers** — everyone who has signed in: name, email, avatar, which provider
they used, when they signed up, when they were last seen, and how many orders
they have placed. Orders are matched to a person by account first and by email
second, so one placed as a guest before they signed up still counts. Staff
accounts are badged. Searchable by name or email.

**Enquiries** — everything sent from the `/contact` form, newest first: name,
company, email and phone (split out of the single "email or phone" field so both
are clickable), which range they picked, their message, and any product codes
they had collected at the time. Status moves between new / replied / closed,
with a filter for the unanswered ones and a one-click reply-by-email.

Contact enquiries are stored in their own `enquiries` table rather than in
`orders`. A general "tell me about your trays" has no line items and nothing
payable, so folding it into orders would make the order count and paid-revenue
figures meaningless.

The dashboard is the only place an enquiry goes — there is no mail client or
WhatsApp handoff behind the form — so the save is the send. A failed insert is
shown to the visitor rather than logged and hidden: nothing may say "sent"
unless the row is actually there. When it saves they get the reference back, so
both sides can quote the same one.

## Trade pricing is gated

This is a wholesale site, so prices are for account holders. Everything else —
the range, the photography, sizes, case packs, materials, colourways, the full
specification sheet — is open to anyone.

A signed-out visitor sees a red **Unlock price** pill wherever a figure would
be, the `TradeGate` panel explaining why, and no totals in the cart or the
floating bar. They can still build a list and send it as an enquiry; what they
cannot do is see the trade rate, or pay it online.

- `src/lib/trade.ts` — `useTradeAccess()` is the single gate. `loginHref()`
  builds the sign-in link carrying the page to come back to.
- `src/components/ui.tsx` — `Price`, `PerPiece` and `PriceLock` read the gate,
  so no page has to remember to.
- `src/components/TradeGate.tsx` — the explanation, in a full panel or a
  compact strip.

Lines with no price at all still read **Price on request** to everyone: there is
nothing behind the lock to unlock.

**One thing to finish before launch.** The gate is the interface, not the
database. `products` is fetched with `select("*")`, so a determined visitor can
still read the `price` column straight from the Supabase REST endpoint with the
anon key. If the price list genuinely must not leave the building, move it
behind row level security — keep the public policy on a view without the money
columns, and grant the full table to authenticated roles only. See
**Security model** above.

## Where the shop's products come from

Once `VITE_SUPABASE_URL` is set, the `products` table is the only source. An
empty table means an empty shop — "empty" is an answer, and filling a shop with
thirty-nine lines the business has not priced, cannot fulfil from stock and did
not choose to list is worse than showing nothing. The shop says it is being
stocked, and points an admin at the dashboard.

The print catalogue in `src/data/catalogue.ts` still stands in for the two
cases where it is genuinely the better answer:

- **No backend configured at all** — a fresh checkout of this repo should demo
  without a Supabase project behind it.
- **A failed request** — a network blip should not blank a live shop, so the
  catalogue appears with a banner saying pricing is unreachable.

Note that `schema.sql` never inserts products. If you have rows you did not
add, they came from `seed-catalogue.sql`, which loads the 2023 print catalogue.
To clear them and start fresh from the dashboard, run
`supabase/reset-products.sql` — kept as a separate file, because re-running the
schema must never be able to delete a catalogue by accident.

The range pages (`/products`, `/products/:id`) are a different thing and still
read the print catalogue directly: they are the reference document — every code,
size and tested figure — not the sellable list.

## Trade bands

Wholesale is not one price list, so the site has four: `customer_tiers` holds
**Regular**, **Dealer C**, **Dealer B** and **Dealer A**, each with a discount
off list. An admin sets a band per account on **Customers**, and edits the
bands themselves on **Trade bands**.

The band's discount is applied *after* whatever discount the product already
carries, so a seasonal offer and a dealer band compose rather than one
cancelling the other. A banded buyer sees their own number everywhere — grid,
product page, cart total — with the list price struck beside it and the band
named underneath.

- `src/lib/tier.ts` — the buyer's own band, held once for the whole app for the
  same reason the session is: a forty-product grid asks the question forty
  times. It is populated by the auth store, and cleared on sign-out, so a
  shared office machine never shows the last dealer's prices to the next
  person.
- `src/lib/tiersAdmin.ts` — the whole table, admin only, imported solely by the
  dashboard chunk.
- `tieredPrice()` / `tieredPricePerPiece()` in `lib/products.ts`, and the
  `tierDiscountPercent` argument to `priceCart()`.

**The table is not public.** A Dealer C has no business reading what Dealer A
pays, so `customer_tiers` is admin-only under RLS and buyers get their own row
through `public.my_tier()` — a security-definer function that returns the
caller's band and nobody else's.

Prices wait for the band rather than printing list price first. Quoting a
dealer the wrong number because their band had not loaded yet is the expensive
mistake; a moment of shimmer is not.

## Quoting an enquiry

`/contact` is a request for a quote, not a message box — but it asks for six
things, not sixteen: name, company, email or phone, which range, roughly how
much, and what they need. That is enough to answer.

Everything that sharpens the answer — delivery city and state, type of
business, GSTIN, when they need it, and which band they think they belong on —
sits behind one **Add a few more details** toggle. Offered, not demanded: a
quote form long enough to feel like an application is one people abandon, and a
lead with five fields filled in beats a perfect form nobody submitted.

The product codes they had collected in the shop ride along automatically.

On **Enquiries**, each one opens into the full picture plus a quote panel: the
amount quoted, the note it went out with, and a band to put the account on.
Saving records `quoted_amount`, `quote_notes`, `quoted_at` and `granted_tier`,
and moves the status to `quoted`. Statuses run `new → quoted → replied → won`
(or `closed`).

**The customer reads the quote on `/account`.** The amount, the note the office
wrote (verbatim — an office that explained its MOQ should have that explanation
reach the buyer, not a summary), and a line saying their band has moved if it
has. `enquiries` and `orders` were admin-read-only, which is why the two
policies under "what a customer can read back" in `schema.sql` exist; without
them the page has nothing to show.

Those policies key on `user_id` alone, deliberately, not on a matching email
address. An enquiry sent as a guest carries no account, and letting a fresh
sign-up claim every row sharing its email would turn the form into a way of
reading other people's business. A guest enquiry stays between the sender and
the office, answered by email as it always was — and the confirmation screen
says so, and offers an account for next time.

There is no outbound email from the app itself. A quote appears on `/account`
the next time the customer opens it; telling them it is there is still a human
job (the **Reply by email** button on the enquiry is right there).

Granting a band from here writes to the customer's profile, which is what
changes the prices they see. Two cases the panel reports separately rather than
hiding:

- The enquiry has no account attached (sent as a guest), so the band cannot be
  applied — set it on **Customers** once they sign up.
- The quote saved but the band write failed. These are two statements, so they
  get two messages.

## Cookies

`src/components/CookieBanner.tsx` asks once and never comes back. There is
nothing to consent to beyond the essentials — the cart in `localStorage` and the
Supabase session — so the notice says exactly that rather than offering a
category picker for tracking that does not exist. The answer is stored under
`ruskav:cookie-consent`; the floating cart bar stands down while the notice is
on screen so the two never stack in the same corner of a phone.

If analytics or an advertising pixel is ever added, it has to be loaded from the
`accepted` branch — not on page load.

## How a product is presented

Every surface shows the same facts in the same order, so a buyer moving from the
grid to the page to the cart never has to re-learn the layout:

- **Shop card** (`src/components/ProductCard.tsx`, used by every grid on the
  site) — a lit studio panel carrying the code, the stock and discount flags and
  a second angle on hover; then the name, size / case pack / material, the
  colourway dots, the gated price with the per-piece figure under it, one action
  and the minimum order.
- **Product page** — one gallery holding the product shots *and* a frame per
  photographed colourway, so the thumbnail strip and the colour swatches drive
  the same selection rather than two that can disagree. Then the same four
  headline facts under the title, a price block
  carrying per-piece, GST and HSN, and then one **Technical specification**
  sheet holding everything on file: identity, packing, materials, colourways,
  commercials, dispatch, ratings and the tested figures from the print catalogue
  (heat resistance, stain resistance and the rest). It prints as a spec sheet.
- **Cart** — cases *and* pieces, per-case and per-piece pricing, and a gross
  weight for the lines that carry one.

Two rules hold it together. Empty fields are dropped, never printed blank — an
absent row is not part of that product's sheet, where "Lead time —" reads as a
company that does not know its own lead time. And per-piece pricing divides by
the *sold unit*, not blindly by the case pack, so a line priced per piece is not
quoted at a fiftieth of its real price.

Product pages also emit their own `Product` structured data (price, availability,
HSN, specs), which is what lets a search result show a real figure rather than
just a page title. The site-wide Organization graph stays in `index.html`.

## The cart

One concept does both jobs the business needs. Customers add cases, then either:

- **send it as an enquiry** — recorded as an order in the dashboard, and the only
  option for price-on-request lines, or
- **pay online** — shown only when Razorpay is configured and every line has a price.

Only codes and quantities are stored (in `localStorage`); prices are re-read from
the live product list at render time. A cart left open overnight cannot lock in
yesterday's price, and an admin price change shows up immediately.

## The scroll hero

The home hero is a 300-frame product sequence scrubbed by scroll position, drawn
to a `<canvas>`. See `src/components/Hero.tsx`:

- Frames are the original 1920×1080 JPEG exports in
  `public/Products Images/`, served untouched (~7 MB for 300).
- **Loading is progressive.** `src/hooks/useFrameSequence.ts` loads a priming
  batch of 24 frames, reveals the page, then streams the rest behind it six at a
  time. The scrub falls back to the nearest frame that has arrived, and a 6-second
  timeout means a stalled network can never trap a visitor on the loading screen.
- **Phones get it too, at a third of the frames.** `frameStride()` in
  `src/lib/env.ts` takes every third frame on a small screen and every second on
  a 3G connection — a third of the bytes, and at a phone's scroll speed the
  difference between 300 steps and 100 is not visible, because the sequence is a
  slow orbit rather than a fast cut. Cutting the hero on mobile altogether left
  the small screen looking like a flatter, different product.
- **`prefers-reduced-motion`, Save-Data and 2G still skip it entirely** —
  `shouldLoadFrameSequence()` decides, and those visits get a single static
  product render at normal page height. One image request instead of 300.
- The section is `340vh` on phones and `430vh` above that, with a `sticky`
  viewport-height canvas. Scroll length *is* the scrub speed: taller slows the
  sequence relative to scrolling, shorter speeds it up.
- Headline copy lives in the `phases` array, each with a
  `[fadeInStart, fullyIn, holdUntil, fadeOutBy]` range in scroll-progress units.
  To reword the hero, edit that array — nothing else needs to change.
- `imageSmoothingQuality = "high"` has to be re-applied inside the resize handler,
  because assigning `canvas.width`/`height` silently resets all context state.
- **When you replace the frames, bump `FRAMES_VERSION`.** Filenames are stable
  across art updates, so browsers otherwise keep serving the old sequence.

## Content

Static content — the five ranges, product codes, sizes, case packs, specifications,
colourways, certifications, contact details — lives in `src/data/catalogue.ts`.
It is the fallback catalogue, the seed for the database import, and the source for
category pages and navigation. Adding a product line there adds it everywhere.

Once Supabase holds products, the shop and product pages read from it; the range
pages and specification tables still read the print data in `catalogue.ts`.

## Images

Every product photograph on the site is the real thing, lifted out of the 2023
print catalogue rather than rendered. `public/gallery/` holds them as WebP
(about 2.4 MB for 40).

```
python scripts/build-catalogue-images.py --pdf "Ruskav Catalogue 2023.pdf"
```

That script is the record of how each file was made — re-run it when a new
catalogue is issued instead of hand-editing anything in `public/gallery/`. It
needs `pypdf` and `pillow`, and it does three things:

1. **Extraction.** The photographs are embedded with their transparency in a
   separate `/SMask` stream. Pull the image out without it and the product
   arrives sitting on flat black; the mask is decoded and re-attached as an
   alpha channel.
2. **Cleaning.** Shots that came with no mask sit on studio white, which reads
   as a white box pasted onto a cream page. The white is flood-filled inwards
   from the corners — deliberately, rather than thresholding on brightness,
   which would punch a hole straight through a white plate. Lifestyle and
   factory shots are left alone: there the background is the subject.
3. **Framing.** The site crops with `object-cover` inside fixed 4:5 and 1:1
   frames. A 14-inch tray dropped into a portrait frame loses its ends, so
   cut-outs are padded onto a canvas of the aspect they will be shown at, which
   makes the crop a no-op. Product grids sidestep the problem entirely by
   containing rather than covering.

Which picture goes where is set in `src/data/catalogue.ts` — `heroImage`,
`thumb` and `secondaryImages` per range. `secondaryImages` does double duty:
`src/lib/products.ts` rotates through a range's images when it builds fallback
products, so a longer list means the shop grid stops showing the same
photograph against every code in a range.

`scripts/generate-social-assets.mjs` (`npm run social`) builds
`public/og-image.jpg` and `public/apple-touch-icon.png` from one of those
photographs, so the share card shows a real product too.

Two older helpers are still around: `scripts/optimize-images.mjs` converts a
folder of PNG/JPEG to sized WebP, and `scripts/optimize-frames.mjs` re-encodes
the scroll hero's frame sequence for the day the 7 MB set becomes a problem on
slow connections.

The earlier generated renders (`studio-*.webp`, `*-float.webp`) are still in
`public/gallery/`; only `studio-trays-stack.webp` is still referenced, as the
poster frame behind the scroll hero. The rest can be deleted whenever you are
sure you don't want them back.

## Before going live

- **Set the real domain.** `index.html` has one clearly marked `DEPLOY:` comment;
  `og:url`, `og:image`, `canonical` and the JSON-LD structured data all use it,
  and social previews fail silently on a wrong absolute URL. Also update
  `public/robots.txt` and `public/sitemap.xml`.
- Switch Razorpay from `rzp_test_` to live keys, in `.env.local` *and* in
  `supabase secrets set`.
- Confirm your host rewrites unknown paths to `index.html` (see Pages, above).

## Notes on decisions worth knowing

- **The scrollbar is visible.** It was previously removed outright so full-bleed
  dark sections could reach the right edge. On a page whose hero alone is several
  screens tall, losing the only indication of scroll position costs more than the
  gutter did, so it is back — thin and neutrally styled, with a progress bar under
  the header as a second cue. See the comment in `src/index.css`.
- **`overflow-x: clip` on `html` and `body`.** The trust-strip marquee is ~3600px
  wide. Its wrapper clips it visually, but the overflow still propagated to the
  document scroll width, which made mobile browsers zoom out to fit — pushing the
  header's menu button off screen. `clip`, unlike `hidden`, does not create a
  scroll container and stops it there.
- **Reduced motion is honoured throughout**: `<MotionConfig reducedMotion="user">`
  covers every Framer Motion component, and `src/index.css` covers the CSS
  animations, smooth scrolling and the marquee.
- **Scroll locking is reference-counted** (`src/lib/scrollLock.ts`). The loader and
  the mobile menu can overlap, and writing `body.style.overflow` from each one
  meant whichever released first unlocked the page for the other too.
- **Both forms post straight to Supabase and nowhere else.** They used to compose
  a `mailto:` link with WhatsApp and copy-to-clipboard alternatives; `mailto:`
  fails silently for anyone without a mail client, and neither route left the
  office a record it could sort, filter or mark replied. The trade is that the
  forms are now only as available as the database, which is why an unconfigured
  or unreachable one is stated on the form rather than swallowed.
- Certification icons in `src/components/icons/Badges.tsx` are hand-drawn SVGs
  modelled on the print catalogue symbols, not the original artwork.

## Structure

```
src/
  App.tsx                     router; admin + login are lazy-loaded
  routes/
    Layout.tsx                header, footer, cart bar, per-route titles
    HomePage.tsx              hero, about summary, ranges, featured products
    AboutPage.tsx             story, process, sectors
    ProductsPage.tsx          all ranges + searchable code index
    CategoryPage.tsx          one range, with specification tables
    ShopPage.tsx              priced grid, filters, sorting
    ProductPage.tsx           single product detail
    CartPage.tsx              cart, totals, enquiry or Razorpay checkout
    QualityPage.tsx           certifications and material comparison
    ContactPage.tsx           enquiry form + FAQs
    LoginPage.tsx             staff sign-in
    AdminPage.tsx             product/price/order management
    NotFoundPage.tsx
  lib/
    supabase.ts               client; null when unconfigured
    auth.ts                   session + admin membership
    products.ts               product type, fetching, fallback, price maths
    cart.ts                   cart store and pricing
    orders.ts                 order creation + Razorpay flow
    catalogueIndex.ts         flattened, searchable print catalogue
    scrollLock.ts             reference-counted scroll lock
    env.ts                    media queries and capability checks
  components/
    SiteHeader.tsx  Footer.tsx  CartBar.tsx  ui.tsx
    Hero.tsx  Loader.tsx  TrustStrip.tsx  CategoryGrid.tsx
    ProductFinder.tsx  ProductGroupCard.tsx  ColorSwatches.tsx
    Sustainability.tsx  Contact.tsx  icons/Badges.tsx
  data/catalogue.ts           all static product + company content
  hooks/useFrameSequence.ts   progressive hero frame loader
supabase/
  schema.sql                  tables, RLS policies, storage bucket
  seed-catalogue.sql          generated: the print catalogue as INSERTs
  make-admin.sql              grant admin access by email
  functions/
    razorpay-create-order/    server-side order creation
    razorpay-verify/          signature verification
```
