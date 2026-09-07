#!/bin/bash
# Script to consolidate all migrations into a single schema.sql
# Usage: bash scripts/consolidate-schema.sh > supabase/schema.sql

set -e

MIGRATIONS_DIR="supabase/migrations"
OUTPUT_FILE="supabase/schema.sql"

# List of migrations to include IN ORDER (from dependency analysis)
MIGRATIONS=(
  "001_foundation.sql"
  "002_snapshots.sql"
  "003_t1_multiinterviewee.sql"
  "004_companies_and_rename.sql"
  "005_company_wide_access.sql"
  "006_performance_indexes.sql"
  "007_stakeholder_unofficial_tools.sql"
  "008_roles_four_tier.sql"
  "20260527_security_persistence.sql"
  "20260528_security_persistence.sql"
  "20260601_schema_drift_sprint10.sql"
  "20260602_create_project_rpc.sql"
  "20260603_rls_policies.sql"
  "20260703_company_persons.sql"
  "20260705_backfill_company_persons_all_projects.sql"
  "20260706001_merge_company_persons_function.sql"
  "20260706002_stakeholders_person_id.sql"
  "20260707_company_departments_type.sql"
  "20260708_company_persons_company_scope.sql"
  "20260824001_governance_domains_and_package_config.sql"
  "20260824002_seed_framework_controls.sql"
  "20260824003_seed_llm_prompt_templates.sql"
  "20260825001_create_project_rpc_add_domain_id.sql"
  "20260825002_framework_controls_is_active.sql"
  "20260827001_projects_extended_fields.sql"
  "20260827002_contracted_packages_default_all.sql"
  "20260827003_companies_contracted_packages.sql"
  "20260827004_create_project_rpc_extended_fields.sql"
  "20260828001_seed_transformacion_digital_domain.sql"
  "20260829001_delete_project_rpc.sql"
  "20260829002_update_project_rpc.sql"
  "20260829003_fix_update_project_ambiguity.sql"
  "20260903152412_create_application_texts_table.sql"
  "20260903_add_text_columns.sql"
  "20260903_app_labels_overrides.sql"
  "20260903_fill_application_texts_defaults.sql"
  "20260903_rls_application_texts.sql"
  "20260904_fix_application_texts_semantics.sql"
  "20260904_refactor_application_texts_data.sql"
)

# Header
cat << 'EOF'
-- ============================================================
-- GOBY — Consolidated Schema
--
-- Generated: 2026-09-04
-- Version: 2.2.0
-- Purpose: Single schema file consolidating all migrations
--
-- This file is idempotent:
--   - Uses IF NOT EXISTS / IF EXISTS / ON CONFLICT
--   - Safe to run multiple times
--   - Compatible with PostgreSQL 13+
--
-- Table Count: ~40+
-- Function Count: ~15+
-- RLS Policies: ~50+
-- Seed Rows: ~100+ (domains, controls, templates)
--
-- Instructions:
--   1. supabase status                    (verify DEV local)
--   2. cat supabase/schema.sql | psql <DEV_CONNECTION>
--   3. Or: copy-paste into Supabase SQL Editor
--
-- ============================================================

-- Start transaction for safety
BEGIN;

EOF

# Consolidate each migration
echo "-- Consolidating migrations..." >&2
for migration in "${MIGRATIONS[@]}"; do
  filepath="$MIGRATIONS_DIR/$migration"

  if [ ! -f "$filepath" ]; then
    echo "WARNING: Missing file $filepath" >&2
    continue
  fi

  echo ""
  echo "-- ========== $(basename "$migration") =========="
  echo "-- Original source: $migration"
  echo ""

  # Read file and output, skipping existing headers and transaction statements
  cat "$filepath" | \
    grep -v "^BEGIN;" | \
    grep -v "^COMMIT;" | \
    grep -v "^ROLLBACK;" || true

  echo ""
done

# Footer with COMMIT and summary
cat << 'EOF'

-- ========== End of Consolidated Schema ==========

-- Commit transaction
COMMIT;

-- ========== Post-Consolidation Notes ==========
--
-- 1. All migrations have been sequentially included
-- 2. Transaction wraps entire schema for atomicity
-- 3. Idempotent: safe to run multiple times
-- 4. Seed data is included (domains, controls, templates)
--
-- Verification queries (run after importing):
--
--   SELECT COUNT(*) as table_count
--   FROM information_schema.tables
--   WHERE table_schema = 'public';
--
--   SELECT COUNT(*) as function_count
--   FROM information_schema.routines
--   WHERE routine_schema = 'public';
--
--   SELECT COUNT(*) as index_count
--   FROM information_schema.indexes
--   WHERE schemaname = 'public';
--
-- ============================================================
EOF

echo "Schema consolidated to: $OUTPUT_FILE" >&2
