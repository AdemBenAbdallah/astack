# Adem's skills

The agent skills I use every day with Claude Code, Codex and other agents.
Public, so take whatever helps you.

## Install on a new machine

```bash
curl -fsSL https://raw.githubusercontent.com/AdemBenAbdallah/skills/main/install.sh | bash
```

This clones the repo to `~/Work/skills` (change it with `SKILLS_DIR=...`) and symlinks
each skill into `~/.claude/skills`, plus `~/.agents/skills` and `~/.codex/skills` when those
agents are installed. Run it again (or `git pull`) to update.

Just want one skill? With the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add AdemBenAbdallah/skills --skill ask3
```

## Skills

| Skill | What it does |
|---|---|
| [ask3](skills/ask3/SKILL.md) | `/ask3 <question>` sends one question to Fable 5.2, Opus 5.5 and Sonnet 5.5 in parallel, then gives a short verdict, a comparison table, and where they agree and differ. Needs [T3 Code](https://github.com/pingdotgg/t3code) (uses its `delegate_task` child agents). |

## Add a new skill

1. Create `skills/<name>/SKILL.md` (frontmatter with `name` and `description`).
2. Run `./install.sh` to link it.
3. Commit and push. On other machines: `git -C ~/Work/skills pull`.
