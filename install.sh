#!/usr/bin/env bash
# Install astack (Adem's skills) on this machine.
#   curl -fsSL https://raw.githubusercontent.com/AdemBenAbdallah/astack/main/install.sh | bash
# Clones (or updates) the repo, then symlinks every skill into each agent's skills folder.
# Because they are symlinks, `git pull` in the repo updates every agent at once.
set -euo pipefail

REPO="https://github.com/AdemBenAbdallah/astack.git"
DIR="${SKILLS_DIR:-$HOME/Work/astack}"
TARGETS=("$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.codex/skills")

if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only --quiet || echo "could not update $DIR (local changes?), installing what is there"
else
  mkdir -p "$(dirname "$DIR")"
  git clone --quiet "$REPO" "$DIR"
fi

# Skills that ship scripts with npm dependencies (e.g. demo-video) get them installed once.
for pkg in "$DIR"/skills/*/scripts/package.json; do
  [ -f "$pkg" ] || continue
  dir="$(dirname "$pkg")"
  [ -d "$dir/node_modules" ] || (echo "npm install in $dir" && npm install --silent --prefix "$dir")
done

for target in "${TARGETS[@]}"; do
  # Only install for agents that exist here (~/.claude always gets them).
  [ -d "$(dirname "$target")" ] || [ "$target" = "$HOME/.claude/skills" ] || continue
  mkdir -p "$target"
  for skill in "$DIR"/skills/*/; do
    name="$(basename "$skill")"
    dest="$target/$name"
    if [ -e "$dest" ] && [ ! -L "$dest" ]; then
      backup="$HOME/.skills-backup/$(date +%s)/$(basename "$target")"
      mkdir -p "$backup" && mv "$dest" "$backup/"
      echo "  moved existing $dest to $backup"
    fi
    ln -sfn "${skill%/}" "$dest"
  done
  echo "linked $(ls -d "$DIR"/skills/*/ | wc -l) skill(s) -> $target"
done
echo "done. update later with: git -C $DIR pull"
