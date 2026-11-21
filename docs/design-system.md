# Design system — "Floodlit night match"

The visual language comes from the subject: a stadium at night. A deep navy pitch under floodlights,
club crests, trophy gold, card colours. Tokens live in `apps/web/src/app/globals.css` (`@theme`);
components in `apps/web/src/components`.

## Colour

| Token                             | Value                             | Use                                              |
| --------------------------------- | --------------------------------- | ------------------------------------------------ |
| `bg`                              | `#0e1420`                         | Page (night)                                     |
| `surface` / `-2` / `-3`           | `#151d2c` → `#243049`             | Cards, raised controls, chips                    |
| `line` / `line-strong`            | `#2a3650` / `#3a4866`             | Borders                                          |
| `ink` / `ink-muted` / `ink-faint` | `#f2f4f8` / `#9aa6bd` / `#8693ab` | Text. Faint is ≥ 4.5:1 on every surface          |
| `accent` (trophy gold)            | `#e3b85c`                         | The one primary action per view, leader, honours |
| `success` (pitch green)           | `#3dbe8b`                         | Success, approve, verified                       |
| `danger` (card red)               | `#e5484d`                         | Destructive actions, errors                      |
| `warning` (card amber)            | `#f0a44b`                         | Pending states                                   |
| `info`                            | `#7ab0ff`                         | Links in admin, co-leader                        |

Rules: gold appears once per view as the primary action. Green and red carry meaning only (never decoration).

## Type

- **Readex Pro** 600/700: headings, numbers, clan tags (`.kit-tag`: wide tracking, tabular, always LTR).
- **IBM Plex Sans Arabic** 400/500/700: body and UI. Both cover Arabic and Latin, so AR and EN share one voice.
- Self-hosted Arabic + Latin subsets in `public/fonts`, the first-paint faces preloaded per locale.
- Scale: 1.25 ratio from 16 px (`--text-*`). Headings `text-wrap: balance`.

## Shape, depth, motion

- Radius hierarchy: crest (shield clip-path) > card `1rem` > control `0.625rem` > chip (full).
- Depth is light from above (`--shadow-raise`: inner top highlight + dark falloff), never grey drop shadows.
- One orchestrated motion moment: hero crests rise in sequence. Everything else animates only in response
  to the user (menus, dialogs). `prefers-reduced-motion` disables animation globally.

## Signature element: the crest

`<Crest>` frames a clan logo in a gold-rimmed shield. Without a logo it sets the tag in kit lettering on a
gradient derived from the tag, so every clan still has a distinct mark. It appears on discovery cards, clan
pages, dashboards, the admin queue and the application preview.

## Components

| Component                                                            | Notes                                                                      |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `Button` / `buttonClass`                                             | primary (gold), secondary, ghost, danger, success; sm/md/lg; loading state |
| `Field`, `TextArea`, `Select`                                        | Label, hint, error (ARIA-linked), optional counter (`aside`)               |
| `Card`, `SectionHeader`, `PageContainer`                             | Layout primitives; container reserves space for the mobile tab bar         |
| `Alert`, `EmptyState`, `Skeleton`, `Chip`                            | Feedback. Empty states always offer the next action                        |
| `ConfirmDialog`                                                      | Native `<dialog>`: focus trap, Escape, inert background                    |
| `ImageUpload`                                                        | Uploads on select; previews the server-processed image                     |
| `CountrySelect`                                                      | Native select, Arab countries first, list built server-side                |
| `Crest`, `ClanTag`, `Avatar`, `RoleBadge`, `GameIdStatus`, `Country` | Identity vocabulary                                                        |
| `SiteHeader` + `BottomNav`                                           | Desktop top bar; mobile thumb-reach tab bar                                |

## Writing

Sentence case, plain verbs, no all-caps labels, no arrow suffixes. Errors say what happened and how to fix
it. Unverified game IDs are labelled as such everywhere they are shown individually; rosters mark only
verified IDs (unverified is the default).
