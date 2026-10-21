# Sword X Staff

Browse skills, plan your build, and share loadouts with other Sword X Staff players.
Works on desktop and touch screens.

Use the theme toggle in the top-right header to switch between light and dark
mode. It starts with your system preference and remembers your choice in this browser.

**[Open the tool](https://aruveinx.github.io/swordxstaff/)**

## Install and use offline

Use your browser's **Install app** option, or **Add to Home Screen** in Safari
on iOS, to launch Sword X Staff as a standalone app.
After the first online visit finishes caching, the site and shared-loadout
previews work offline. Saved loadouts remain stored in this browser.

When an update is available, the app asks before reloading. Save any loadout
edits first; cancel the prompt to keep working and reopen the app later to update.

The production build generates the web manifest, service worker, and install
icons from `src/assets/img/favicon.png`. PWA support requires HTTPS (or localhost)
and is disabled in the development server. To check it locally, run
`npm run build`, then `npm run preview` and open `/swordxstaff/`.

## Explore skills

- Choose your class at the top to see its skills, including those inherited from earlier classes.
- Click or tap a skill to read its description, stats, and cooldown.
- Use the level slider or select a rank to preview how its stats change.
- Where available, area previews show your character in white, cast range in blue,
  and the affected area in red. These are illustrations based on skill descriptions,
  not a simulation of in-game targeting.

On smaller screens, swipe the class rows sideways to see more classes.

On wider screens, subtle male and female class artwork flanks the main content.
It follows the selected class path (or Warrior/Mage for base classes), including
on shared loadouts, and is naturally clipped as the viewport narrows.

## Build a loadout

1. Choose your class and select **+ New loadout**.
2. Give your loadout a name.
3. Click or tap a slot, then choose a skill from the list below.
4. Drag equipped skills within their row to change their order.
5. Select **Save loadout** when you're done.

Each loadout has **4 Technique slots** and **4 Charm slots**. You can leave slots
empty, but can't equip the same skill twice.

Use **Edit** to change a saved loadout, the **X** on a skill to remove it, or
**Cancel** to discard unsaved changes. Changing class while editing removes
skills that the new class can't use.

## Save and share

Select **Save loadout** to store a build in the browser on your current device.
Clearing your browser's site data will remove your saved loadouts.
Keep share links for builds you don't want to lose.

Saved loadout cards show their own class artwork in the top-right corner,
crossfading between male and female versions every 30 seconds. With reduced
motion enabled, the artwork stays static.

- Select **Copy link** on a saved loadout to share it or open it on another device.
- Open a shared link to preview the build, then select **Save to my loadouts**
  to keep your own copy.

## Credits

Skill data and assets courtesy of [Loot & Waifus](https://lootandwaifus.com/).
