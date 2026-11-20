#!/usr/bin/env bash
# Install astack (Adem's skills) on this machine.
#   curl -fsSL https://raw.githubusercontent.com/AdemBenAbdallah/astack/main/install.sh | bash
# Clones (or updates) the repo, then symlinks every skill into each agent's skills folder.
# Because they are symlinks, `astack update` (or `git pull`) updates every agent at once.
# It also installs the `astack` command into ~/.local/bin.
set -euo pipefail

REPO="https://github.com/AdemBenAbdallah/astack.git"
DIR="${SKILLS_DIR:-$HOME/Work/astack}"
TARGETS=("$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.codex/skills")
BIN_DIR="$HOME/.local/bin"

# Private skill repos. Linked only on machines that can read them; skipped silently otherwise.
# Each is cloned next to astack (e.g. ~/Work/<name>). Skills are found in skills/*/ or .claude/skills/*/.
PRIVATE_REPOS=("AdemBenAbdallah/bassim-review-skill")
PRIVATE_PARENT="$(dirname "$DIR")"

# Update a repo if present, otherwise clone it. Never prompts for a password.
sync_repo() { # <slug> <dir> <quiet-on-failure>
  local slug="$1" dir="$2" quiet="$3"
  if [ -d "$dir/.git" ]; then
    GIT_TERMINAL_PROMPT=0 git -C "$dir" pull --ff-only --quiet \
      || echo "could not update $dir (local changes or no access?), using what is there"
    return 0
  fi
  mkdir -p "$(dirname "$dir")"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    gh repo clone "$slug" "$dir" -- --quiet >/dev/null 2>&1 && return 0
  fi
  GIT_TERMINAL_PROMPT=0 git clone --quiet "https://github.com/$slug.git" "$dir" 2>/dev/null && return 0
  [ "$quiet" = 1 ] || { echo "could not clone $slug"; exit 1; }
  return 1
}

sync_repo "AdemBenAbdallah/astack" "$DIR" 0

SOURCES=("$DIR")
for slug in "${PRIVATE_REPOS[@]}"; do
  pdir="$PRIVATE_PARENT/${slug#*/}"
  if sync_repo "$slug" "$pdir" 1; then
    SOURCES+=("$pdir")
  else
    echo "skipped private $slug (no GitHub access on this machine)"
  fi
done

# Every skill folder across all sources.
SKILLS=()
for src in "${SOURCES[@]}"; do
  for skill in "$src"/skills/*/ "$src"/.claude/skills/*/; do
    [ -f "$skill/SKILL.md" ] && SKILLS+=("${skill%/}")
  done
done

# Skills that ship scripts with npm dependencies get them installed once.
for skill in "${SKILLS[@]}"; do
  pkg="$skill/scripts/package.json"
  [ -f "$pkg" ] || continue
  dir="$(dirname "$pkg")"
  [ -d "$dir/node_modules" ] || (echo "npm install in $dir" && npm install --silent --prefix "$dir")
done

for target in "${TARGETS[@]}"; do
  # Only install for agents that exist here (~/.claude always gets them).
  [ -d "$(dirname "$target")" ] || [ "$target" = "$HOME/.claude/skills" ] || continue
  mkdir -p "$target"
  # Remove links to skills that were renamed or deleted in any source repo.
  for link in "$target"/*; do
    [ -L "$link" ] && [ ! -e "$link" ] || continue
    for src in "${SOURCES[@]}"; do
      [[ "$(readlink "$link")" == "$src/"* ]] && rm "$link" && echo "  removed old $link" && break
    done
  done
  for skill in "${SKILLS[@]}"; do
    dest="$target/$(basename "$skill")"
    if [ -e "$dest" ] && [ ! -L "$dest" ]; then
      backup="$HOME/.skills-backup/$(date +%s)/$(basename "$target")"
      mkdir -p "$backup" && mv "$dest" "$backup/"
      echo "  moved existing $dest to $backup"
    fi
    ln -sfn "$skill" "$dest"
  done
  echo "linked ${#SKILLS[@]} skill(s) -> $target"
done

# The `astack` command.
mkdir -p "$BIN_DIR"
ln -sfn "$DIR/bin/astack" "$BIN_DIR/astack"
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "note: add $BIN_DIR to your PATH to use the astack command" ;;
esac
echo "done. update later with: astack update"
