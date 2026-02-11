# setup

Workshop setup and AI dev tools for WhyNot Productions. Run via `curl | bash`.

## Tools

### Workshop Setup

Installs Node.js and Git for workshops.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
```

### AI Dev Suite

Displays or installs AI dev tools (Zed, LM Studio, Ollama, Pinokio, ClawCode).

**Display only:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
```

**Install a tool directly:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash -s ollama
```
Options: `ollama`, `zed`, `lm`, `pinokio`, `claw` (or `1`–`5`).

## Structure

```
setup/
├── README.md           # This file
├── setup.sh            # Workshop Setup
└── ai-dev-suite/
    ├── README.md
    └── install.sh      # AI Dev Suite script
```

## Source

These files are maintained in [WhyNotProductionsHomepage](https://github.com/zerwiz/WhyNotProductionsHomepage) under `tools/` and `docs/for-zerwiz-setup/`. Push updates from there to this repo.
