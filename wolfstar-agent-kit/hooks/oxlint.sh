#!/bin/bash
source "$(dirname "$0")/check-config.sh" 2>/dev/null
is_hook_disabled "oxlint" && exit 0

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# skip non-lintable files
[[ ! "$file_path" =~ \.(js|jsx|ts|tsx|vue|mjs|cjs|md|json|yaml|yml|md)$ ]] && exit 0

# skip node_modules and dist
[[ "$file_path" =~ node_modules|/dist/|\.nuxt ]] && exit 0

OXLINT=""
if [ -f "node_modules/.bin/oxlint" ]; then
  OXLINT="./node_modules/.bin/oxlint"
elif command -v oxlint &>/dev/null; then
  OXLINT="oxlint"
fi

OXFMT=""
if [ -f "node_modules/.bin/oxfmt" ]; then
  OXFMT="./node_modules/.bin/oxfmt"
elif command -v oxfmt &>/dev/null; then
  OXFMT="oxfmt"
fi

[ -n "$OXLINT" ] && "$OXLINT" "$file_path" --fix --allow no-unused-vars --allow prefer-const || true
[ -n "$OXFMT" ] && "$OXFMT" "$file_path" || true
