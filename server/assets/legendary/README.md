# Legendary reward: Doom shareware

`doom-shareware.jsdos` is a js-dos bundle, a zip that js-dos boots in the browser.

It holds the complete, unmodified Doom v1.9 shareware release from id Software
(`idgames/idstuff/doom/doom19s.zip`), whose own notes say "SHAREWARE VERSION, PLEASE
DISTRIBUTE!!!". Do not swap in the registered or Ultimate `DOOM.WAD`; those are not
redistributable.

Checks for the game data:

| File | MD5 | SHA-1 |
| --- | --- | --- |
| DOOM1.WAD (4,196,020 bytes) | f0cefca49926d00903cf57551d901abe | 5b2e249b9c5133ec987b3ea77596381dc0d6bc1d |

Two files are ours, added alongside the originals:

- `.jsdos/dosbox.conf` starts DOOM.EXE and sets a Sound Blaster 16 at 220, IRQ 7, DMA 1.
- `DEFAULT.CFG` points Doom's sound and music at that card, with default keys.

The bundle is served only through `/api/legendary/bundle`, to players who unlocked it
while the host's Legendary switch is on. It never sits in `public/`.
