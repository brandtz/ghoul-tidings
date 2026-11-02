# Code catalog

Real codes live in `catalog/codes.local.json`, which git ignores. Keep it out of the repo and out of shared docs.
It loads once into a fresh party, or paste the same JSON into Content, Codes in the host panel.

Each entry has these fields. Rewards are defined in `shared/phase2.ts`.

| Field | Meaning |
| --- | --- |
| code | Letters and digits, or U D L R for arrow keys. Up to 32 characters |
| scope | universal, team, secret or solo |
| reward | A key from REWARDS. Team codes ignore it for non-owners, who get a trick |
| listed | True to allow it in the Trick-or-Treat Bag |
| label | What the host sees |
