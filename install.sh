#!/usr/bin/env bash
# Install Adem's skills on this machine.
#   curl -fsSL https://raw.githubusercontent.com/AdemBenAbdallah/skills/main/install.sh | bash
# Clones (or updates) the repo, then symlinks every skill into each agent's skills folder.
# Because they are symlinks, `git pull` in the repo updates every agent at once.
set -euo pipefail

REPO="https://github.com/AdemBenAbdallah/skills.git"
DIR="${SKILLS_DIR:-$HOME/Work/skills}"
TARGETS=("$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.codex/skills")

if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only --quiet
else
  mkdir -p "$(dirname "$DIR")"
  git clone --quiet "$REPO" "$DIR"
fi

for target in "${TARGETS[@]}"; do
  # Only install for agents that exist here (~/.claude always gets them).
  [ -d "$(dirname "$target")" ] || [ "$target" = "$HOME/.claude/skills" ] || continue
  mkdir -p "$target"
  for skill in "$DIR"/skills/*/; do
    name="$(basename "$skill")"
    dest="$target/$name"
    if [ -e "$dest" ] && [ ! -L "$dest" ]; then
      mv "$dest" "$dest.bak.$(date +%s)"
      echo "  backed up existing $dest"
    fi
    ln -sfn "${skill%/}" "$dest"
  done
  echo "linked $(ls -d "$DIR"/skills/*/ | wc -l) skill(s) -> $target"
done
echo "done. update later with: git -C $DIR pull"
