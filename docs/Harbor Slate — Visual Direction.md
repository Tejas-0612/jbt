# Harbor Slate — Visual Direction

Oct 10, 2026 · @SB Dev

Harbor Slate is the chosen direction for the Job Tracker: Harbor's warm, calm layout with a muted slate blue for trust and a sand accent for hope. This is the direction exploration, not yet the final design system.

## Why Harbor Slate

Slate blue wins because it carries blue's trust without looking like LinkedIn or Indeed, and its low intensity suits an anxious user.

&#91;image: Harbor Slate dashboard, light mode\]

&#91;image: Harbor Slate dashboard, dark mode\]

Home dashboard in light and dark mode. Company names, people and numbers are invented sample data; "Job Tracker" is a placeholder wordmark.

### How brands use colour

Colour psychology is real but context-dependent. Strong brands choose a colour for three reasons: the feeling it creates, how it separates them from competitors, and years of consistent use. Harbor Slate is chosen on the same three tests.

| Test | What the job seeker needs | How Harbor Slate answers it |
| --- | --- | --- |
| Feeling | Calm and control during an anxious, uncertain search | Blue is the colour most associated with trust and stability; a muted slate lowers emotional intensity further |
| Standing out | A tool that does not blur into LinkedIn, Indeed or Naukri, which use bright saturated blues | Slate is greyer and softer than any of them; with the ivory canvas and serif greeting it reads as its own brand |
| Hope | Encouragement without false cheer | Sand, a warm accent, appears only at small moments (chart response line, milestones, offer celebration) |
| Meaningful status colours | Green must feel special for an offer; red only for errors | A blue brand leaves green, amber, red and violet free for the pipeline |
| Daily use for months | Low eye strain, comfortable dark mode | Muted colours tire the eyes less; slate's dark mode is the most comfortable of the options tested |
| Broad audience | Works for graduates and senior leaders, any gender | Slate is age- and gender-neutral and reads as professional across cultures, including India |

### What changed from the original Harbor

- Primary colour: deep teal → slate blue #3D5A80.
- Accent: terracotta → sand #D9A574.
- Text neutrals re-tuned from green-grey to slate-grey so they sit with the new primary.
- **Applied** status moved to a bright cerulean #1C6FAE so it stays distinct from the muted slate brand.
- Primary buttons get a subtle shadow and inner bottom edge, so a muted colour still reads as clickable.

Layout, typography, ivory canvas, shapes and components are unchanged from Harbor.

## Colour palette

Slate does the work, the ivory canvas does the warming, and sand is a spice used once or twice per screen.

&#91;image: Harbor Slate palette swatches\]

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Primary | #3D5A80 | #93AFD3 | Primary buttons, links, active nav icon, focus ring, chart series 1 |
| Primary hover | #314967 | #A9C1E0 | Hover and pressed on primary |
| Secondary | #25384F | #E0E7F0 | Brand wordmark, active nav label, inverse chips |
| Accent (sand) | #D9A574 | #E2B48A | Decorative only: chart highlight, milestones, offer celebration, notification dot |
| Accent text | #8A5A2B | #E2B48A | When a sand-coloured label is unavoidable (5.4:1 on ivory) |
| Background | #F8F6F2 | #121519 | App canvas |
| Sidebar | #F1EEE8 | #15191E | Navigation panel |
| Surface | #FFFFFF | #1A1F25 | Cards, tables, panels |
| Elevated surface | #FFFEFC + shadow | #222830 | Menus, popovers, modals |
| Main text | #1E2329 | #ECEFF2 | Headings, body |
| Secondary text | #4D5560 | #AEB6C0 | Labels, meta, column headers |
| Muted text | #69707A | #87909B | Timestamps, placeholders, helper text |
| Border (hairline) | #E8E3DA | #2A3038 | Dividers, card edges |
| Control border | #8E949C | #68727E | Inputs, selects, checkboxes (3:1 or better) |
| Success | #2E7D4F | #5CC287 | Offer, confirmations |
| Warning | #9E5C06 | #E9A84A | Overdue follow-ups, deadlines within 48 hours |
| Error | #C42B3A | #F27180 | Validation, destructive actions |
| Info | #1C6FAE | #5FB0EA | Neutral system notices, tips |

### Application status colours

Status colours are fixed semantics and never change with branding. Every badge shows colour plus a text label.

| Stage | Light | Dark | Notes |
| --- | --- | --- | --- |
| Saved | #646B78 | #8A929C | Neutral, not acted on yet |
| Applied | #1C6FAE | #5FB0EA | Bright cerulean, deliberately more saturated than the slate brand |
| Screening | #0F7A73 | #3FB8A6 | First contact made |
| Interviewing | #6B4FB8 | #A68EEA | Active process |
| Offer | #2E7D4F | #5CC287 | The one moment green should feel earned |
| Rejected | #A0524A | #D99088 | Dusty, not alarming; rejections are frequent |
| Withdrawn | #69707A, hollow dot | #87909B, hollow dot | Closed, inactive |

### Usage rules

- Slate is the only strong colour on a screen; one primary button per view.
- Sand never carries text or meaning alone, and never appears in large areas.
- Red is reserved for errors and destructive actions, never for low numbers or slow weeks.
- Large areas stay neutral (ivory, white, sidebar); colour lives in small, meaningful places.

## Typography

Figtree runs the whole interface; Newsreader, a serif, appears only in a few human moments.

- **UI and body:** Figtree 400 / 500 / 600 (700 only for the wordmark). Friendly rounded shapes, very legible at 14–15px, free on Google Fonts, with tabular figures for counts, dates and salaries.
- **Display (limited):** Newsreader 500 for the dashboard greeting, empty-state headlines, onboarding and milestone moments. Never in tables, forms or navigation.
- **Why:** the serif gives the brand a recognizable, human voice at almost no cost; keeping it out of data UI keeps screens efficient.

| Style | Font | Size / line height | Weight | Use |
| --- | --- | --- | --- | --- |
| Display | Newsreader | 32 / 40 | 500 | Greeting, onboarding, milestones |
| H1 | Figtree | 24 / 32 | 600 | Page titles |
| H2 | Figtree | 20 / 28 | 600 | Section titles |
| H3 | Figtree | 16–17 / 24 | 600 | Card titles |
| Body | Figtree | 15 / 24 | 400 | Default reading text |
| Body compact | Figtree | 14 / 20 | 400–500 | Tables, dense lists |
| Small | Figtree | 13 / 18 | 400–500 | Meta, helper text |
| Caption | Figtree | 12 / 16 | 500 | Badges, chart labels |

Headings use tight tracking (-0.01em); numbers in KPIs and tables use tabular figures so columns align.

## Visual characteristics

Soft, paper-like cards on a warm desk: rounded, lightly shadowed, never heavy.

| Element | Specification |
| --- | --- |
| Radius | 8px controls, 12px cards, 16px modals, pill for badges and avatars |
| Borders | 1px warm hairline #E8E3DA for structure; 1px control border #8E949C for inputs and checkboxes |
| Shadows | Card: 0 1px 3px rgba(60,45,30,0.06). Overlay: 0 12px 32px rgba(60,45,30,0.12). Dark mode uses lighter surfaces instead of shadows |
| Cards | White on ivory, 12px radius, 24px padding, subtle shadow, title row with optional link at right |
| Primary button | 40px tall, 8px radius, slate fill, white text (7.1:1), 600 weight, shadow 0 1px 2px rgba(37,56,79,0.22) plus a 1px darker inner bottom edge |
| Secondary button | White, warm hairline border, main text; 32px compact version for row actions ("Mark sent") |
| Tertiary button | Slate text only, 600 weight |
| Inputs | 40px, white, 8px radius, control border; focus = slate border + 3px slate ring at 18% |
| Tables | 48px rows (40px compact toggle), header #FBFAF7, row hover #F4F1EC, horizontal dividers only |
| Badges | Pill, 24px, 12.5px 500 text, 6px dot, status colour on a 12% tint |
| Icons | Phosphor Regular, 1.5px stroke, 18px in navigation, 16px in UI; KPI icons sit in 36px tinted squares |
| Illustrations | Small warm line illustrations (slate line, sand fill spots) for empty states, onboarding and milestones; objects and scenes only, no mascot |

## Navigation

- **Sidebar:** 248px, #F1EEE8, 38px items with 8px rounded active fill. Sections: Home, Applications, Interviews, Follow-ups & tasks, Companies, Contacts, Notes, Insights. A gentle weekly summary card sits at the bottom instead of plan upsells.
- **Top bar:** 64px, transparent on the canvas: search field with a ⌘K hint, "Add application" primary button, notifications bell (sand dot for unread), avatar.
- **Active item:** white fill with a soft shadow, slate icon, deep-slate label; reads like a selected card.
- **Profile:** top-right avatar (#E0E7F0 circle, slate initials) opens settings, theme and sign out.
- **Mobile:** bottom tab bar (Home, Applications, Add, Calendar, More) on white, slate active icon plus label.

## Dashboard

The home screen answers "where do I stand and what do I do next" in one scroll; the mockups at the top of this doc show it.

- **Greeting:** Newsreader line with context ("Good afternoon, Asha.") and one supportive sentence.
- **KPI cards (4):** Active applications, Interviews this week, Follow-ups due, Response rate, each with a tinted icon chip and a neutral or positive note; never red for low numbers.
- **Pipeline:** five stage cards (Saved to Offer) with count and a thin bar in the status colour; clicking a stage filters Applications.
- **Coming up:** interviews with date, company logo, round and prep-checklist progress.
- **Follow-ups:** due today and this week with one-click "Mark sent"; overdue shown in warning text.
- **Chart:** applications per week as slate bars with responses as a sand line, last 8 weeks.
- **Recent updates:** status badge plus a plain-language event line.

## Application management

- **Table:** company logo (28px rounded square), role in 500, status badge, applied date, next step with due-date chip, salary, source; comfortable rows with a compact toggle; sortable headers, column chooser, bulk select.
- **Board:** columns on ivory with a stage chip and count; white 12px cards show company, role, next step and days in stage. Rejected and Withdrawn columns start collapsed to reduce discouragement.
- **Filters:** pill chips under the page title (Status, Date, Source, Location, Remote); saved views as segmented tabs.
- **Search:** top-bar field plus ⌘K command palette across applications, companies and contacts.
- **Detail page:** hero card (logo, role, company, location, status selector, primary "Log update"), tabs below (Overview, Interviews, Contacts, Notes, Files), right rail with Next steps and Timeline.
- **Activity timeline:** vertical warm hairline, 28px circular icon nodes tinted by event type, friendly copy ("You sent a follow-up to Priya"), newest first, grouped by day.

## Forms

- **Inputs and selects:** 40px, label above in 14px 500 secondary text, helper text below in 13px muted with encouraging copy.
- **Selects:** same box with a chevron; long lists become searchable comboboxes, status options show their coloured dot.
- **Date picker:** rounded popover, slate selected day, ivory "today" highlight, quick presets (Today, +3 days, +1 week) for follow-ups.
- **Textareas:** 120px default, auto-grow; used heavily for notes.
- **Checkboxes and radios:** 18px, 5px radius checkbox, slate fill when checked, control-border outline at rest.
- **Validation errors:** error border plus message and icon below the field, phrased helpfully ("Add the company name so we can match it"); a summary banner on submit.
- **Form sections:** each section a white card on ivory with a title and one-line description; long forms become a stepped flow on mobile.

## Light and dark mode

Both modes ship; light is the hero and dark is a full-quality peer.

- **Dark canvas:** a neutral slate-charcoal #121519 (not pure black, not blue-black) keeps the calm, warm feel.
- **Primary:** lightens to #93AFD3; primary buttons switch to dark text (#121519, 8.1:1).
- **Elevation:** expressed by lighter surfaces (#1A1F25 → #222830) instead of shadows.
- **Constant across modes:** status hue families, sand accent, layout, typography and the serif greeting.
- **Contrast:** every text token meets 4.5:1 or better on its background in both modes; control borders meet 3:1.

## Responsive design

| Breakpoint | Layout |
| --- | --- |
| Desktop (1280px+) | Full sidebar, 12-column grid, max content width 1360px, comfortable density |
| Tablet (768–1279px) | Collapsible sidebar, KPI cards 2×2, detail right rail moves under the tabs |
| Mobile (under 768px) | Bottom tab bar, application list as cards, board as swipeable stages, stepped forms, sticky Save bar; the serif greeting stays |

## Accessibility

The target is WCAG 2.2 AA; every colour in this doc was checked against its background.

| Area | Rule |
| --- | --- |
| Colour contrast | Body text 14.6:1, secondary 7.0:1, muted 4.6:1 on ivory; white on slate buttons 7.1:1; status badge text 4.5:1 or better |
| Focus states | 2px slate ring with a 2px ivory offset on every interactive element, including cards and board items |
| Keyboard | ⌘K palette, J/K to move through lists, Enter to open, Esc to close; board cards move via a "Move to…" menu |
| Error states | Icon plus text, announced to screen readers, never colour alone |
| Readability | 15px body default, 48px table rows, 40px inputs; density toggle for power users |
| Touch targets | 44×44px minimum on touch devices; compact desktop controls keep at least 24px hit areas |
| Motion | 120–200ms ease-out state changes only; reduced-motion setting respected |
| Colour-only meaning | Sand never carries meaning alone; every status shows colour plus a label |

## Design token preview

```text
Colors
  brand.primary        #3D5A80 / dark #93AFD3
  brand.primary.hover  #314967 / dark #A9C1E0
  brand.secondary      #25384F / dark #E0E7F0
  brand.accent         #D9A574 / dark #E2B48A   (text variant #8A5A2B)
  bg.canvas #F8F6F2 · bg.sidebar #F1EEE8 · bg.surface #FFFFFF · bg.elevated #FFFEFC
  dark: bg.canvas #121519 · bg.sidebar #15191E · bg.surface #1A1F25 · bg.elevated #222830
  text.primary #1E2329 · text.secondary #4D5560 · text.muted #69707A
  border.hairline #E8E3DA · border.control #8E949C
  feedback.success #2E7D4F · warning #9E5C06 · error #C42B3A · info #1C6FAE
  status.saved #646B78 · applied #1C6FAE · screening #0F7A73 · interviewing #6B4FB8
         offer #2E7D4F · rejected #A0524A · withdrawn #69707A
Typography
  family.sans Figtree · family.display Newsreader (limited)
  size 12 / 13 / 14 / 15 / 16 / 20 / 24 / 32 · weight 400 / 500 / 600
Spacing
  4px base: 4 8 12 16 20 24 32 40 48 64
  card padding 24 · row height 48 (compact 40) · section gap 32
Radius
  sm 8 · md 12 · lg 16 · pill 999
Shadows
  card     0 1 3 rgba(60,45,30,0.06)
  overlay  0 12 32 rgba(60,45,30,0.12)
  button   0 1 2 rgba(37,56,79,0.22) + inset 0 -1 0 rgba(0,0,0,0.16)
Borders
  1px border.hairline · controls 1px border.control · focus 2px brand.primary + 2px offset
```

Next step: confirm this direction and it becomes the final UI/visual design system, with full component specs, states and screen patterns.
