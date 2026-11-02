# URIGG-Brand — notes for Claude

The shared brand kit of the URIGG universe. Read `../URIGG-WebSite/CLAUDE.md` for the user and the design decisions; this repo is their single source.

- The user speaks Korean; reply in Korean, plainly. Claude does the development; the user does account steps (GitHub etc.), explained screen by screen.
- Consumers load files through jsDelivr: `https://cdn.jsdelivr.net/gh/yde5536/URIGG-Brand@main/...`. The repo must stay public and hold no secrets.
- `tokens/urigg.css` (`--u-*` variables) and `tokens/urigg.json` carry the same values. Change both together.
- `components/urigg-glass.css`: `u-` classes (tile, tabs pill, glass key, crimson button, ghost button, aurora, emblem). Motion of the aurora is left to each project.
- `index.html` is the brand page, built only from the kit's own tokens and components (a living check that they work).
- Values were taken from the hub site on 2026-11-02 (`site/css/base.css`, `theme-glass.css`, `scenes.css`). If the hub changes a design value, update the kit too, and vice versa.
- Rejected looks (never use): green hacker theme, ASCII banners, rim glow, red-heavy screens, decorative photos, progress gauges, refraction lens on the moving tab pill.
- Never put the user's real name or school anywhere.
- Planned consumers (not built yet): URIGG Tab (Chrome new-tab extension), a Discord bot (daily keyword / CTF / urgent news), the GitHub profile README.
