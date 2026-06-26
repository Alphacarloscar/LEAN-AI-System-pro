#!/bin/bash
# ADR-021 §2 — Design System Enforcement
# Prohibits deprecated Tailwind classes that must be replaced with warm-scale tokens.
#
# Banned patterns:
#   - bg-gray-*, text-gray-*, border-gray-*  → use bg-warm-*, text-warm-*, border-warm-*
#   - shadow-lg, shadow-xl, shadow-2xl       → use shadow-sm or shadow-md
#   - rounded-2xl, rounded-3xl              → use rounded-xl max
#
# To exempt a line with intentional justification, append: // ADR-021-EXEMPT

set -euo pipefail

PATTERNS='bg-gray-|text-gray-|border-gray-|shadow-lg|shadow-xl|shadow-2xl|rounded-2xl|rounded-3xl'
SRC_DIR="${1:-src}"

VIOLATIONS=$(grep -rn --include='*.tsx' -E "$PATTERNS" "$SRC_DIR" \
  | grep -v '// ADR-021-EXEMPT' \
  || true)

COUNT=$(echo "$VIOLATIONS" | grep -c . || true)

if [ "$COUNT" -gt 0 ]; then
  echo "❌ ADR-021: $COUNT violación(es) de Design System detectadas"
  echo ""
  echo "$VIOLATIONS"
  echo ""
  echo "Reemplaza las clases prohibidas por sus equivalentes warm-scale:"
  echo "  bg-gray-*    → bg-warm-*     (ej: bg-gray-100 → bg-warm-100)"
  echo "  text-gray-*  → text-warm-*   (ej: text-gray-500 → text-warm-500)"
  echo "  border-gray-*→ border-warm-* (ej: border-gray-200 → border-warm-200)"
  echo "  shadow-lg/xl/2xl → shadow-sm o shadow-md"
  echo "  rounded-2xl/3xl  → rounded-xl"
  echo ""
  echo "Si la excepción está justificada, añade al final de la línea: // ADR-021-EXEMPT"
  echo "Ver: docs/decisions/technical/ADR-021-design-system-charter.md"
  exit 1
fi

echo "✅ ADR-021: Design System OK — 0 violaciones detectadas"
exit 0
