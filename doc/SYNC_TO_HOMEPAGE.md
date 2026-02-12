# Sync to WhyNotProductionsHomepage

**Source:** `for-zerwiz-setup/` in zerwiz/setup (this repo)  
**Destination:** `docs/for-zerwiz-setup/` in WhyNotProductionsHomepage

Run from setup root:
```bash
./scripts/sync-to-homepage.sh
```

Requires the homepage repo cloned alongside setup (default path: `../WhyNotProductionsHomepage`). Set `HOMEPAGE_REPO` if your path differs.

After syncing, commit and push in the homepage repo to update the copy there. Curl URLs on the main setup README and in rules point to zerwiz/setup only—the homepage copy is for embedded use or legacy references.
