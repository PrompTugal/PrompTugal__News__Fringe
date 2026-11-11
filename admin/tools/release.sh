#!/usr/bin/env bash
# Release from any agent's clone: AGENT=<name> admin/tools/release.sh
# From the storm site's admin/tools/release.sh. Commit your SOURCE changes first (subject "<agent>: <what>", trailers
# Agent:, Issue: WS-215, For:). This script rebases on dev, runs the gate locally (a red gate never leaves your machine),
# checks every commit in the push for size, binaries and forbidden paths (commit-check.mjs), pushes to dev (rebasing again if someone pushed first) and stops. CI numbers the release (v<series>.<run>), deploys it
# and reports push-to-served in its summary. You never write a number. Never main, never force.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
: "${AGENT:?set AGENT to your name}"
[ "$(git rev-parse --abbrev-ref HEAD)" = dev ] || { echo "release.sh: be on dev (no agent pushes to main)"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "release.sh: commit your source changes first:"; git status --short | head; exit 1; }
gated=0
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  git fetch -q origin dev
  git rebase -q origin/dev || { echo "release.sh: conflict with dev; resolve by hand"; git rebase --abort; exit 1; }
  [ "$(git rev-list --count origin/dev..HEAD)" = 0 ] && { echo "release.sh: nothing to push"; exit 0; }
  if [ "$gated" = 0 ]; then
    node admin/tools/commit-check.mjs origin/dev..HEAD   # finding 45: every commit in the push, not just HEAD's tree
    node admin/build/validate.mjs
    gated=1; continue   # fetch and rebase again straight after the gate, then push; CI's gate on the pushed tree is the authority
  fi
  if git push -q origin HEAD:dev; then echo "pushed $(git rev-parse --short HEAD) by $AGENT; CI numbers, deploys and times it"; exit 0; fi
  echo "release.sh: someone pushed first; again"; sleep $(( (RANDOM % 3) + 1 ))
done
echo "release.sh: gave up after 12 attempts"; exit 1
