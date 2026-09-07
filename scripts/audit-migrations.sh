#!/bin/bash
# Audit script: extract key info from each migration

cd "$(dirname "$0")/../supabase/migrations"

echo "# Migration Audit Report"
echo ""
echo "| Order | File | Tables/Objects Created | Type |"
echo "|-------|------|------------------------|------|"

for file in 001_foundation.sql 002_snapshots.sql 003_t1_multiinterviewee.sql 004_companies_and_rename.sql 005_company_wide_access.sql 006_performance_indexes.sql 007_stakeholder_unofficial_tools.sql 008_roles_four_tier.sql 20260527_security_persistence.sql 20260528_security_persistence.sql 20260601_schema_drift_sprint10.sql 20260602_create_project_rpc.sql 20260603_rls_policies.sql 20260703_company_persons.sql 20260705_backfill_company_persons_all_projects.sql 20260706001_merge_company_persons_function.sql 20260706002_stakeholders_person_id.sql 20260707_company_departments_type.sql 20260708_company_persons_company_scope.sql 20260824001_governance_domains_and_package_config.sql 20260824002_seed_framework_controls.sql 20260824003_seed_llm_prompt_templates.sql 20260825001_create_project_rpc_add_domain_id.sql 20260825002_framework_controls_is_active.sql 20260827001_projects_extended_fields.sql 20260827002_contracted_packages_default_all.sql 20260827003_companies_contracted_packages.sql 20260827004_create_project_rpc_extended_fields.sql 20260828001_seed_transformacion_digital_domain.sql 20260829001_delete_project_rpc.sql 20260829002_update_project_rpc.sql 20260829003_fix_update_project_ambiguity.sql 20260903_add_text_columns.sql 20260903_app_labels_overrides.sql 20260903_fill_application_texts_defaults.sql 20260903_rls_application_texts.sql 20260903152412_create_application_texts_table.sql 20260904_fix_application_texts_semantics.sql 20260904_refactor_application_texts_data.sql; do
  if [ -f "$file" ]; then
    # Extract CREATE statements
    creates=$(grep -E "^CREATE (TABLE|INDEX|FUNCTION|TYPE|VIEW|TRIGGER|ROLE|SCHEMA)" "$file" 2>/dev/null | wc -l)
    alters=$(grep -E "^ALTER (TABLE|INDEX|FUNCTION|TYPE|VIEW|TRIGGER|ROLE|SCHEMA)" "$file" 2>/dev/null | wc -l)
    seeds=$(grep -E "^INSERT INTO" "$file" 2>/dev/null | wc -l)

    if [ $creates -gt 0 ] || [ $alters -gt 0 ]; then
      type_str="SCHEMA"
    elif [ $seeds -gt 0 ]; then
      type_str="SEED"
    else
      type_str="OTHER"
    fi

    desc="C:$creates A:$alters S:$seeds"
    echo "| - | \`$file\` | $desc | $type_str |"
  fi
done
