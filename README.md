# MO7LEY Travel — site notes

A plain HTML/CSS/JS site (no build step, no framework) so it's easy to preview, edit, and host anywhere. It's now a full multi-page site — every top-level section has its own page, plus an auto-generated page per destination.

## Pages

- `index.html` — homepage (hero slideshow, About teaser, Group Trips, 3D globe concierge panel, Activities, Charters, Journal teaser, Contact CTA)
- `about.html` — "Our Story" (timeline, values, founder bio for Vlad)
- `group-trips.html` — the Maldives trip in full (itinerary, gallery, FAQ)
- `destinations.html` — directory of every destination, grouped by continent
- `destinations/<id>.html` — one auto-generated page per destination (see below — **don't hand-edit these**, edit `data.js` and regenerate)
- `activities.html` — every activity type (scuba, freedive, skydive, mountaineering, surf, boat) with full write-ups
- `charters.html` — boat charter details + which destinations offer them
- `journal.html` — the "why we do this" manifesto page
- `contact.html` — trip inquiry form (submits via `mailto:`)
- `faq.html` — general FAQ accordion
- `404.html` — custom not-found page

## Shared systems (edit once, applies everywhere)

- `data.js` — **the single source of truth.** Edit this to add/change destinations, activities, or the Maldives group trip copy. Everything else reads from here. Has a Node-compatible export at the bottom so `generate-destinations.js` can `require()` it.
- `content-helpers.js` — generates the descriptive copy (paragraphs, "fear we faced" lines, fear-meter score, loading-screen theme) for each destination, deterministically from its activities/id so it's the same every time. Used both live in the browser (globe popup) and by the static generator. **This is placeholder copy** — written to be believable and on-brand, but meant for you to read through and edit to your actual stories.
- `shared.js` — holds the shared nav bar + footer (`MO7_NAV` / `MO7_FOOTER` at the top — edit those to change links site-wide), injects them into every page's `#nav-slot` / `#footer-slot`, highlights the active nav link, handles the scroll-progress bar, mobile menu, and the reveal-on-scroll animation for any element with class `reveal`.
- `shapes.css` — the visual design system: the angular-cut card/section shapes (`.shape-a/b/c`), rotated sticker badges (`.sticker`), the 1–5 dot fear-meter (`.fear-meter`), icon buttons shaped like a boat/plane (`.btn-icon`), destination cards (`.dest-card`), and more. This is what gives the site its "unique but still clean" look — reuse these classes rather than inventing new one-off shapes.
- `loader.css` + `loader.js` — the custom page-loading animation. Reads `data-loader` (`plane` / `boat` / `mountain` / `compass`) and `data-loader-label` off `<body>` and shows a themed animation for a beat before revealing the page. Boat = water/dive trips, plane = far-flung places, mountain = mountaineering, compass = general/default.
- `styles.css` — base typography, color palette, and layout (Fraunces for display headings, Inter for UI/body).
- `app.js` — homepage-only rendering: hero photo slideshow, stat count-up, Group Trips + Activity Trips cards.
- `globe.js` — the 3D globe + the continent/country/region sidebar list on the homepage, plus the click-to-see-summary popup panel.
- `curation.js` — the temporary Photo Studio (see below).
- `vendor/` — self-hosted Three.js + globe.gl, plus the globe's earth textures and country/state outlines packaged as `.js` files (that's what lets the site open by double-click with no server).

## Regenerating destination pages

`destinations/<id>.html` files are **auto-generated** — one per destination in `data.js` (except country-level "umbrella" entries like `usa`/`canada`/`mexico`/`china` that just group cities). Whenever you edit `data.js` — add a destination, change a tagline, adjust activities — re-run:

```
node generate-destinations.js
```

This regenerates every file in `destinations/`. It's safe to run any time; it fully overwrites that folder's contents from scratch. Don't hand-edit files inside `destinations/` — the next regeneration will wipe out those edits.

## Opening it

- **Just looking:** double-click `index.html`. Works with no server. Your saved edits show up.
- **Editing:** double-click `Start-MO7LEY.command` (first time: right-click → Open). It starts the site at `http://localhost:8080` plus the editor's save server, and opens your browser. Keep that Terminal window open while you work; close it when you're done.

## Editing the site (no code)

With the site opened through `Start-MO7LEY.command`, click **✏️ Edit page** (bottom right).

- **Text:** click anywhere and type. Toolbar: bold / italic / underline / strikethrough, text color, size (A− / A+ or type a number), left / center / right / justify. Select part of a sentence to style just that part; with nothing selected it applies to the whole block.
- **Boxes:** click a block, then drag the square handles on its right edge, bottom edge or corner to resize. **↑ Parent** selects the box around it (a whole card, section, etc.). Buttons move the box left / center / right, make it full width, add or remove space below it. **Reset** puts that one box back to the original.
- **Images & videos:** click **🖼 Media**, upload files (or drop them straight onto the dashed boxes). Drag a thumbnail onto any dashed box to place it; drag another on top to swap. **✕ Media** removes it. Videos play muted on a loop. Supported: jpg, png, gif, webp, avif, svg, mp4, mov, m4v, webm.
- It all **saves automatically** ("All changes saved ✓" in the toolbar). Click **Done editing** when finished.

Where it's stored: your text/style/media changes go in `site-edits.js` (readable JSON, commit it with git), uploads go in `assets/uploads/`, and the editor keeps rolling safety copies in `.edit-backups/` (not committed). Keep each upload under 100 MB or GitHub will refuse the push.

What the editor doesn't touch: the globe and its destination list, the destination data (edit `data.js`), and form buttons. Nav and footer text edits apply on every page.

## The Photo Studio (temporary tool — bottom-left 🖼️ button)

This is for you only, not site visitors. It's a drawer at the bottom of the screen so the real site stays visible above it while you work, and it's included on every page automatically (just needs `data.js` + `curation.js` loaded):

1. **Add Photos** — pick a location from the dropdown, drag in photo files (e.g. exported from an Apple Photos album).
2. **Swipe & Keep** — swipe right (or click Keep / press →) to keep a photo, left (or Discard / ←) to skip it. Aim for ~25 keepers per location.
3. **Library** — every kept photo, across every location. Drag any thumbnail straight onto a photo box anywhere on the live site (homepage hero, destination galleries, activity galleries, trip gallery) to place it there. You can also drag an image file directly from Finder onto a photo box on the site — it's saved as a kept photo automatically.

Everything is stored in your browser (IndexedDB), so it survives page reloads, but it's still local-only — it doesn't go anywhere until you export it. Use **Export kept photos (.zip)** in the Library tab to download the finalized photos, organized in folders by location, once you're happy with a location's set.

**Before launching publicly:** delete `curation.js`, and remove every `<script src="/curation.js"></script>` line (one per HTML page, including the generated destination pages — easiest to do a project-wide find/replace, or add a line to `generate-destinations.js` to stop including it before your final regeneration). The Studio self-injects its toggle button and panel, so there's nothing else to remove.

## Swapping in real photos permanently

Right now, photos placed via the Studio only live in your browser. To make them permanent/deployable:

1. Export the kept photos from the Studio (zip).
2. Drop the image files into `assets/images/<location-id>/` (location ids are in `data.js`, e.g. `maldives`, `hawaii-kauai`, `banff`).
3. Pre-populate `window.PHOTO_LIBRARY` with the real paths — simplest is a new tiny file, e.g. `photos.js`:
   ```js
   window.PHOTO_LIBRARY = {
     maldives: ["/assets/images/maldives/maldives-01.jpg", "/assets/images/maldives/maldives-02.jpg", /* ... */],
     "hawaii-kauai": [ /* ... */ ],
   };
   ```
   Then add `<script src="/photos.js"></script>` right after `<script src="/data.js"></script>` on every page (and re-run `node generate-destinations.js` after adding that line to the generator's `page()` template so it's baked into every destination page too). Once real file paths are in there, the "+ add photo" placeholders disappear automatically everywhere they're used.

## Hosting on Google Cloud (when you're ready)

Easiest path is **Firebase Hosting** (built on Google Cloud, free tier is generous, gives you HTTPS automatically):

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. `firebase login`
3. From this folder: `firebase init hosting` — choose "use an existing project" (or create one in the Firebase console first), set the public directory to `.` (this folder), say **No** to single-page-app rewrite (not needed), don't overwrite `index.html`.
4. `firebase deploy` — it prints a live `*.web.app` URL immediately.
5. Once you buy a domain, add it in Firebase console → Hosting → "Add custom domain" and follow the DNS steps it gives you.

Alternative: a Cloud Storage bucket configured for static website hosting works too, but Firebase Hosting is simpler and handles HTTPS/CDN for you automatically.

## What's still placeholder

- Every photo box on the site (`+ add photo`) until you run them through the Photo Studio or add files directly.
- All destination/activity descriptive copy — generated to sound plausible and on-brand from each destination's activities, but written by me, not you. Meant to be read through and replaced with your real stories over time; it's not fake in a misleading way (no invented specific claims like certifications or prices), just generic enough to need your voice.
- Contact form goes to a `mailto:` link — swap for a real form (e.g. a Google Form embed, or a small backend) whenever you're ready.
- Color palette — deliberately not revisited yet, since you said you want to adjust it once real photos are in. Everything lives in the CSS variables at the top of `styles.css` (`--teal`, `--rust`, `--gold`, `--navy`, `--sand`, etc.) so it's a quick global change whenever you're ready.
