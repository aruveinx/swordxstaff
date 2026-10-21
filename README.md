# swordxstaff

Database and utilities for Sword X Staff players.

Skill JSON data and assets courtesy of [Loot & Waifus](https://lootandwaifus.com/).
This credit also appears in the footer on every page.

The skill database in `src/assets/data/skills.json` contains player-class skills
only. Monster skills (including summon-specific abilities) are excluded; player
summoning skills are retained.

Class navigation has one row per path, including its Warrior or Mage base class.
Selecting a class shows only its own and earlier classes' skills, grouped from
highest to lowest tier (for example, Conqueror, Berserker, Duelist, Warrior).
On narrow screens, each navigation row scrolls horizontally.

Skill dialogs show a rank-colored level slider with stars within the selected
rank: Rare (levels 1–2, 2 stars), Epic (3–5, 3 stars), Legendary (6–9, 4 stars),
Mythic (10–15, 6 stars), Divine (16–23, 8 stars), and Immortal (24 onward, all
remaining levels available for that skill). Select a rank to jump to its first
star, or use the slider (including arrow keys) to preview each level's stats.

Skill and keyword descriptions highlight element names in bold: Light (yellow),
Dark (dark purple), Wind (turquoise), Water (blue), Fire (orange-red), and
Physical (grayish brown). Matching is case-insensitive and uses whole words.
Skill descriptions also show dotted underlines on matching keyword names;
hovering a name displays its keyword definition.

## Skill range and area previews

`src/assets/data/skill-areas.json` stores editable spatial data separately from
the original skill descriptions, keyed by the same stringified skill IDs.
Dialogs render it as a grid with the caster always in the middle, facing up:
white is the caster, blue is cast/eligible range, and red is the effect area.
Previews are static, with the example target at the furthest eligible cell
directly in front of the caster. Panels without a cast range retain their
illustrative reference position.
Self-centered and forward attacks have no separate blue range.
Red takes precedence over blue; the caster stays white even inside an effect.
The grids occupy the left column, capped at one-third of the combat-stats row.
Cooldown appears first in the right column when specified, followed by each
available scaling stat for the selected skill level. Missing cooldown and
scaling rows are omitted. Stats use their own labels instead of a generic Power
label: Healing Power is shown as Heal power, and ATK is shown as DMG unless
the skill description explicitly mentions ATK. Other stat labels are preserved.
The level slider updates those values without changing the preview.
There are no visible grid labels, legends, notes, or targeting controls;
each grid retains an accessible description.

The file has these tables:

- `conventions` and `colors`: coordinate, geometry, overlap, and color conventions.
- `shapes`: reusable diamonds, squares, circles, crosses, forward rectangles, and explicit
  cell offsets.
- `patterns`: arrays of preview panels. A panel has a `label`, optional `range`
  shape, and `effects` with a shape and either a `caster` or `target` anchor.
  Optional `offset` translates an effect relative to its anchor. `allowSelfTarget`
  permits selecting the center cell for ground-targeted areas. `previewTarget`
  gives an illustrative reference position when no cast range is specified.
- `skills`: a `pattern` reference and optional `notes`, or a non-spatial `status`
  (`self`, `unspecified`, or `inherited`) with explanatory notes.
- `defaults`: non-spatial Charm behavior for passive skills without their own
  spatial entry. All Techniques and spatial Charms have explicit entries.

Coordinates are `[x, y]` offsets from the caster's `[0, 0]`: positive x is right,
negative y is forward. For example, `front-3x4` covers x = -1 through 1 and
y = -4 through -1. Unqualified distances use diamond/Manhattan distance:
`abs(x) + abs(y) <= radius`. A 1-grid diamond includes the center and its four
orthogonal neighbors; diagonal neighbors are 2 grids away.
Only descriptions explicitly stating a square use square/Chebyshev distance,
so a 1-grid square radius contains 3x3 cells. A skill can have a diamond cast
range and a square effect area; they are stored independently. Explicit
rectangles and crosses retain their stated shapes. Explicit circles use
Euclidean distance between cell centers; this interpretation is marked as
inferred and still needs in-game confirmation.

Multi-stage skills have separate panels. Chains show the initial hit with notes
about subsequent bounces, rather than inventing a fixed final area. Movement
skills distinguish the starting caster from the landing/effect anchor. Random
effects show their potential region; automated targeting can only be illustrated.
Summon descriptions without precise placement cells/footprints are marked
unspecified, not assigned a fabricated formation. Other ambiguities are called
out in per-skill notes. Red can also represent a healing, buff, placement, or
condition-check region. Labels and uncertainty notes are retained in the JSON;
the compact dialog shows only the grids.

These are description-derived previews, not an in-game targeting simulator.
Terrain, line of sight, occupancy, and large-unit hitboxes are not modeled.
The data loader rejects malformed geometry and broken pattern/shape references.
Run `npm test` after editing spatial data to check coverage and geometry.

## Loadout Builder

The single **Sword X Staff Loadout Builder** page (`#/`) combines class filters,
loadout controls immediately below them, and the skill list. The old `#/builder`
URL opens the same page. Players can create, edit, and delete named skill
loadouts. Each loadout has a class plus 4 Technique slots and 4
Charm slots; slots may be left empty and a skill can only be equipped once.
A class can equip its own skills and those of earlier classes in its path
(the same rule as the skill list). While editing, the class filters also change
the loadout's class; incompatible equipped skills are removed. New loadouts use
the currently selected class, and editing a saved loadout restores its class.

Click an editable slot to enter skill selection mode, then click a skill in the
existing list to equip it. Other skill types and skills already in another slot
are disabled. The active slot and its currently equipped skill are highlighted.
Picking a skill, **Cancel selection**, or Escape exits selection mode. Outside
selection mode, skill clicks open the description dialog as usual.

While creating or editing a loadout, drag an equipped skill onto another slot
in the same row to move it there, shifting the intervening slots. Techniques
and Charms cannot be moved between rows.
Dragging supports mouse, touch, and pen input. On touch screens, drag directly
from an equipped skill; a short tap still selects its slot. Scroll the page
from outside the equipped skill tiles.
Reordering exits skill selection mode and is only saved with **Save loadout**.

Loadouts are stored in the browser's `localStorage` under
`swordxstaff.loadouts.v1` and stay in sync across open tabs. Stored data is
validated when loaded; unknown or incompatible skills are dropped.

**Copy link** creates a share URL such as
`#/share?v=1&n=Tank+build&p=knight&c=Paladin&t=10032...&h=10524...`, where `p`
is the path, `c` the class, and `t`/`h` the Technique/Charm skill IDs per slot
(separated by `.`; empty segments are empty slots). Opening it shows a preview
with **Save to my loadouts**. Shared links are validated the same way, and the
recipient is told if any skills were dropped. The logic lives in
`src/data/loadouts.ts` and is covered by `npm test`.

## Development

Requires Node.js 22.12+ (Node 22 is pinned in `.nvmrc`) and npm.
Run these commands from the project directory in WSL:

```sh
nvm use
npm ci
npm run dev
```

If you do not use nvm, install a supported Node.js version and skip `nvm use`.
Open the URL printed by Vite, including the `/swordxstaff/` path.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

The app uses React, TypeScript, Vite, and Tailwind CSS's Vite plugin.
Tailwind is imported in `src/index.css`; no separate Tailwind or PostCSS
configuration is needed. `src/App.tsx` contains the hash router;
pages live in `src/components/`.
Dependencies are pinned to stable releases and locked in `package-lock.json`.

## GitHub Pages

1. Push these files, including `package-lock.json`, to the `main` branch.
2. In the GitHub repository, open **Settings > Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Check the **Actions** tab for the **Deploy to GitHub Pages** workflow.
	If needed, run it manually after enabling Pages.

The workflow runs tests and builds pull requests without deploying them.
Pushes to `main` and manual runs on `main` test, build, and deploy `dist`
using GitHub's official Pages actions. Manual runs on other branches validate
the app without deploying it. No deployment token or `gh-pages` branch is required.

Published URL: https://aruveinx.github.io/swordxstaff/

This repository is a project site, so it is served under `/swordxstaff/`, not
at the domain root. To publish at https://aruveinx.github.io/ instead, use a
repository named `aruveinx.github.io` and change Vite's `base` to `/`.

`vite.config.ts` sets `base` to `/swordxstaff/` so generated asset URLs work
on GitHub Pages. Update it if the repository name changes; use `/` for a
custom domain or a repository named `aruveinx.github.io`.
For public assets in components, prefix their paths with `import.meta.env.BASE_URL`.
The app uses hash routing (`#/`, `#/builder`, `#/share?...`), so direct links
work on GitHub Pages without a fallback page.
