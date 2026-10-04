# Jared Tanksley — Neon portfolio V6

Static portfolio for GitHub Pages. No build step or JavaScript dependencies.

## Content

Four core focuses, in order: Network Engineering, Project Management, Data Visualization, Computer Systems.
Experience is grounded in the supplied project management resume. Project management capabilities include Waterfall, Agile, Scrum, PMO support, budgets, risk and stakeholder communication.

Selected work covers railroad planning, county plat intelligence, data visualization, and generative AI automation. All four cards use a single-column layout with matching photographic backgrounds. The original railroad planning photograph is retained; the other three backgrounds are illustrative generated images, documented in `IMAGE-CREDITS.md`.
Education features a full-width Oklahoma State University degree, a translucent OSU logo, Google Project Management, Udacity Digital Project Management, Google AI Professional Certificate (2026), and Google IT Support. PMP is shown as Candidate.
Home and About are combined into one introduction with a single biography paragraph and the supplied cropped headshot. The profile console and horizontal stats strip are removed. Capabilities uses the outlined “Clearer data. Better delivery. Smarter systems.” heading.

## Interaction

Neon pointer and touch bloom follows the latest pointer coordinates directly. Its diameter is 1.9 times the previous version, with a brighter glow; the short trails and expanding ripples keep their previous sizes. Cached glow sprites, smaller canvas surfaces and infrequent ambient updates reduce drawing work. The light sits behind page content and dims over photos, project cards, links, buttons and navigation. The effect slowly changes colors over a 24-second cycle, including while a pointer is held still.
The navigation opens in 320 ms, with quick staggered entries, a brief neon edge flash, luminous hover/focus accents and an animated hamburger icon. Its current section is highlighted. The backdrop uses a simple opacity transition to keep opening responsive.
Native touch scrolling, keyboard focus, Escape-to-close and reduced motion are supported. Reduced motion uses a steady light without animated trails.

## Resume

`jared-tanksley-resume.pdf` is an exact, unmodified byte-for-byte copy of the newly supplied `Jared Tanksley's Resume.pdf`. No resume content, layout or metadata was edited.

## Preview and edit

Open `index.html`, or run `python3 -m http.server 8000` and open `http://localhost:8000`.

- Content and links: `index.html`
- Appearance: `css/styles.css`
- Interaction: `js/site.js`
- Images: `images/`

Google Fonts is optional; system fonts work offline. Publishing instructions are in `DEPLOY.md`. This package has not been pushed to GitHub.
