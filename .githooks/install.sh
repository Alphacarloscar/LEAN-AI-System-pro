#!/usr/bin/env bash
# .githooks/install.sh
# Run once after cloning: bash .githooks/install.sh
set -e
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
echo "✅ Git hooks instalados desde .githooks/"
