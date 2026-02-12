# Changelog – zerwiz/setup (Tools)

All notable changes to the tools (AI Dev Suite, RAG, Workshop Setup) are documented here.  
Update this file **before** every commit that changes behavior, content, or deployment.

Format: list entries under a date/version heading; use present tense (“Add …”, “Fix …”).

---

## [Unreleased]

- Update structure and docs for current repo layout: zerwiz/setup is the tools repo (no tools/ subfolder); for-zerwiz-setup syncs to homepage; fix doc/STRUCTURE.md, README, for-zerwiz-setup/, doc/SYNC_TO_HOMEPAGE.md, doc/README.md, TOOLS_README.md; sync script default path to WhyNotProductionsHomepage.
- setup.sh and run-tui.sh: fetch from zerwiz/setup instead of WhyNotProductionsHomepage; look for ai-dev-suite/elixir_tui at repo root.
- install-full.sh, install-ai-dev-suite.sh: default REPO to zerwiz/setup; support ai-dev-suite at root (setup-main).
- Scripts and docs: update paths from tools/ to repo root (rag/, ai-dev-suite/); install.sh curl URLs to zerwiz/setup; Elixir RAG path candidates and error messages; doc paths; electron_app repo and publish config.
- AI Dev Suite: structure-agnostic RAG discovery – env AI_DEV_SUITE_RAG_SCRIPT or walk-up from cwd; no hardcoded folder layout; doc STORAGE.md and FUNCTIONS.md.
- Add .cursor/rules/ai-dev-suite-paths.mdc – rule for structure-agnostic path discovery in AI Dev Suite.
- README: Add alpha/collaboration call-out above About me.
- README About: Add Workflowspace, AffiliateFlow, NorthStarOS to Areas table.
- Update README About section with expanded bio: Zerwiz identity, education, AI Dev Suite, WhyNot Productions, UpsideDown Production, principles, network, contact.
- Add CHANGELOG. zerwiz/setup is the main repo for tools; develop here.
