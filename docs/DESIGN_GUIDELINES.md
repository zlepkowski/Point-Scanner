# Design, UX, Motion & Compliance Guidelines

A working checklist for Claude Code to **audit and update** this project. It covers six areas:

1. Legal & compliance: 20 items (§1)
2. Unslop: visual polish, 20 items (§2)
3. UX laws & animation principles: 20 items (§3)
4. Motion implementation specs: 20 items (§4)
5. Backgrounds that make designs less flat: 22 options (§5)
6. Trend watch, or AI design trends to use on purpose: 20 items (§6)

> **How to use this file**
> - Put it in the repo (e.g., `docs/DESIGN_GUIDELINES.md`).
> - In `CLAUDE.md`, add a line such as: `Before any UI, copy, or data-handling work, read docs/DESIGN_GUIDELINES.md and follow it.` You can use `@docs/DESIGN_GUIDELINES.md` instead to load it every session. That costs more context.
> - To run a full pass, ask: **"Audit this project against DESIGN_GUIDELINES.md, give me the report, then fix the items."**

---

## 0. Operating rules for Claude

### 0.1 Priority when rules conflict
1. **Legal, privacy & accessibility** (§1) always win.
2. **Usability** (§3 UX laws) comes before looks.
3. **Clarity / unslop** (§2) comes before decoration.
4. **Motion** (§4) must support the content and must never block it.
5. **Aesthetic choices** (§5, §6) come last. Use them on purpose, not by default.

### 0.2 Never fabricate
- Never invent **testimonials, reviews, star ratings, user counts, customer logos, "as seen in" press mentions, case-study numbers, team members, or stats**.
- Never claim **compliance or certification** (GDPR, HIPAA, SOC 2, PCI, "bank-level security") unless the owner confirms it.
- Where real data is missing, insert a visible placeholder in the form `[[TODO: real testimonial with written permission]]`. List each one under "Needs owner input" in the audit report. Placeholders must be easy to find with a search and must never look like real content.

### 0.3 Legal documents
- Write privacy, cookie, and SDK disclosures **from what the code actually does**. Inventory the data fields, network calls, cookies/storage, and SDKs first, then write.
- Mark every generated legal page `DRAFT: requires review by a qualified lawyer before publishing.`
- Use placeholders for the company name, address, jurisdiction, governing law, and contact details. Never guess these.

### 0.4 Working style
- Use the project's existing design system, tokens, and component library before you create new ones.
- Don't add a dependency without saying why. Prefer native CSS/HTML.
- Verify changes: run lint, typecheck, and build. Run an accessibility check (axe or Lighthouse) where possible. Walk the key flows with the keyboard. Compare screenshots before and after.

### 0.5 Ten non-negotiables (quick reference)
1. No fake reviews, logos, stats, or unsupported claims.
2. Non-essential trackers load **only after consent**. "Reject" is as easy as "Accept."
3. Total price, including mandatory fees, is shown upfront. Canceling is as easy as signing up.
4. Users can delete their account and data **in the app**.
5. Text contrast meets WCAG 2.2 AA: **4.5:1 for body text, 3:1 for large text and UI parts**.
6. Everything works by keyboard, with a visible focus ring.
7. Touch targets are **at least 24×24 CSS px**. Aim for 44×44.
8. One primary CTA per view, with one accent colour.
9. Every async action has loading, empty, error, and success states.
10. `prefers-reduced-motion` is respected everywhere.

---

## 1. Legal & compliance (20)

| # | Item | Rule | How to check / implement |
|---|---|---|---|
| 1.1 | **Privacy policy** | Plain-language policy that matches real behavior: what data is collected, why, legal basis, retention period, who it is shared with (processors/SDKs), user rights (access, correct, delete, export, opt out), and contact details. | Inventory form fields, analytics events, logs, and SDKs first. Link the policy from the footer, signup, checkout, and app settings. It must match the App Store privacy label and the Google Play Data safety form. |
| 1.2 | **Terms of service** | Cover accounts, acceptable use, payments and subscriptions, termination, IP, disclaimers, limitation of liability, and governing law `[[TODO]]`. Version and date it. | At signup, get an affirmative action: an unchecked checkbox, or "By creating an account you agree to the Terms and Privacy Policy" directly beside the button, with links. Store the accepted version and timestamp. |
| 1.3 | **Refund policy** | State eligibility, time window, how to request a refund, and how subscription cancellation and proration work. | Link it from pricing and checkout. For in-app purchases, state that Apple or Google handles refunds and link to their process. |
| 1.4 | **Cookie policy** | List every cookie, localStorage key, and pixel with its name, provider, purpose, category (necessary / preferences / analytics / marketing), and duration. | Build the list by scanning the code and the first-load network and storage activity. Don't copy a generic template. |
| 1.5 | **Cookie consent banner** | Non-essential scripts stay blocked until the user opts in. At the first layer, "Reject all" is as visible as "Accept all." No categories are pre-ticked. Choices can be changed later. | Load the page fresh and confirm no analytics or ad requests fire before consent. Add a "Cookie settings" link in the footer. Honor Global Privacy Control (`navigator.globalPrivacyControl`) where required (e.g., California). Store the choice with a timestamp and policy version. The banner must be keyboard-accessible and must not cover the privacy link. |
| 1.6 | **Check form consents** | Marketing opt-in is a **separate, unchecked** checkbox and is never bundled with accepting the ToS. The label says exactly what the user will receive. | Audit every form. Record consent with a timestamp, the wording version, and the source. Mark which fields are required and which are optional. |
| 1.7 | **No unnecessary data** | Collect only what a feature needs. | Remove date of birth, phone, address, gender, company size, etc. unless a feature uses them. Don't log passwords, tokens, or PII. Mask sensitive fields in analytics and session replay. Set retention periods and auto-deletion. |
| 1.8 | **Audit third-party SDKs** | Every script or package that calls the network has to justify itself. | List each SDK, what it collects, where the data goes, and whether you need it. Remove unused ones. Disclose the rest in the privacy policy, the cookie list, and the store forms. Load non-essential SDKs only after consent. Consider self-hosting fonts so a font CDN doesn't receive users' IP addresses. |
| 1.9 | **Remove dark patterns** | No confirmshaming ("No thanks, I like paying more"), pre-checked add-ons, fake countdowns or scarcity, disguised ads, hidden decline buttons, forced continuity, or roach-motel cancellation. | **Canceling must take no more effort than signing up**: same channel, similar number of steps. Decline and cancel buttons must be visible and readable. Remind users before a trial converts. |
| 1.10 | **Remove hidden fees** | Show the total price, including all mandatory fees, as early as the first price the user sees. Several jurisdictions ban drip pricing. | Next to every buy button, show the price, billing interval, auto-renewal, trial end date, post-trial price, and how to cancel. Show taxes and shipping before the final step. |
| 1.11 | **Remove fake reviews** | Delete invented testimonials, ratings, review counts, avatars of fake people, and unlicensed customer logos. Regulators such as the US FTC and UK CMA actively penalize fake reviews. | Use only real reviews, with permission. Disclose incentivized, employee, or affiliate reviews. Never suppress negative reviews. Replace fakes with `[[TODO]]` placeholders. |
| 1.12 | **Remove unsupported claims** | Flag "#1," "best," "fastest," "10× faster," "99.9% uptime," "bank-level security," "HIPAA/GDPR/SOC 2 compliant," "clinically proven," "trusted by thousands," and "AI-powered" (if it isn't). | Keep a claim only if evidence exists. Otherwise rewrite it as a specific, checkable statement. List every removed or changed claim in the audit. |
| 1.13 | **Accessibility alt text** | Meaningful images get alt text that describes their purpose, never "image of…". Decorative images get `alt=""`. | Icon-only buttons get an `aria-label`. Charts get a text summary. Videos get captions. Inline SVG icons get `aria-hidden="true"` when they sit next to a text label. |
| 1.14 | **Fix color contrast** | WCAG 2.2 AA: **4.5:1** for normal text. **3:1** for large text (≥24px, or ≥18.66px bold), UI component borders, focus rings, and meaningful icons. | Check light and dark mode, plus hover, placeholder, and selected states. Check text over images, gradients, or glass at its **worst** point. Never use color alone to convey meaning; add an icon, text, or pattern. |
| 1.15 | **Keyboard navigation** | Everything works with Tab, Shift+Tab, Enter, Space, Esc, and the arrow keys. | Tab order must be logical. Every element needs a visible `:focus-visible` ring; never `outline: none` without a replacement. No keyboard traps. Modals trap focus inside and return it to the trigger on close. Add a "Skip to content" link. Use native `<button>`/`<a>`, not clickable `<div>`s. |
| 1.16 | **Add business details** | Show the legal entity name, contact email, and postal address, plus registration and VAT numbers where required. EU/UK sites often need an imprint (e.g., Germany's *Impressum*). | Put them in the footer, on the legal pages, and in transactional emails. Use `[[TODO]]` placeholders and never invent details. |
| 1.17 | **Age consent for kids' data** | Decide whether the app is aimed at, or likely to attract, children. For under-13s in the US (COPPA), or users below the EU digital age of consent (13–16 depending on the country), you need verifiable parental consent before collecting personal data, and no behavioral ads. | If the app is **not** for kids, say so in the ToS and privacy policy and use a **neutral age gate**: no hint about the "right" answer, and no default adult birth year. If it is for kids, flag it as high-risk for owner and lawyer review. |
| 1.18 | **Unsubscribe link in emails** | Every marketing email has a visible unsubscribe link that works in one step without logging in. Under CAN-SPAM, opt-outs must be honored within 10 business days and the email must include a physical postal address. | Bulk senders: add `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers (RFC 8058). Keep transactional and marketing streams separate. |
| 1.19 | **License fonts/images** | Every font, icon set, image, illustration, video, and sound has a known source and license. | Record each one in `CREDITS.md`. Prefer OFL fonts (e.g., Google Fonts) and MIT/ISC icon sets (Lucide, Heroicons, Phosphor). Use public-domain or properly licensed photos. Don't use scraped web images, logos you lack rights to, or copyrighted characters. Check that commercial font licenses cover web and app embedding. |
| 1.20 | **Data deletion request** | Users can delete their account and data **from inside the app**. Apple requires this for apps that allow account creation, and Google Play also requires a web deletion link. | Offer an email or web route too. Tell users what gets deleted and what is kept (e.g., financial records the law requires). Pass deletions on to processors. Let backups expire. Add a data export option if feasible. |

---

## 2. Unslop: visual polish (20)

| # | Item | Rule | Implementation notes |
|---|---|---|---|
| 2.1 | **Delete filler badges** | Remove "New," "Beta," "AI-powered," "✨ Introducing," and "Pro" pills that carry no real information. | A badge must be true, current, and change what the user does. |
| 2.2 | **Drop redundant labels** | Don't say the same thing twice, for example a section label and a heading with the same words, or an "Email" label + "Enter your email" placeholder + mail icon. | Keep visible input labels for accessibility; drop the repeated placeholder instead. Remove "Click here to…" from link text. |
| 2.3 | **Unitalicize random words** | Don't italicize or switch to serif on a single headline word for decoration. | Use italics only for real emphasis, titles, and defined terms. |
| 2.4 | **Mono only where needed** | Use monospace for code, keyboard keys, IDs, hashes, terminal output, and aligned data. | Don't use mono for eyebrows, nav, buttons, or body text just to look techy. |
| 2.5 | **Use a design system** | Every color, spacing, type size, radius, shadow, and motion value comes from tokens. No magic numbers. | Use the existing system (Tailwind config, CSS variables, shadcn theme). If there isn't one, create `tokens.css` (see §8). Use a 4/8px spacing scale. |
| 2.6 | **Show the actual product** | Replace abstract blobs, stock 3D shapes, and generic illustrations with real screenshots, live components, or a short real demo. | The hero should show what the user actually gets. Use `[[TODO: product screenshot]]` if none exist yet. |
| 2.7 | **Enlarge the main feature** | The most important thing is visibly the biggest, so size tracks importance. | Avoid grids of equal cards when one thing matters most. |
| 2.8 | **Group with spacing** | Group with proximity instead of borders, dividers, and nested cards. | Use tighter spacing inside a group (8–12px) and more between groups (24–64px). Remove card containers that only exist to draw a box. |
| 2.9 | **Make headlines specific** | Replace "Unlock your potential," "The future of X," and "Supercharge your workflow" with what the product does, for whom, and the result. | Prefer nouns and verbs to adjectives. Never invent numbers to sound specific (§0.2). |
| 2.10 | **Emphasize the CTA** | One primary CTA per view, filled with the accent colour. Secondary actions are ghost or text buttons. | Start labels with a verb that names the outcome ("Start free trial," "Send invoice"), not "Submit" or "Learn more." |
| 2.11 | **Add an accent colour** | A neutral palette plus **one** accent, used sparingly for the primary action, focus, active state, and key data. | Keep success, warning, and error colors separate from the accent. Don't paint every icon with it. |
| 2.12 | **Keep icons consistent** | One icon library, one stroke width, and one size scale (16/20/24). | Mix filled and outline icons only to show state (active vs. inactive). Don't use emoji as icons in UI chrome. Align icons to the text's cap height. |
| 2.13 | **Remove embellishments** | Strip decorative gradients, glows, blanket drop shadows, random blobs, dot patterns, and border + shadow + tint all on one element. | Every effect must earn its place, so remove it if the design reads the same without it. |
| 2.14 | **Inner radius = outer radius − padding** | Nested rounded corners stay concentric. | `--inner-radius: max(0px, calc(var(--outer-radius) - var(--padding)))`. Example: card radius 16 with padding 8 gives an inner radius of 8. |
| 2.15 | **Improve text contrast** | Go beyond the AA minimum where you can. Body text should be close to full contrast, and secondary text still ≥4.5:1. | Avoid light gray on white and gray on color. Put a scrim or solid surface behind text on images. |
| 2.16 | **Wrap headlines properly** | `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs. No orphans and no awkward mobile breaks. | Limit headline width to about 20–30ch and body text to about 60–75ch. Use `&nbsp;` to keep brand names and "number + unit" pairs together. |
| 2.17 | **Align by eye, not pixels** | Make optical corrections. Nudge play icons right. Let round and pointed shapes overshoot slightly. Hang quotation marks. Center icons to text cap height. | Use `text-box: trim-both cap alphabetic` where supported to center text in buttons. Check in a screenshot, not just the box model. |
| 2.18 | **Use tabular nums** | `font-variant-numeric: tabular-nums` on prices, tables, timers, counters, stats, and anything that updates. | Right-align numeric columns. |
| 2.19 | **Add loading states** | Every async view or action has **loading, empty, error, and success** states. | Use skeletons that match the final layout (no layout shift) and an inline spinner inside buttons. Show indicators only after about 300ms; once shown, keep them up for at least about 500ms to avoid flicker. Errors use plain language and offer a retry. Empty states explain the next step. |
| 2.20 | **Animate useful feedback** | Motion should explain what happened: added, saved, copied, failed, or where something went. It shouldn't decorate. | Follow §3 and §4. |

---

## 3. UX laws & animation principles (20)

### 3A. The 12 classic animation principles, translated to UI

| # | Principle | What it means in UI |
|---|---|---|
| 3.1 | **Squash & stretch** | A slight deformation shows elasticity: a toggle knob stretches as it travels (§4.5), and a button compresses on press. Keep volume roughly constant and the effect subtle. |
| 3.2 | **Anticipation wind-up** | A small cue before a big move, such as a hover lift before a drag or a slight dip before a card flies out. Never delay the response to user input to make room for it. |
| 3.3 | **Staging the focus** | Direct attention to one thing at a time. Dim the background behind modals, animate only the element that changed, and avoid competing simultaneous motion. |
| 3.4 | **Pose to pose** | Design clear start and end states first, then let the engine tween between them. Prefer state-driven transitions (CSS transitions, layout animations) over hand-built keyframes. |
| 3.5 | **Follow through** | Parts settle at slightly different times: the container lands first, then the children (§4.6). |
| 3.6 | **Slow in & slow out** | Always ease spatial motion. Linear easing is only for progress bars, spinners, and constant-speed marquees. |
| 3.7 | **Moving in arcs** | Objects traveling diagonally across the screen follow a curved path (§4.7). |
| 3.8 | **Secondary action** | Supporting motion reinforces the main action. For example, a checkmark draws in as the button turns green, or the cart badge bumps when an item lands. It must never distract. |
| 3.9 | **Snappy timing** | Micro-interactions take 100–200ms, most UI transitions 150–300ms, and large or full-screen transitions 300–500ms. Nothing user-blocking should exceed 500ms. |
| 3.10 | **Exaggerated feedback** | Important state changes should be unmistakable, like a shake on a wrong password or a pulse on success. Scale the exaggeration to the importance and keep everyday UI calm. |
| 3.11 | **Solid drawing in 3D** | Keep depth consistent: one light source, shadows in one direction, and an elevation scale in tokens. Higher elements cast larger, softer shadows. Keep perspective consistent for tilts and flips. |
| 3.12 | **Overall appeal** | One coherent personality, with the same curves, durations, and style everywhere. Motion should match the brand: a calm finance app and a playful game feel different. |

### 3B. UX laws

| # | Law | What to do |
|---|---|---|
| 3.13 | **Fitts's law** | The time to hit a target depends on its size and distance. Make primary actions large and close to the user's thumb, cursor, or attention. Keep destructive actions away from frequent ones. Screen edges and corners make easy targets on desktop. |
| 3.14 | **Bigger hit areas** | The minimum is **24×24 CSS px** (WCAG 2.2 AA). Aim for **44×44pt** (Apple) or **48×48dp** (Material) on touch. Expand the hit area with padding or a `::before` pseudo-element without changing how it looks. Leave space between adjacent targets. |
| 3.15 | **Hick's law** | Decision time grows with the number of choices. Cut options, use progressive disclosure, highlight one recommended choice, set smart defaults, and split long forms into steps. |
| 3.16 | **Miller's law** | Working memory is small, so chunk information: card and phone numbers, nav groups of about 5–7. Never make users remember data from one screen to use on another. |
| 3.17 | **Doherty threshold** | Respond within about **400ms** to keep users in flow. Show a pressed state within about 100ms. Use optimistic UI, prefetching, and skeletons when work takes longer. |
| 3.18 | **Postel's law** | Accept messy input and output clean data. Accept phone numbers with spaces or dashes, trim emails, accept pasted formatted card numbers, and parse common date formats. Normalize internally and display consistently. |
| 3.19 | **Jakob's law** | Users expect your product to work like others they know. Use conventions: logo top-left links home, a standard search icon, the cart top-right, and native platform patterns (iOS vs. Android). Innovate in your core value, not in standard controls. |
| 3.20 | **Frequency of use** | **The more often something happens, the less it should animate.** Keyboard shortcuts, command palettes, frequent toggles, and list navigation should be instant or close to it (≤100–150ms, or none). Save richer motion for rare moments like onboarding, a first success, or a celebration. |

---

## 4. Motion implementation specs (20)

### 4.0 Global motion rules
- Animate only `transform` and `opacity`, plus `clip-path` and `filter` sparingly. Never animate `width`, `height`, `top`, or `left`.
- State changes must be **interruptible**: use CSS transitions or springs, not one-shot keyframes.
- **`prefers-reduced-motion: reduce`**: replace movement with a short opacity fade or nothing. Disable parallax, marquees, autoplay, and looping effects.
- Never hide readable content behind a slow entrance animation.

### 4.1–4.20 Specs

| # | Spec | Implementation |
|---|---|---|
| 4.1 | **Ease-out for entrances** | Elements appearing (modals, menus, toasts) use `var(--ease-out)`: fast start, soft landing. |
| 4.2 | **Dropdowns at 150–250ms** | Menus, selects, and popovers open in 150–250ms. Default to 200ms. |
| 4.3 | **Stagger list rows by 30ms** | `animation-delay: calc(var(--i) * 30ms)`. Cap the total at about 300ms (stagger only the first ~10 rows). Run it on the first reveal only, not on every re-render. |
| 4.4 | **Scale to 0.97 on press** | `button:active { transform: scale(0.97); }` with `transition: transform 150ms var(--ease-out)`. Apply it to pressable buttons and cards. |
| 4.5 | **Stretch moving knobs 12%** | Toggle and slider knobs stretch about 12% along the direction of travel while moving or pressed (`scale: 1.12 1` or width × 1.12), then return at rest. |
| 4.6 | **Stagger as details settle** | The container arrives first, then its contents in hierarchy order (heading, then body, then actions), 30–50ms apart. |
| 4.7 | **Arcs for object movement** | For cross-screen travel (add-to-cart, shared elements), animate x and y with different easings, or use `offset-path`, so the path curves. |
| 4.8 | **Pulse to confirm success** | One quick pulse, `scale 1 → 1.06 → 1` or a fading ring, over about 300ms on save, copy, or add. Run it once and never loop. |
| 4.9 | **Ease-in-out for moves** | Elements already on screen that change position (reordering, layout shifts, tab indicators) use `var(--ease-in-out)`. |
| 4.10 | **Start popovers at 0.95** | Enter from `opacity: 0; transform: scale(0.95)` to `opacity: 1; transform: scale(1)`. Never start from `scale(0)`. |
| 4.11 | **Enter from the trigger** | Set `transform-origin` to the trigger's side. With Radix, use `var(--radix-popover-content-transform-origin)` or `var(--radix-dropdown-menu-content-transform-origin)`. Centered modals are the exception. |
| 4.12 | **Exit to the trigger** | Closing reverses toward the same origin, so users see where the element went. |
| 4.13 | **No bounce on everyday UI** | Menus, modals, toasts, buttons, and drawers use critically damped motion: `{ type: "spring", bounce: 0 }` in Motion, or an ease curve. Save bounce for celebrations and drag releases. |
| 4.14 | **Don't tween while held** | While dragging, scrubbing, or holding a finger down, the element follows the input 1:1 with `transition: none`. Animate only on release. |
| 4.15 | **Make exits 20% shorter** | Exit duration ≈ 0.8 × entrance duration (e.g., 200ms in, 160ms out). The user has already decided to leave. |
| 4.16 | **Overlap old & new states** | Crossfade or overlap the outgoing and incoming states instead of running them in sequence. In Motion, use `AnimatePresence` with `mode="popLayout"` (or the default `sync`) instead of `wait`. For page and state swaps, use the View Transitions API. No blank frames. |
| 4.17 | **Masks for reveals & colour** | Reveal content or sweep colour changes with `clip-path` (`inset()`, `circle()`) or masks instead of moving the element, e.g., a circular reveal on a theme toggle or a wipe-in on text. |
| 4.18 | **Crossfade icons + blur** | For icon swaps (copy → check, play → pause, menu → close), the outgoing icon goes to `opacity 0, scale ~0.5, blur(4px)` while the incoming icon comes from those values to `1 / 1 / blur(0)`, over about 150–200ms. |
| 4.19 | **Rubber band past bounds** | Dragging past a limit meets increasing resistance, e.g., `offset = (1 − 1 / (overflow × 0.55 / size + 1)) × size`, then springs back on release. |
| 4.20 | **Reuse the same layoutId** | In Motion (formerly Framer Motion), give the same `layoutId` to an element in both states, such as a tab underline, a selected pill, or a card that expands into a detail view, so it morphs between them. Without Motion, use `view-transition-name` with View Transitions. |

---

## 5. Backgrounds that make designs less flat (22)

### 5.0 Rules
- Use **at most one** atmospheric background per view, usually in the hero, a section break, an empty state, or a marketing page. Don't put one behind dense app UI.
- Text on top must pass contrast **at its worst point**. Add a scrim or a solid surface behind text.
- Build them cheaply: CSS gradients, SVG `feTurbulence` noise, small tiled WebP/AVIF images, or canvas/WebGL only when justified. Keep mobile background assets small and lazy-load them.
- Animated backgrounds pause offscreen, respect reduced motion, and avoid heavy shaders on low-power devices.
- Every image or texture must be licensed (§1.19). Use paintings only if they are in the public domain.
- Choose one for a reason tied to the brand, not because it's available.

| # | Background | Feel | How to build | Good for |
|---|---|---|---|---|
| 5.1 | **Felt texture** | Soft, tactile, cozy | Fine noise plus a low-contrast fiber texture | Consumer, kids, craft |
| 5.2 | **Fluted glass** | Refracted vertical ribs | `repeating-linear-gradient` ribs over a blurred image, or an SVG displacement map | Premium heroes |
| 5.3 | **Thermal gradients** | Heat-map energy | Layered radial/mesh gradients in saturated hues | Data, energy, AI |
| 5.4 | **Water ripples** | Calm, organic | SVG `feTurbulence` + `feDisplacementMap`, or WebGL | Wellness, travel |
| 5.5 | **Speckled graphite** | Dark, mineral | Dark base plus fine light noise | Dev tools, dark mode |
| 5.6 | **Single-hue landscapes** | Moody, scenic | A licensed photo with a duotone or monotone filter | Brand storytelling |
| 5.7 | **Blueprint grids** | Precise, technical | `linear-gradient` grid lines on blue or dark | Engineering, hardware |
| 5.8 | **Halftone** | Print, retro | `radial-gradient` dot pattern or SVG | Editorial, bold brands |
| 5.9 | **Grainy gradients** | Warm, analog | Gradient plus an SVG noise overlay (`mix-blend-mode: overlay`), which also prevents banding | General heroes |
| 5.10 | **Grass texture** | Natural, outdoors | A licensed photo texture | Sports, garden, eco |
| 5.11 | **Dithered images** | 1-bit, retro-digital | Pre-processed ordered or Floyd–Steinberg dither | Tech, indie |
| 5.12 | **Paper texture** | Analog, editorial | A paper scan with `mix-blend-mode: multiply` | Writing, notes |
| 5.13 | **Contour lines** | Topographic, exploratory | Generated SVG paths from noise | Maps, outdoors, data |
| 5.14 | **Cloud sky** | Airy, optimistic | A licensed photo or soft gradient with clouds | Calm consumer |
| 5.15 | **Pixel mosaics** | Playful, digital | A grid of colored squares (SVG or canvas) | Gaming, creative |
| 5.16 | **Lens distortion** | Optical depth | WebGL or SVG displacement, radial blur | Camera, premium |
| 5.17 | **Stippled gradients** | Scientific, crafted | Dot density varying across a gradient | Editorial, science |
| 5.18 | **Square-dot grids** | Subtle structure | `radial-gradient` or square dots with `background-size` | SaaS, canvas apps |
| 5.19 | **Blurred photos** | Atmospheric, real | A heavy blur on a licensed or product photo | Media, music, hospitality |
| 5.20 | **Iridescent shapes** | Holographic, futuristic | `conic-gradient` plus blur and `hue-rotate` | Fashion, launches (sparingly) |
| 5.21 | **Impressionist paintings** | Painterly, cultured | **Public-domain** paintings only | Editorial, calm brands |
| 5.22 | **ASCII and pixels** | Hacker, terminal | A character grid on canvas, or pre-rendered | Dev tools |

> 5.8, 5.11, 5.15, 5.21, and 5.22 overlap with §6 trends. They are fashionable right now, so they date quickly.

---

## 6. Trend watch: AI design trends to use on purpose (20)

These are what AI-generated designs keep converging on. Any one of them can work. Stacked together, they read as "made by AI in one prompt."

**Rules**
- Use a trend only when it serves the brand or the content, and use **no more than one or two per project**.
- **Never ship the default AI landing page**: a cream background, an Instrument Serif headline with one italic word, an all-caps eyebrow, a sparkle icon, three icon cards, a logo marquee, and a pulsing "live" dot.

| # | Trend | Use only when… | Watch out for |
|---|---|---|---|
| 6.1 | **Dithering** | The brand is retro or technical | Legibility, file size |
| 6.2 | **ASCII over video** | It's a hero moment for a dev or creative brand | CPU cost. Needs a pause control and a reduced-motion fallback. |
| 6.3 | **Infinite canvases** | The product is genuinely spatial (whiteboards, design tools) | Not for marketing content. Keyboard and screen-reader access. |
| 6.4 | **Disco logos** | It's a one-off launch moment | Distraction. Reduced motion. |
| 6.5 | **Renaissance branding** | The content is cultural or editorial | Public-domain art only. Cliché. |
| 6.6 | **Monet backgrounds** | The brand is calm or editorial | Text contrast. Public-domain art only. |
| 6.7 | **Dark gradient heroes** | It genuinely fits the brand | The most generic AI look. Contrast of muted text. |
| 6.8 | **Pixel loaders** | The product is playful | They must still show progress. Reduced motion. |
| 6.9 | **Instrument Serif** | The brand voice is editorial | Heavily overused. It's OFL-licensed, so licensing isn't the issue; sameness is. |
| 6.10 | **One italic word** | Almost never (see §2.3) | Pure decoration |
| 6.11 | **Cream backgrounds** | The brand is warm or editorial | Muted text on cream often fails contrast. Default AI look. |
| 6.12 | **All-caps eyebrows** | The eyebrow adds real information (category, step number) | Usually redundant (§2.2). Use CSS `text-transform: uppercase`, not typed capitals, so screen readers don't spell the word out. |
| 6.13 | **Pulsing live dots** | Something is **actually** live or real-time | Fake liveness is a dark pattern (§1.9). Reduced motion. |
| 6.14 | **Sparkle icons** | They mark AI-generated actions, used consistently | Meaningless decoration. A clear text label is often better. |
| 6.15 | **Liquid Glass** | Native Apple-platform apps using system materials | Legibility and contrast. Don't hand-roll imitations on the web. Respect Reduce Transparency. |
| 6.16 | **Three icon cards** | Rarely. Show the real product instead (§2.6). | The most generic layout there is |
| 6.17 | **Decorative flowcharts** | The diagram explains a real flow accurately | A fake architecture diagram is an unsupported claim (§1.12). |
| 6.18 | **Endless marquees** | The logos are real and you have permission to show them | Fake "trusted by" logos (§1.11). WCAG 2.2.2 requires a way to pause motion that lasts over 5 seconds. Reduced motion. |
| 6.19 | **Squircles** | They match the platform (iOS) or the brand | Progressive enhancement: `corner-shape: squircle` works natively only in Chromium 139+ as of mid-2026. Keep the `border-radius` fallback (§8). |
| 6.20 | **Pretext text wrapping** | You need text layout CSS can't do, such as text flowing around arbitrary shapes, shrink-wrapped bubbles, canvas or WebGL text, or measuring heights before render for virtualized lists. `@chenglou/pretext` is MIT-licensed and about 15KB. | Don't add it for what `text-wrap: balance` or `shape-outside` already handle. Keep real, selectable DOM text for accessibility. |

---

## 7. Audit workflow & report template

### 7.1 Workflow
1. **Inventory**: routes and screens, components, forms, network calls, third-party scripts and SDKs, cookies and storage, assets (fonts, images, icons), and email templates.
2. **Score** every item in §1–§4 and §6: ✅ Pass / ⚠️ Partial / ❌ Fail / N/A, with `file:line` evidence. §5 is a menu, not a checklist.
3. **Report first**, then fix in this order:
   1. Legal and accessibility blockers
   2. UX laws
   3. Unslop polish
   4. Motion
   5. Aesthetic and trend choices
4. **Use placeholders** for anything that needs real-world information (§0.2) and list each one under "Needs owner input."
5. **Verify**: build, lint, typecheck, run an axe or Lighthouse accessibility pass, walk the keyboard through the key flows, test reduced motion, compare screenshots before and after, and check first-load network activity for pre-consent trackers.

### 7.2 Report template
```md
## Design & Compliance Audit — <project> — <date>

### Summary
- ❌ Blockers (legal / accessibility): N
- ⚠️ Partial: N
- ✅ Pass: N
- N/A: N

### Results
| § | Item | Status | Evidence (file:line) | Fix |
|---|------|--------|----------------------|-----|
| 1.5 | Cookie consent banner | ❌ | src/app/layout.tsx:12 loads GA before consent | Gate behind consent store |

### Needs owner input
- [ ] Legal entity name, address, VAT number (§1.16)
- [ ] Real testimonials with permission (§1.11)
- [ ] Is this app directed at or likely used by children? (§1.17)

### Claims removed or rewritten (§1.12)
- "Trusted by 10,000+ teams" → removed (no source)

### Changes made
- …
```

---

## 8. Starter tokens (use only if the project has no design system)

```css
:root {
  /* Color: neutrals + ONE accent */
  --bg: #ffffff;
  --surface: #f6f6f7;
  --text: #111113;
  --text-muted: #55565c;      /* check ≥4.5:1 on --bg and --surface */
  --border: #e3e3e6;
  --accent: #2f5bff;          /* replace with the brand colour */
  --accent-contrast: #ffffff;
  --success: #12805c;
  --warning: #a35c00;
  --danger: #c4262e;

  /* Spacing (4/8 scale) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  /* Radius (nested: inner = outer − padding) */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-xl: 24px;

  /* Type */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  /* Elevation (single light source, top) */
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-2: 0 4px 12px rgb(0 0 0 / 0.08);
  --shadow-3: 0 12px 32px rgb(0 0 0 / 0.12);

  /* Motion */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --dur-instant: 100ms;
  --dur-fast: 150ms;
  --dur-base: 200ms;
  --dur-slow: 300ms;
  --dur-exit: calc(var(--dur-base) * 0.8);
  --stagger: 30ms;
  --press-scale: 0.97;
  --pop-start-scale: 0.95;
}

/* Typography polish */
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }
.num, table td, .price, .timer { font-variant-numeric: tabular-nums; }

/* Focus */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* Press feedback */
.pressable { transition: transform var(--dur-fast) var(--ease-out); }
.pressable:active { transform: scale(var(--press-scale)); }

/* Squircle as progressive enhancement */
.card { border-radius: var(--radius-lg); }
@supports (corner-shape: squircle) {
  .card { corner-shape: squircle; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
