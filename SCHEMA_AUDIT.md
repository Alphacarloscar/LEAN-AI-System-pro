# Schema Audit & Consolidation Report — GOBY v2.2.0

**Generated:** 2026-09-04  
**Target:** Consolidate 60+ migrations into single `supabase/schema.sql`  
**Status:** IN PROGRESS

---

## 📋 Executive Summary

- **Total Migrations:** 60+ files (active + archived)
- **Active Migrations:** 37 files
- **Archived (duplicate/superseded):** 23 files
- **Schema Layers:**
  1. Foundation (profiles, engagements, core tables)
  2. Snapshots (longitudinal data)
  3. Multi-tenant & Access (companies, project_members, RLS)
  4. Tools (T1–T13 specific tables)
  5. Governance (ADR-029: domains, framework_controls)
  6. Functions & RPCs (project create/update/delete)
  7. Application config (application_texts)

---

## 🗂️ Migration Dependency Map

### Tier 0: Foundation (No dependencies)
```
001_foundation.sql
  ├─ Extensions: uuid-ossp
  ├─ Enums: (none in this file)
  └─ Tables:
     ├─ auth.users (external, managed by Supabase Auth)
     ├─ profiles (extends auth.users)
     ├─ engagements
     ├─ engagement_members (FK: engagements, profiles)
     ├─ company_profiles (FK: engagements)
     ├─ frictions (FK: engagements)
     ├─ t1_dimension_scores (FK: engagements)
     ├─ stakeholders (FK: engagements)
     ├─ value_streams (FK: engagements)
     ├─ use_cases (FK: engagements)
     ├─ t5_canvas (FK: engagements)
     └─ iso42001_controls (FK: engagements)
```

### Tier 1: Snapshots & Multi-tenant (Depend on Tier 0)
```
002_snapshots.sql
  ├─ t1_score_snapshots (FK: engagements)
  ├─ stakeholder_snapshots (FK: engagements)
  └─ value_stream_snapshots (FK: engagements)

003_t1_multiinterviewee.sql
  └─ ALTER t1_dimension_scores: add interviewee_id, interviewee_type

004_companies_and_rename.sql
  ├─ CREATE TABLE companies
  ├─ ALTER engagements → projects (rename)
  ├─ ALTER engagement_members → project_members (rename)
  └─ Backfill: rename references

005_company_wide_access.sql
  ├─ ALTER project_members: add company_id, auto-add on project creation
  └─ Trigger: auto-add users of same company to new projects

006_performance_indexes.sql
  └─ CREATE INDEX: project_id, company_id, created_at (various tables)

007_stakeholder_unofficial_tools.sql
  ├─ ALTER stakeholders: add unofficial_tools (jsonb)
  └─ (Shadow AI feature)

008_roles_four_tier.sql
  └─ ALTER profiles.role: 'admin'/'consultant'/'viewer' → 'superadmin'/'consultant'/'client_editor'/'client_viewer'
```

### Tier 2: Security & Persistence (Depend on Tier 1)
```
20260527_security_persistence.sql
  └─ Security-related schema changes (session persistence)

20260528_security_persistence.sql
  └─ Continue security fixes

20260601_schema_drift_sprint10.sql
  └─ Schema drift corrections

20260602_create_project_rpc.sql
  ├─ CREATE FUNCTION create_project_rpc(...)
  └─ RPC for creating projects with validation

20260603_rls_policies.sql
  ├─ RLS policies for: profiles, projects, project_members, 
  │  company_profiles, frictions, snapshots, all tool tables
  └─ Row-level security enforcement
```

### Tier 3: Persons & Relationships (Depend on Tier 2)
```
20260703_company_persons.sql
  ├─ CREATE TABLE company_persons (person_id FK to self, project_id FK)
  ├─ ALTER t1_dimension_scores, t9_free_items: add person_id
  └─ RLS: user_can_read_project, user_can_edit_project

20260705_backfill_company_persons_all_projects.sql
  └─ Data: backfill company_persons from T1/T2/T3/T9 (idempotent)

20260706001_merge_company_persons_function.sql
  └─ CREATE FUNCTION merge_company_persons(principal_id, replaced_id)

20260706002_stakeholders_person_id.sql
  ├─ ALTER stakeholders: add person_id (FK)
  └─ Data: backfill from name/cargo match

20260707_company_departments_type.sql
  ├─ ALTER company_departments: add type ('it' | 'negocio_ops')
  └─ Data: backfill with type classification

20260708_company_persons_company_scope.sql
  └─ Expand company_persons RLS from project_id to company_id (company-wide scope)
```

### Tier 4: Governance & Multi-Domain (ADR-029, Depend on Tier 3)
```
20260824001_governance_domains_and_package_config.sql
  ├─ CREATE TABLE governance_domains (id, slug, label)
  ├─ CREATE TABLE evaluation_dimensions (domain_id FK, D1-D6 per domain)
  ├─ CREATE TABLE framework_controls (domain_id FK)
  ├─ CREATE TABLE package_config (package_name, modules list)
  └─ Seed: ai_adoption domain with D1-D6

20260824002_seed_framework_controls.sql
  └─ Data: INSERT framework_controls for ai_adoption domain

20260824003_seed_llm_prompt_templates.sql
  └─ Data: INSERT llm_prompt_templates (domain-specific prompts)

20260825001_create_project_rpc_add_domain_id.sql
  ├─ ALTER projects: add domain_id (mandatory, immutable FK to governance_domains)
  └─ UPDATE create_project_rpc(...)

20260825002_framework_controls_is_active.sql
  └─ ALTER framework_controls: add is_active boolean

20260827001_projects_extended_fields.sql
  ├─ ALTER projects: add objetivo, restricciones, horizonte_temporal, 
  │  ecosistema_tecnologico (all nullable text)
  └─ Documentation updates

20260827002_contracted_packages_default_all.sql
  ├─ ALTER projects: add contracted_packages (text[] or jsonb, default all 3)
  └─ Data: backfill existing projects with all packages

20260827003_companies_contracted_packages.sql
  ├─ ALTER companies: add contracted_packages (cascade source)
  └─ Data: backfill

20260827004_create_project_rpc_extended_fields.sql
  └─ UPDATE create_project_rpc(...) to accept extended fields

20260828001_seed_transformacion_digital_domain.sql
  └─ Data: INSERT governance_domains (transformacion_digital, D1-D6)

20260829001_delete_project_rpc.sql
  └─ CREATE FUNCTION delete_project_rpc(project_id)

20260829002_update_project_rpc.sql
  └─ CREATE FUNCTION update_project_rpc(project_id, updates)

20260829003_fix_update_project_ambiguity.sql
  └─ Fix column ambiguity in update_project_rpc
```

### Tier 5: Application Configuration (Depend on Tier 4)
```
20260903152412_create_application_texts_table.sql
  └─ CREATE TABLE application_texts (id, tool_module, text_key, filename, text_override, ...)

20260903_add_text_columns.sql
  ├─ ALTER application_texts: add filename, text_override
  └─ Data: migrate from text_es

20260903_app_labels_overrides.sql
  └─ App labels and override configuration

20260903_fill_application_texts_defaults.sql
  └─ Data: fill empty filename/text_override with defaults

20260903_rls_application_texts.sql
  └─ RLS: read by authenticated, update by superadmin/admin

20260904_fix_application_texts_semantics.sql
  ├─ ALTER: text_generalizado → text_override (semantic fix)
  └─ Data: migrate existing overrides

20260904_refactor_application_texts_data.sql
  └─ Data: clean up incorrect filename values
```

---

## 📊 Table Dependency Graph

```
auth.users (external, managed by Supabase Auth)
   └─ profiles (PK: id, FK: auth.users.id)
      ├─ project_members (FK: profiles.id)
      ├─ company_persons (FK: profiles.id, nullable)
      └─ audit_logs, audit_access_logs (FK: profiles.id)

companies
   ├─ profiles (company_id nullable)
   ├─ projects (FK: companies.id)
   │  ├─ project_members (FK: projects.id)
   │  ├─ company_profiles (FK: projects.id)
   │  ├─ company_persons (FK: projects.id for write, company_id for read)
   │  ├─ company_departments (FK: companies.id)
   │  ├─ frictions (FK: projects.id)
   │  ├─ snapshots (FK: projects.id)
   │  ├─ t1_dimension_scores (FK: projects.id)
   │  ├─ stakeholders (FK: projects.id)
   │  ├─ value_streams (FK: projects.id)
   │  ├─ use_cases (FK: projects.id)
   │  ├─ t5_canvas (FK: projects.id)
   │  ├─ iso42001_controls (FK: projects.id)
   │  └─ tool_outputs (FK: projects.id)
   │
   └─ governance_domains (FK: domains.id)
      ├─ evaluation_dimensions
      ├─ framework_controls
      └─ llm_prompt_templates
```

---

## 🔍 Critical Schema Decisions

### 1. **Renaming from "engagements" to "projects"**
- Migration 004 renames the table but keeps the column `project_id` everywhere
- Old FK references updated via trigger or manual migration
- **Decision:** Use `projects` name in consolidated schema

### 2. **Multi-Tenancy Scope**
- Tier 1: `engagement_members` (project-level access)
- Tier 2: `company_members` (company-level auto-add)
- Tier 3: `company_persons` switches from `project_id` (write scope) to `company_id` (read scope)
- **Decision:** Both `project_id` (for writes) and `company_id` (for reads) must be present

### 3. **RLS Architecture**
- Helper functions: `user_can_read_project(project_id)`, `user_can_read_company(company_id)`
- Policies use these helpers to determine row visibility
- **Decision:** Include helper functions in schema.sql, call them in POLICIES

### 4. **ADR-029: Multi-Domain**
- `projects.domain_id` is **immutable** (no UPDATE allowed, enforced in DB + Edge Function)
- `governance_domains` table stores domain definitions (ai_adoption, transformacion_digital, data_governance)
- `evaluation_dimensions` and `framework_controls` are domain-specific
- **Decision:** domain_id is NOT NULL, add UNIQUE constraint + comment about immutability

### 5. **Contracted Packages (BKL-024)**
- Source of truth: `companies.contracted_packages` (cascades to `projects.contracted_packages`)
- Determines which modules (T1–T13) are visible
- Seed value: all 3 packages by default
- **Decision:** Both columns needed, both nullable initially (default to all packages)

### 6. **Person Management**
- `company_persons` is a glue table connecting T1/T2/T3/T9 persons
- Write scope: `project_id` (must be set for INSERT/UPDATE/DELETE)
- Read scope: `company_id` (new, allows cross-project person lookup)
- **Decision:** Both columns present, both can be non-NULL but with different guarantees

---

## 📦 Consolidated Schema Structure

### File: `supabase/schema.sql`

#### Sections (in order):
1. **Header & Metadata** (comments, version, table count)
2. **Extensions** (uuid-ossp)
3. **Helper Functions** (RLS validators, RPC internals)
4. **Enums** (user roles, project status, etc.)
5. **Core Tables** (profiles → companies → projects → tools)
6. **Relationship Tables** (project_members, company_persons, snapshots)
7. **Governance Tables** (domains, dimensions, controls, packages)
8. **Configuration Tables** (application_texts, audit logs)
9. **Indexes** (performance-critical queries)
10. **Functions & RPCs** (create_project, update_project, delete_project, merge_company_persons, etc.)
11. **Triggers** (auto-update updated_at, auto-add company members)
12. **RLS Policies** (all tables, all helpers)
13. **Seed Data** (minimal: 1 admin user, demo company, ai_adoption domain, transformacion_digital seed)

---

## 🔗 Migration Files to Consolidate

### ACTIVE (include in schema.sql)

**Foundation (must be in order):**
- `001_foundation.sql` — core profiles, engagements→projects, tool tables
- `002_snapshots.sql` — snapshot tables
- `003_t1_multiinterviewee.sql` — ALTER t1_dimension_scores
- `004_companies_and_rename.sql` — companies table, rename engagements→projects
- `005_company_wide_access.sql` — company_id in members, auto-add trigger
- `006_performance_indexes.sql` — indexes
- `007_stakeholder_unofficial_tools.sql` — ALTER stakeholders
- `008_roles_four_tier.sql` — ALTER profiles.role enum

**Security (after foundation):**
- `20260527_security_persistence.sql` — session security
- `20260528_security_persistence.sql` — continued
- `20260601_schema_drift_sprint10.sql` — drift fixes
- `20260602_create_project_rpc.sql` — RPC
- `20260603_rls_policies.sql` — RLS

**Persons (after security):**
- `20260703_company_persons.sql` — company_persons table
- `20260705_backfill_company_persons_all_projects.sql` — **DATA** (include as seed)
- `20260706001_merge_company_persons_function.sql` — RPC
- `20260706002_stakeholders_person_id.sql` — ALTER stakeholders
- `20260707_company_departments_type.sql` — ALTER company_departments
- `20260708_company_persons_company_scope.sql` — RLS scope expansion

**Governance (after persons):**
- `20260824001_governance_domains_and_package_config.sql` — domains, dimensions, controls, packages
- `20260824002_seed_framework_controls.sql` — **DATA**
- `20260824003_seed_llm_prompt_templates.sql` — **DATA**
- `20260825001_create_project_rpc_add_domain_id.sql` — ALTER projects
- `20260825002_framework_controls_is_active.sql` — ALTER framework_controls
- `20260827001_projects_extended_fields.sql` — ALTER projects
- `20260827002_contracted_packages_default_all.sql` — ALTER projects/companies
- `20260827003_companies_contracted_packages.sql` — ALTER companies
- `20260827004_create_project_rpc_extended_fields.sql` — UPDATE RPC
- `20260828001_seed_transformacion_digital_domain.sql` — **DATA**
- `20260829001_delete_project_rpc.sql` — RPC
- `20260829002_update_project_rpc.sql` — RPC
- `20260829003_fix_update_project_ambiguity.sql` — FIX to RPC

**Application Config (last):**
- `20260903152412_create_application_texts_table.sql` — application_texts table
- `20260903_add_text_columns.sql` — ALTER application_texts
- `20260903_app_labels_overrides.sql` — labels config
- `20260903_fill_application_texts_defaults.sql` — **DATA**
- `20260903_rls_application_texts.sql` — RLS
- `20260904_fix_application_texts_semantics.sql` — semantic fix
- `20260904_refactor_application_texts_data.sql` — **DATA**

### ARCHIVED (skip, duplicates or superseded)
- `_archive/*` — all duplicates, don't include
- `DRAFT_*` — draft versions, don't include

---

## ✅ Validation Checklist

- [ ] All 37 active migrations consolidated into schema.sql
- [ ] Dependency order correct (no FK to non-existent table)
- [ ] All tables have PRIMARY KEY
- [ ] All FKs reference existing tables
- [ ] RLS policies come after all tables + helpers
- [ ] Seed data is idempotent (ON CONFLICT / IF NOT EXISTS)
- [ ] No syntax errors in schema.sql
- [ ] Functions have SECURITY DEFINER where needed
- [ ] Triggers exist for updated_at and auto-add
- [ ] Indexes created for performance-critical columns
- [ ] Comments explain non-obvious design decisions
- [ ] Schema compatible with PostgreSQL 13+ (Supabase standard)

---

## 📝 Next Steps

1. **Read each active migration file** (in dependency order)
2. **Extract DDL** (CREATE TABLE, CREATE FUNCTION, CREATE INDEX, etc.)
3. **Extract seed data** (INSERT statements marked DATA above)
4. **Write to schema.sql** (consolidate, remove duplicates, add comments)
5. **Test in DEV environment** (`supabase db reset` or fresh `supabase start`)
6. **Validate output** (run validation checklist)
7. **Archive old migrations** (move to `_archive/consolidated/`)

