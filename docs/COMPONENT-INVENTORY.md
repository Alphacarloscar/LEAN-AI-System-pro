# Component Inventory — GOBY Frontend

> Generado: 2026-06-03 · Rama: `refactor-AI-SOS`  
> Actualizado: 2026-06-05 — ToolHeader creado y exportado desde DS; migración completa T1–T12 (excl. T10); maxWidth prop añadida; PageHeader eliminado (huérfano); Badge/Button imports huérfanos limpiados  
> Método: grep/ripgrep sobre `src/`. Sin lectura fichero a fichero.  
> **NO modificar código hasta acordar estrategia de extracción.**

---

## 1. Tabla de Views — Componentes inline, botones ad-hoc, badges y inputs

| Fichero | Componentes inline | `<button>` ad-hoc | Cards (est.) | Inputs sin `htmlFor` (est.) | Badges inline |
|---------|-------------------|-------------------|--------------|-----------------------------|----|
| `modules/T1_MaturityRadar/T1View.tsx` | `NewInterviewModal` (1) | 8 | ~3 | ~4 | 0 |
| `modules/T2_StakeholderMatrix/T2View.tsx` | — | 3 | ~2 | 0 | 0 |
| `modules/T3_ValueStreamMap/T3View.tsx` | — | 7 | ~3 | 0 | 0 |
| `modules/T4_UseCasePriorityBoard/T4View.tsx` | — | 3 | ~2 | 0 | 0 |
| `modules/T5_AITaxonomyCanvas/T5View.tsx` | — | 1 | ~1 | 0 | 0 |
| `modules/T6_RiskGovernance/T6View.tsx` | `TabButton`, `PolicyTab`, `ShadowAICard`, `RiskDashboardTab` (4) | 7 | ~4 | 0 | 0 |
| `modules/T7_AdoptionHeatmap/T7View.tsx` | — | 2 | ~1 | 0 | 0 |
| `modules/T8_CommunicationMap/T8View.tsx` | — | 4 | ~1 | 0 | 0 |
| `modules/T9_AIRoadmap/T9View.tsx` | `Badge`, `GanttRowItem`, `AddFreeItemForm` (3) | 8 | ~4 | ~6 | 1 |
| `modules/T10_AIValueDashboard/T10View.tsx` | — | 0 | 0 | 0 | 0 |
| `modules/T11_OperatingRhythm/T11View.tsx` | — | 2 | ~1 | 0 | 0 |
| `modules/T12_ISOAssessment/T12View.tsx` | `StatusBadge`, `ClauseSidebar`, `ControlCardWrapper` (3) | 8 | ~5 | ~8 | 1 |
| `modules/CompanyProfile/CompanyProfileView.tsx` | `SectionLabel`, `FieldLabel`, `LeanSelect`, `AreaChip`, `ToggleChip`, `FrictionCard` (6) | 9 | ~3 | ~5 | 2 |
| `modules/Admin/AdminView.tsx` | `CheckIcon`, `TrashIcon`, `DeleteConfirmModal`, `AdminLoadingScreen`, `RoleBadge`, `CompaniesTab`, `UsersTab`, `ProjectsTab` (8) | 7 | ~8 | ~12 | 1 |
| `modules/Auth/LoginView.tsx` | `Field` (1) | 6 | 1 | 2 | 0 |
| `modules/Auth/ResetPasswordView.tsx` | `GobyLogo` (1) | 2 | 1 | 1 | 0 |
| `modules/Auth/UpdatePasswordView.tsx` | `GobyLogo` (1) ⚠ DUPLICADO | 1 | 1 | 1 | 0 |
| **TOTAL Views** | **29 funciones inline** | **78** | **~40** | **~39** | **5** |

> Los `<button>` en componentes extraídos (T*/components/*.tsx) suman ~105 más → **~183 totales en src/modules/**.

---

## 2. Hex hardcodeados — por fichero (top 25) y colores únicos

**Total instancias**: ~600 · **Colores únicos**: ~42

### Top 25 ficheros con más hex inline

| Fichero | Instancias |
|---------|-----------|
| `modules/T2_StakeholderMatrix/components/StakeholderQuadrantChart.tsx` | 40 |
| `modules/T12_ISOAssessment/T12View.tsx` | 39 |
| `modules/Admin/AdminView.tsx` | 37 |
| `modules/T6_RiskGovernance/PolicyPDF.tsx` | 35 |
| `modules/T11_OperatingRhythm/components/generateOperatingModelHTML.ts` | 33 |
| `shared/components/charts/ChartWrapper.tsx` | 29 |
| `modules/T4_UseCasePriorityBoard/constants.ts` | 24 |
| `modules/T9_AIRoadmap/T9View.tsx` | 22 |
| `modules/T1_MaturityRadar/components/T1SpiderChart.tsx` | 21 |
| `modules/T5_AITaxonomyCanvas/constants.ts` | 19 |
| `modules/Auth/ResetPasswordView.tsx` | 18 |
| `modules/T10_AIValueDashboard/T10View.tsx` | 17 |
| `modules/T2_StakeholderMatrix/components/DepartmentOverviewChart.tsx` | 16 |
| `modules/T7_AdoptionHeatmap/T7Constants.ts` | 15 |
| `modules/T6_RiskGovernance/constants.ts` | 15 |
| `modules/T2_StakeholderMatrix/components/MiniPositionMap.tsx` | 14 |
| `modules/T3_ValueStreamMap/components/HeroOpportunityMatrix.tsx` | 13 |
| `shared/components/AppSidebar.tsx` | 13 |
| `modules/T3_ValueStreamMap/components/ProcessInterviewModal.tsx` | 12 |
| `modules/Auth/UpdatePasswordView.tsx` | 11 |
| `modules/CompanyProfile/DepartmentManager.tsx` | 11 |
| `modules/T3_ValueStreamMap/components/DetailPositionMap.tsx` | 11 |
| `modules/T12_ISOAssessment/constants.ts` | 11 |
| `modules/T6_RiskGovernance/T6View.tsx` | 10 |
| `modules/T7_AdoptionHeatmap/components/T7BellCurveTab.tsx` | 10 |

### Colores más repetidos (top 10 por frecuencia)

| Hex | Nombre semántico | Instancias | Uso principal |
|-----|-----------------|-----------|---------------|
| `#C8860A` | gold / brand primary | 105 | Botones, accents, texto destacado |
| `#2A2822` | warm-black | 54 | Texto oscuro, fondo chart |
| `#C06060` | red / risk | 37 | Riesgo alto, alertas |
| `#5FAF8A` | green / success | 37 | Éxito, adopción |
| `#D4A85C` | amber / warning | 30 | Advertencias, medium risk |
| `#6A90C0` | blue / info | 29 | Información, categorías |
| `#94A3B8` | slate-400 | 25 | Texto secundario, iconos |
| `#E5E7EB` | gray-200 | 14 | Bordes, separadores |
| `#B57609` | gold-dark (hover) | 11 | Hover de botones primarios |
| `#16A34A` | green-600 | 7 | Checkmarks, completado |

> **Patrón**: `#C8860A` debería ser `--color-gold` en el design token. Los 5 colores semánticos (gold, warm-black, risk, success, warning, info) son la paleta real del producto — están duplicados por no existir tokens CSS centralizados.

---

## 3. Mapa de las 4 ubicaciones de componentes

> Se detectaron **4 ubicaciones**, no 3. La cuarta (`src/components/`) está huérfana.

### `src/components/` ⚠ HUÉRFANA
```
RecommendationPanel.tsx    ← único fichero; no sigue ninguna convención del proyecto
```
> No tiene `index.ts`, no está en `shared/`, y su nombre no tiene prefijo `T*`.  
> Candidato a mover a `src/shared/components/`.

### `src/shared/components/`
```
AlphaLogo.tsx              ← logo del producto (branding)
AppSidebar.tsx             ← sidebar principal de navegación
DebugPanel.tsx             ← solo en dev
EngagementSelector.tsx     ← selector de proyecto activo
ErrorBoundary.tsx          ← manejo de errores React
MetricHero.tsx             ← display de métrica hero
PersistenceBanner.tsx      ← estado de conexión/guardado
PhaseRoadmap.tsx           ← visualización de fases
PhaseMiniMap.tsx           ← mini-navegador de fases
RetryBanner.tsx            ← UI de reintento
Spinner.tsx                ← loading spinner
ToolErrorState.tsx         ← estado de error de herramienta
ToolLoadingScreen.tsx      ← pantalla de carga de herramienta
ViewerEmptyState.tsx       ← estado vacío para viewer
charts/
  ChartWrapper.tsx         ← wrapper SVG con paleta de colores (29 hex inline)
  LeanBarChart.tsx         ← bar chart
  LeanRadarChart.tsx       ← radar chart (RadarDimension type)
```

### `src/shared/layouts/`
```
AppLayout.tsx              ← root layout: sidebar + content area + providers
```

### `src/modules/T*/components/` (por módulo)
```
T1_MaturityRadar/components/
  DimensionCard.tsx        T1ExecutiveOutput.tsx
  T1RadarPanel.tsx         T1SpiderChart.tsx         ← 21 hex inline

T2_StakeholderMatrix/components/
  T2Badges.tsx             DepartmentMatrix.tsx
  MetallicScoreBars.tsx    DepartmentOverviewChart.tsx   ← 16 hex
  MiniPositionMap.tsx      StakeholderPanel.tsx
  StakeholderQuadrantChart.tsx                           ← 40 hex (top 1)
  ImportFromT1Modal.tsx    InterviewModal.tsx

T3_ValueStreamMap/components/
  T3Badges.tsx             ProcessInterviewModal.tsx      ← 12 hex
  StagesTab.tsx            HeroOpportunityMatrix.tsx      ← 13 hex
  HeroCategoryDonut.tsx    DetailPositionMap.tsx          ← 11 hex
  ProcessDetailPanel.tsx

T4_UseCasePriorityBoard/components/
  T4Badges.tsx             ExecDashboard.tsx
  QuarterlyRoadmap.tsx     PriorityMatrix.tsx
  T4ScoreEditors.tsx       LowScoreRecommendations.tsx
  EconomicsTab.tsx         AIActClassificationModal.tsx
  UseCaseDetailPanel.tsx   ImportFromT3Modal.tsx

T5_AITaxonomyCanvas/components/
  MaturityBadge.tsx        DomainCard.tsx
  EditModal.tsx            DomainProjectsModal.tsx
  DeptCategoryModal.tsx    PortfolioMatrix.tsx
  ActivationSequence.tsx   T5DimBars.tsx
  t5StatusMaps.ts

T6_RiskGovernance/components/
  PolicyPDF.tsx            ← 35 hex inline; única dependencia directa de @react-pdf

T7_AdoptionHeatmap/components/
  T7Tabs.tsx ⚠            T7BellCurveTab.tsx              ← 10 hex
  T7CondensedCard.tsx      T7MomentumCard.tsx
  T7DeptRecommendationsTab.tsx
  T7PlanPhaseCard.tsx      T7ChangeManagementPlanTab.tsx

T8_CommunicationMap/components/
  T8Tabs.tsx ⚠            T8CopyButton.tsx
  T8TimelineTab.tsx        T8ArchetypeMessagesTab.tsx
  T8MaterialsTab.tsx       T8DeptKitTab.tsx

T10_AIValueDashboard/components/
  DimBar.tsx    StatusBar.tsx   DonutChart.tsx   MetricChip.tsx
  DeptBar.tsx   NavButton.tsx   ExpandedSection.tsx  HeroMetric.tsx
  PanelCard.tsx EmptyStates.tsx DashboardHeader.tsx
  panels/
    P1MaturityPanel.tsx  P2PortfolioPanel.tsx  P3AdoptionPanel.tsx
    P4EcosystemPanel.tsx P5RiskPanel.tsx       P6GovernancePanel.tsx

T11_OperatingRhythm/components/
  TabButton.tsx ⚠         AdaptiveModeBadge.tsx   MaturityPill.tsx
  EventDetailPanel.tsx    EventNode.tsx
  BigPictureTab.tsx       CadenciaTab.tsx
  ObjetivosTab.tsx        DecisionesTab.tsx       KpisTab.tsx
  generateOperatingModelHTML.ts                   ← 33 hex inline

T12_ISOAssessment/components/
  (vacío — lógica inline en T12View.tsx)
```

---

## 4. Candidatos de extracción — por frecuencia de duplicación

### 🔴 Prioridad alta — copias exactas

| Componente | Ficheros duplicados | Impacto |
|------------|---------------------|---------|
| `TabButton` ✅ CERRADO (2026-06-04) | ~~`T6View.tsx`, `T7Tabs.tsx`, `T8Tabs.tsx`, `T11/TabButton.tsx`, `T4/UseCaseDetailPanel`~~ | Migrado a `<Tabs variant="pill">` DS. 5 copias eliminadas. `T7Tabs.tsx`, `T8Tabs.tsx`, `T11/TabButton.tsx` borrados. |
| `GobyLogo` | `ResetPasswordView.tsx`, `UpdatePasswordView.tsx` | 2 copias idénticas del SVG del logo |

### 🟡 Prioridad media — mismo patrón, props distintas

| Patrón | Instancias | Ficheros | Candidato |
|--------|-----------|----------|-----------|
| Badge `px-2 py-0.5 rounded-full text-[10px] font-semibold` | ~61 | T2Badges, T3Badges, T4Badges, T5Badges, T9View, T12View, AdminView | `<Badge variant color>` en `shared/` |
| Card `bg-white dark:bg-gray-900 rounded-xl border border-border shadow` | ~60 | Todos los módulos | `<Card>` base |
| `<button className="px-3 py-1.5 rounded-lg text-xs font-semibold...">` | ~183 | Todos los módulos | `<Button variant size>` |
| `<input>` sin `<label htmlFor>` | ~39 | T1View, T9View, T12View, AdminView, CompanyProfile | `<Field label>` (patrón de LoginView) |

### 🟢 Prioridad baja — similar pero divergente

| Componente | Dónde | Nota |
|------------|-------|------|
| Metric display | `MetricHero.tsx` (shared), `MetricChip.tsx` (T10), `HeroMetric.tsx` (T10) | 3 variantes para mostrar una cifra + label |
| Score editors | `T4ScoreEditors.tsx`, lógica en T11 | UI similar (slider/range) |
| Modal estructura | T1, T2, T4, T5, T6, T12, Admin | Header + body + footer repetidos inline |
| Archetype badge | `T2Badges.tsx` → `ArchetypeBadge`, `T4Badges.tsx` → `CategoryBadge` | Lógica idéntica, nombres distintos |

---

## 5. Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Ficheros `.tsx` totales | ~143 |
| Views (`T*` + Auth + Admin + CompanyProfile) | 17 |
| Componentes en `T*/components/` | ~78 |
| Componentes en `shared/components/` | 17 |
| Componentes huérfanos en `src/components/` | 1 |
| Funciones inline en Views (no exportadas) | **29** |
| `<button>` ad-hoc en módulos | **~183** |
| Instancias badge inline (`px-2 py-0.5 rounded-full`) | **~61** |
| Instancias card inline (`bg-white rounded border shadow`) | **~60** |
| `<input>` sin `htmlFor` en Views | **~39** |
| Hex hardcodeados totales | **~600** |
| Colores únicos hardcodeados | **~42** |
| Color más repetido | `#C8860A` × 105 |
| `TabButton` duplicados | **4** (T6View, T7, T8, T11) |
| `GobyLogo` duplicados | **2** (ResetPassword, UpdatePassword) |

### Orden recomendado de extracción

1. `TabButton` → `shared/components/TabButton.tsx` (4 copias → 0, máximo ROI)
2. `GobyLogo` → ya existe `AlphaLogo.tsx` en shared; unificar o añadir variant `"sm"`
3. `<Badge>` → `shared/components/Badge.tsx` con `variant` prop (61 instancias)
4. `<Button>` → `shared/components/Button.tsx` con `variant` + `size` (183 instancias)
5. `<Card>` → `shared/components/Card.tsx` (60 instancias + simplifica todos los módulos)
6. `<Field>` → `shared/components/Field.tsx` (patrón de LoginView ya es el correcto)
7. Design tokens CSS → `src/styles/tokens.css` con `--color-gold: #C8860A` etc. (600 hex → 0)
8. `RecommendationPanel.tsx` → mover de `src/components/` a `src/shared/components/`

---

## 6. ToolHeader — API y estado de adopción

### Componente: `src/shared/design-system/components/ToolHeader.tsx`

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onBack` | `() => void` | — | Activa el botón de retroceso (ghost, con chevron) |
| `backLabel` | `string` | — | Texto del back button. Sin texto → icono solo |
| `toolCode` | `string` | — | Badge `navy-ghost` con código T1–T12 |
| `title` | `string` | **req.** | Título principal como `<h1>` |
| `subtitle` | `ReactNode` | — | Empresa / contexto. String → auto-styled mono |
| `phaseMiniMap` | `ReactNode` | — | Slot para `<PhaseMiniMap>`, inline con el h1 |
| `cta` | `ReactNode` | — | Acciones derecha (botones export/generate, year selector) |
| `chips` | `ReactNode` | — | Pills de estado / stat cards (counts, risk pills) |
| `sticky` | `boolean` | `false` | `sticky top-[57px] z-10` + backdrop-blur |
| `below` | `ReactNode` | — | Fila extra bajo la cabecera (progress bar T1/T12) |
| `maxWidth` | `string` | `'max-w-7xl'` | Clase Tailwind para el contenedor interno |
| `className` | `string` | `''` | Clases adicionales en `<header>` (ej. `print:hidden`) |

### Adopción por módulo

| Módulo | sticky | maxWidth | chips | cta | below | Estado |
|--------|--------|----------|-------|-----|-------|--------|
| T1 | ✅ | `max-w-6xl` | progress+score | Nueva entrevista | — | ✅ |
| T2 | ✅ | `max-w-6xl` | — | Importar T1 / Nueva entrevista | — | ✅ |
| T3 | ✅ | `max-w-7xl` | stat cards (3) | + Proceso | — | ✅ |
| T4 | ✅ | `max-w-7xl` | — | Importar T3 | — | ✅ |
| T5 | — | `max-w-[1200px]` | — | MaturityBadge | — | ✅ |
| T6 | — | `max-w-[1100px]` | risk/unclassified pills | — | — | ✅ |
| T7 | — | `max-w-5xl` | 3 stat cards | — | — | ✅ |
| T8 | — | `max-w-5xl` | 4 stat cards | IA generation row | — | ✅ |
| T9 | — | `max-w-6xl` | — | year selector + botones | — | ✅ |
| T10 | — | n/a | n/a | n/a | n/a | ⛔ DashboardHeader (patrón distinto) |
| T11 | ✅ | `max-w-5xl` | — | Exportar modelo | — | ✅ |
| T12 | ✅ | `max-w-7xl` | — | Importar T6 / Exportar | progress bar | ✅ |

> **PageHeader eliminado** — 0 referencias en código de aplicación. Archivos borrados: `PageHeader.tsx`, `PageHeader.stories.tsx`. Export removido de `index.ts`.

---

## 7. Estado de migración al Design System

> Migración módulo a módulo. Solo módulos con al menos 1 PR de refactor se listan.

| Módulo | Button | FormField | Card | Modal | Badge | Estado | Notas |
|--------|--------|-----------|------|-------|-------|--------|-------|
| T1 | ✅ DimensionCard, T1RadarPanel | ✅ DimensionCard (evidencia) | — | — | ✅ DimensionCard | **Parcial** | T1View botones y cards pendientes |
| T2 | ✅ T2View, InterviewModal, ImportFromT1Modal, StakeholderPanel | ✅ InterviewModal (nombre/cargo/tools) | ✅ DepartmentMatrix (summary) | ✅ InterviewModal, ImportFromT1Modal | ✅ T2Badges (ArchetypeBadge, ResistanceBadge) | **Completo** | Ver detalle §6.1 |
| T4 | ✅ T4View, UseCaseDetailPanel, EconomicsTab, ImportFromT3Modal, AIActClassificationModal | ✅ UseCaseDetailPanel roadmap (×7) | ✅ ExecDashboard, QuarterlyRoadmap, EconomicsTab, UseCaseDetailPanel, LowScoreRecommendations | ✅ ImportFromT3Modal, AIActClassificationModal | ✅ T4Badges (×2) + inline ×4 (quarter, AI Act risk, dim chips, weak dim chips) | **Completo** | Ver detalle §9.1 |
| T5 | ✅ T5View (back), DomainCard (Editar) | — | ✅ DomainCard (×3), ActivationSequence, PortfolioMatrix, EditModal, DomainProjectsModal ×2, DeptCategoryModal ×2 | ✅ EditModal, DomainProjectsModal, DeptCategoryModal | ✅ MaturityBadge (reescrito), DomainCard rec badge, EditModal rec badge, DeptCategoryModal rec badge, T5View label, UC_STATUS_VARIANT map (×2 modals) | **Completo** | Ver detalle §11.1 |
| T6 | ✅ T6View back, T7/T8View backs, T7ChangeManagement (ghost+primary) | — | ✅ RiskDashboardTab cobertura+tabla, T7/T8 stat cards, T7 SVG container, MomentumCard, CondensedCard, DeptRec cards, PlanPhaseCard, T8 action cards, T8 content wrappers, T8 DeptKit cards | — | ✅ T6 T6 label, highRisk/unclassified/AI-generada pills, T7 T7 label+momentum, DeptRec readiness, PlanPhase segments, T8 T8 label+readiness+timeline meta-chips+material tags | **Completo** | Ver detalle §12 |
| T7 | ✅ (idem T6 row) | — | ✅ (idem T6 row) | — | ✅ (idem T6 row) | **Completo** | Ver detalle §13 |
| T8 | ✅ (idem T6 row) | — | ✅ (idem T6 row) | — | ✅ (idem T6 row) | **Completo** | Ver detalle §14 |
| T9 | ✅ T9View back+Crear snapshot+Añadir, AddFreeItemForm (Añadir+Cancelar) | ✅ AddFreeItemForm (nombre, departamento, responsable) | ✅ stat cards ×4, Gantt container, AddFreeItemForm container | — | ✅ Local Badge fn→DS Badge (status×2, source×2, risk×2), dept chip | **Completo** | Ver detalle §16 |
| T10 | — | — | ✅ PanelCard outer (Card flat dark:bg-warm-600) | — | ✅ PanelCard tag chip (warning/success/info/danger/purple-inline), P1 tier badge, P2 status chips | **Completo** | Ver §21 — NavButton ad-hoc documentado |
| T11 | ✅ T11View back + Exportar | — | ✅ Hero card, KPI strip ×4, How-it-works card, SAFe note (Card flat warm-700/800), DecisionesTab escalada note | — | ✅ T11 badge (warning), KpisTab source badge (inline style) | **Completo** | Ver §20 — warm-600 divs reportados |
| T12 | ✅ T12View back + Importar T6 + Exportar + Expandir/Colapsar | — | ✅ ClauseSidebar progress, ControlCardWrapper | — | — | **Completo** | Ver §19 |

### §6.1 — T2 Detalle de migración (2026-06-03)

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T2Badges.tsx` | `ArchetypeBadge` | `<span className="${badgeBg} ${badgeText} rounded-full ...">` | `<Badge variant={ARCHETYPE_VARIANT[archetype]} shape="pill" size="sm" className={BADGE_OVERRIDE}>` |
| `T2Badges.tsx` | `ResistanceBadge` | `<span className="${badgeBg} ${badgeText} rounded-full ...">` | `<Badge variant={RESISTANCE_VARIANT[resistance]} shape="pill" size="sm" className={BADGE_OVERRIDE}>` |
| `T2View.tsx` | Botón "Volver al dashboard" | `<button className="text-xs text-text-muted ...">` | `<Button variant="link" className="text-xs font-medium">` |
| `T2View.tsx` | Botón "Importar desde T1" | `<button className="border border-border ...">` | `<Button variant="secondary" size="sm">` |
| `T2View.tsx` | Botón "Nueva entrevista" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm">` |
| `InterviewModal.tsx` | Wrapper modal | `<div className="fixed inset-0 z-50 ...">` + Escape handler manual | `<Modal open={true} onClose={...} title={...} size="md">` (focus-trap, Esc, overlay, scroll-lock incluidos) |
| `InterviewModal.tsx` | Input "Nombre" | `<label>` suelto + `<input className="...">` | `<FormField id="stakeholder-name" label="Nombre" ...>` |
| `InterviewModal.tsx` | Input "Cargo" | `<label>` suelto + `<input className="...">` | `<FormField id="stakeholder-role" label="Cargo" ...>` |
| `InterviewModal.tsx` | Textarea "Herramientas ext." | `<label>` suelto + `<textarea className="...">` | `<FormField id="..." multiline rows={2} hint="...">` |
| `InterviewModal.tsx` | Select Departamento | `<label>` suelto + `<Select>` DS | `<Select label="Departamento">` (label movido a prop del DS Select) |
| `InterviewModal.tsx` | Botón "Iniciar entrevista" | `<button type="submit" className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm" fullWidth disabled={...}>` |
| `InterviewModal.tsx` | Botón "← Pregunta anterior" | `<button className="text-[10px] ...">` | `<Button variant="link" className="text-[10px]">` |
| `InterviewModal.tsx` | Botón "Añadir a la matrix" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm" fullWidth>` |
| `InterviewModal.tsx` | Badge arquetipo en ResultPhase | `<span className="${arc.badgeBg} ${arc.badgeText} ...">` | `<ArchetypeBadge archetype={archetype}>` (usa DS Badge internamente) |
| `InterviewModal.tsx` | Badge resistencia en ResultPhase | `<span className="${res.badgeBg} ${res.badgeText} ...">` | `<ResistanceBadge resistance={resistance}>` |
| `InterviewModal.tsx` | Badge "Ajustado manualmente" | `<span className="text-warning-dark bg-warning-light ...">` | `<Badge variant="warning" shape="pill" size="sm" className="!text-[10px] !font-semibold">` |
| `ImportFromT1Modal.tsx` | Wrapper modal | `<div className="fixed inset-0 z-50 ...">` | `<Modal open={true} onClose={...} title="..." size="xl" footer={...}>` |
| `ImportFromT1Modal.tsx` | Botón "Seleccionar todos" | `<button className="text-[10px] font-semibold text-navy ...">` | `<Button variant="link" className="text-[10px]">` |
| `ImportFromT1Modal.tsx` | Botón "Limpiar" | `<button className="text-[10px] text-text-muted ...">` | `<Button variant="link" className="text-[10px]">` |
| `ImportFromT1Modal.tsx` | Botón "Cancelar" | `<button className="text-xs font-semibold text-text-muted ...">` | `<Button variant="ghost" size="sm">` |
| `ImportFromT1Modal.tsx` | Botón "Importar N stakeholders" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm" disabled={...}>` |
| `ImportFromT1Modal.tsx` | Botón "Ver la Stakeholder Matrix" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary">` |
| `ImportFromT1Modal.tsx` | Badge tipo IT/Negocio | `<span className="bg-indigo-50 text-indigo-700 ...">` | `<Badge shape="pill" size="sm" style={TYPE_BADGE_STYLE[type]}>` (colores data-driven, inline style) |
| `DepartmentMatrix.tsx` | Summary card container | `<div className="rounded-xl border border-border bg-white ...">` | `<Card variant="outlined" padding="none" className="rounded-xl px-5 py-4">` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `StakeholderQuadrantChart.tsx` | Todo | SVG complejo con gradientes radiales, jitter algorithm, datos visuales de posición. Excluido explícitamente por instrucciones. |
| `DepartmentOverviewChart.tsx` | Todo | SVG de barras con gradientes metálicos. Excluido explícitamente. |
| `MetallicScoreBars.tsx` | Todo | SVG de barras metálicas. Excluido explícitamente. |
| `MiniPositionMap.tsx` | Todo | SVG mini-mapa. Excluido explícitamente. |
| `StakeholderPanel.tsx` | Outer div container | Layout multi-sección con divide-x y padding diferencial; usar Card requeriría restructurar la jerarquía div/flexbox. Visual equivalencia garantizada dejando como div. |
| `StakeholderPanel.tsx` | Botón "Iniciar entrevista" | Botón CTA primario → candidato a `<Button variant="primary">`. **Pendiente**: el botón es pequeño (h≈28px) y un `size="sm"` (h-8=32px) quebraría el layout compacto del panel sin override. |
| `DepartmentMatrix.tsx` | Cards de departamento colapsables | Estructura interactiva compleja (button header + list body). Card DS no tiene slot para header interactivo. |
| `DepartmentMatrix.tsx` | Distribución arquetipos chips (`div.flex.items-center.gap-1.5.rounded-full`) | Color proviene de `cfg.badgeBg`/`cfg.badgeText` (Tailwind classes del dominio), no un estado semántico. Estos chips del resumen son visualización agregada, no badges de estado de entidad individual. No se migraron a DS Badge para no perder los colores de dominio sin crear variants nuevos. |
| `InterviewModal.tsx` | Botones respuesta A/B/C/D | Interfaz de quiz con color-coding por código de respuesta. No son acciones CTA — son selección contextual. Mantienen su lógica de color semántico (A=verde, B=azul, C=amarillo, D=rojo). |
| `InterviewModal.tsx` | Botones selector arquetipo (3-col grid) | Toggle-group de selección manual. El estado activo usa `cfg.badgeBg`/`cfg.badgeText` del dominio. |
| `InterviewModal.tsx` | Botones selector resistencia (flex 3 cols) | Ídem. |
| `store.ts`, services, lógica de negocio | Todo | Excluido explícitamente por instrucciones. |

#### Hardcodes ad-hoc residuales en T2 tras migración

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `StakeholderQuadrantChart.tsx` | 40 hex | SVG data visualization — intencional |
| `DepartmentOverviewChart.tsx` | 16 hex | SVG data visualization — intencional |
| `MiniPositionMap.tsx` | 14 hex | SVG data visualization — intencional |
| `DepartmentMatrix.tsx` | ~3 inline divs | Chips de distribución de arquetipos en resumen (colores dominio Tailwind) |
| `StakeholderPanel.tsx` | ~2 buttons | Botón close (h-6 w-6 micro-control) + "Iniciar entrevista" (ver nota arriba) |
| `InterviewModal.tsx` | ~6 buttons | Respuestas A/B/C/D + toggles de arquetipo/resistencia |

---

## 7. Watch-list — Patrones con 1 consumidor actual (umbral: 2 → extracción)

> No extraer todavía. Avisar cuando T2 o cualquier otro módulo añada un **segundo consumidor**.

| Patrón | Consumidor actual | Umbral para extraer | Notas |
|--------|------------------|---------------------|-------|
| `size/density="sm"` en Badge | T4 (`T4Badges.tsx` BADGE_OVERRIDE) | **2 consumidores** | T2 también usa BADGE_OVERRIDE — ¡ya tiene 2 consumidores! Ver §7.1 |
| `size/density="sm"` en FormField | T1 (`DimensionCard.tsx` evidencia) | **2 consumidores** | T2 también usa FormField en InterviewModal — ¡ya tiene 2 consumidores! Ver §7.2 |
| SegmentedControl para toggles | T1 (IT/BIZ toggle en T1RadarPanel) | **2 consumidores** | T2 no usa este patrón. Sigue en 1 consumidor. |
| ScoreInput / rating numérico | T4 (T4ScoreEditors), T1 (SubdimRow botones 0-4) | **3 consumidores** | T2 no tiene score input numérico interactivo. |

### §7.1 — BADGE size="xs" ✅ CERRADO (2026-06-03)

`size="xs"` añadido a `Badge.tsx`: `px-2 py-0.5 text-[10px] font-semibold gap-1`.  
`BADGE_OVERRIDE` eliminado de T2Badges.tsx y T4Badges.tsx.  
StatusBadge, CategoryBadge, ArchetypeBadge y ResistanceBadge usan `size="xs"` directamente.

### §7.2 — FORMFIELD EN MODALES: 2 consumidores alcanzados

T1 (`DimensionCard` evidencia) y T2 (`InterviewModal` nombre/cargo/tools) usan FormField con `className` override para ajustar font-size/style:
```tsx
// T1 DimensionCard
<FormField id="evidence-..." multiline rows={2} className="!text-[11px] ...">

// T2 InterviewModal — usa props estándar sin className override
<FormField id="stakeholder-name" label="Nombre" ...>
```
Usos convergentes pero todavía sin conflicto. No requiere acción.

### §7.3 — SegmentedControl ✅ CERRADO (2026-06-03)

`SegmentedControl` creado en `src/shared/design-system/components/SegmentedControl.tsx`.  
API: `options[]` (value/label/activeColor/icon), `value`, `onChange`, `size`, `columns`, `aria-label` (required).  
A11y: role=radiogroup, roving tabindex, ArrowLeft/Right/Up/Down, Space/Enter, focus-visible ring.  
5 sitios migrados (T2 + T3):
- `T1View.tsx` — toggle IT/BIZ (2 opciones)
- `T2 InterviewModal.tsx` — selector arquetipo + selector resistencia
- `T3 ProcessInterviewModal.tsx` — selector de fase de madurez (5 opciones, columns=3)
- `T3 StagesTab.tsx` / `StageModal` — selector valueContribution (4 opciones, columns=2)

### §7.4 — Button size="xs": ✅ CERRADO (2026-06-04)

`size="xs"` añadido a `Button.tsx`: `h-7 px-2.5 text-[10px] gap-1` (28px alto). `iconOnlySize.xs = 'h-7 w-7'`.  
`variant="link"` ignora `size` — sin cambio.  
2 consumidores migrados:
1. `StakeholderPanel.tsx` (T2) — "Iniciar entrevista": ad-hoc `px-2.5 py-1.5 bg-navy-metallic` → `<Button variant="primary" size="xs" icon={<svg>}>`
2. `StagesTab.tsx` (T3) — "+ Etapa" header: `size="sm"` (32px) → `size="xs"` (28px, restaura tamaño original ~26px)

### §7.5 — Regla Badge/gradient: NO className override sobre variant con background-image

**Regla:** Nunca usar `!bg-*` para sobreescribir el fondo de un `<Badge>` cuyo variant aplique `background-image` (gradient/metallic). CSS: `background-image` pinta SOBRE `background-color` aunque el !important sea del bg-color. Resultado: texto ilegible (dark text on dark gradient).

**Patrón correcto** para colores data-driven sobre fondo transparente o específico:  
```tsx
// ✓ Correcto — inline style con AMBOS valores (bg + color)
style={{ backgroundColor: '#2A2822', color: '#F0EDE8' }}   // T2 decisor
style={{ backgroundColor: `${hex}22`, color: hex }}          // T4 CategoryBadge
style={{ backgroundColor: 'rgba(42,40,34,0.1)', color: '#2A2822' }}  // T3 escalado/impact-alto

// ✗ Incorrecto — className override ignorada por background-image
className="!bg-navy/10 !text-navy"  // NO USAR sobre variant="navy"
```

Casos en producción que usan este patrón:
- T2 `ArchetypeBadge` decisor → `DECISOR_STYLE: { backgroundColor: '#2A2822', color: '#F0EDE8' }`
- T3 `PhaseBadge` escalado → `ESCALADO_STYLE: { backgroundColor: 'rgba(42,40,34,0.1)', color: '#2A2822' }`
- T3 `ProcessDetailPanel` impact alto → `IMPACT_ALTO_STYLE: { backgroundColor: 'rgba(42,40,34,0.1)', color: '#2A2822' }`
- T4 `CategoryBadge` + T3 `CategoryBadge` → `style={{ backgroundColor: hex+'22', color: hex }}`

---

## 8. Estado de migración al Design System — T3 (2026-06-04)

### §8.1 — T3 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T3Badges.tsx` | `CategoryBadge` | `<span className="${badgeBg} ${badgeText}">` | `<Badge style={{ backgroundColor: hex+'22', color: hex }}>` (data-driven hex) |
| `T3Badges.tsx` | `ReadinessBadge` | `<span className="${badgeBg} ${badgeText}">` | `<Badge variant={READINESS_VARIANT[level]} size="xs" shape="pill">` |
| `T3Badges.tsx` | `PhaseBadge` | `<span className="${badgeBg} ${badgeText}">` | `<Badge variant={PHASE_VARIANT[phase]} size="xs" shape="pill" style={escalado? ESCALADO_STYLE}>` |
| `T3View.tsx` | Botón back | `<button className="h-8 w-8 rounded-full ...">` | `<Button variant="ghost" size="sm" aria-label="Volver">` |
| `T3View.tsx` | Botón "+ Proceso" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm">` |
| `T3View.tsx` | Botón "Reintentar" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm">` |
| `T3View.tsx` | Botón "+ Añadir primer proceso" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm">` |
| `T3View.tsx` | Botón "Limpiar filtros ×" | `<button className="text-[10px] text-text-subtle ...">` | `<Button variant="link" className="text-[10px]">` |
| `T3View.tsx` | Hero chart containers (×2) | `<div className="rounded-3xl bg-white border ...">` | `<Card variant="outlined" padding="none" className="rounded-3xl ...">` |
| `T3View.tsx` | Phase badge en process cards | `<span className="${phaseCfg.badgeBg} ${phaseCfg.badgeText}">` | `<PhaseBadge phase={p.phase} />` |
| `T3View.tsx` | Category badge en process cards | `<span className="${catCfg.badgeBg} ${catCfg.badgeText}">` | `<Badge style={{ backgroundColor: hex+'22', color: hex }}>` (label truncado conservado) |
| `ProcessInterviewModal.tsx` | Wrapper modal | `<div className="fixed inset-0 z-50...">` + Escape manual | `<Modal open title size="lg">` |
| `ProcessInterviewModal.tsx` | Input "Nombre proceso" | `<label>` suelto + `<input>` | `<FormField id="process-name" label="..." required>` |
| `ProcessInterviewModal.tsx` | Input "Responsable" + "Rol/Cargo" | `<label>` suelto + `<input>` ×2 | `<FormField id="..." label="...">` ×2 |
| `ProcessInterviewModal.tsx` | Textarea "Descripción" | `<label>` suelto + `<textarea>` | `<FormField id="process-description" multiline rows={2}>` |
| `ProcessInterviewModal.tsx` | Select Departamento | `<label>` suelto + `<Select>` DS | `<Select label="Departamento / Área">` (label a prop) |
| `ProcessInterviewModal.tsx` | Phase selector (fase madurez) | `flex flex-wrap` de 5 `<button>` | `<SegmentedControl columns={3} activeColor=PHASE_ACTIVE_COLOR>` |
| `ProcessInterviewModal.tsx` | Select categoría IA (ajuste) | `<label>` suelto + `<select>` nativo | `<Select label="Categoría IA" options={...}>` DS |
| `ProcessInterviewModal.tsx` | Select readiness (ajuste) | `<label>` suelto + `<select>` nativo | `<Select label="Readiness del equipo" options={...}>` DS |
| `ProcessInterviewModal.tsx` | Botón "Continuar..." | `<button type="submit" className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm" fullWidth disabled={...}>` |
| `ProcessInterviewModal.tsx` | Botón "← Volver" | `<button className="border border-border ...">` | `<Button variant="secondary" size="sm">` |
| `ProcessInterviewModal.tsx` | Botón "Añadir proceso al mapa" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm" className="flex-[2]">` |
| `ProcessInterviewModal.tsx` | Badge categoría en resultado | `<span className="${cfg.badgeBg} ${cfg.badgeText}">` | `<CategoryBadge category={result.aiCategory}>` |
| `ProcessInterviewModal.tsx` | Badge "Ajuste manual" | `<span className="text-warning-dark bg-warning-light ...">` | `<Badge variant="warning" shape="pill" size="xs">` |
| `ProcessDetailPanel.tsx` | Badge "Override consultor" | `<span className="bg-warning-light text-warning-dark ...">` | `<Badge variant="warning" shape="pill" size="xs">` |
| `ProcessDetailPanel.tsx` | Botón "Personalizar con IA" | `<button className="...">` con 3 estados de estilo | `<Button variant="secondary" size="sm" loading={...} disabled={...}>` |
| `ProcessDetailPanel.tsx` | Badges esfuerzo (×bajo/medio/alto) | `<span className="${effortColors[opp.effort]}">` | `<Badge variant={EFFORT_VARIANT[opp.effort]} size="xs">` |
| `ProcessDetailPanel.tsx` | Badges impacto (×bajo/medio/alto) | `<span className="${impactColors[opp.impact]}">` | `<Badge variant={IMPACT_VARIANT} size="xs" style={impact=alto? IMPACT_ALTO_STYLE}>` |
| `ProcessDetailPanel.tsx` | Opportunity cards container | `<div className="rounded-2xl border ...">` | `<Card variant="flat" padding="none" className="...">` |
| `StagesTab.tsx` | StageModal wrapper | `<div className="fixed inset-0 z-50 ...">` | `<Modal open title size="md" footer={...}>` |
| `StagesTab.tsx` | Input "Nombre etapa" | `<label className={labelCls}>` suelto + `<input className={inputCls}>` | `<FormField id="stage-name" label="..." required>` |
| `StagesTab.tsx` | Inputs responsable/sistema/tiempos/handoffs | `<label>` suelto + `<input>` ×5 | `<FormField id="..." label="...">` ×5 |
| `StagesTab.tsx` | Textarea "Notas" | `<label>` suelto + `<textarea>` | `<FormField id="stage-notes" multiline rows={2}>` |
| `StagesTab.tsx` | Select Departamento | `<label>` suelto (partial) + `<Select>` DS | `<Select label="Departamento">` DS (label a prop) |
| `StagesTab.tsx` | valueContribution selector | `grid grid-cols-2` de 4 `<button>` | `<SegmentedControl columns={2} activeColor=VALUE_ACTIVE_COLOR>` |
| `StagesTab.tsx` | Botón "Eliminar etapa" | `<button className="text-xs text-danger-dark hover:underline">` | `<Button variant="danger" size="sm">` |
| `StagesTab.tsx` | Botón "Cancelar" | `<button className="text-xs text-text-muted hover:bg-gray-100">` | `<Button variant="ghost" size="sm">` |
| `StagesTab.tsx` | Botón "Guardar/Añadir etapa" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm">` |
| `StagesTab.tsx` | Botón "+ Añadir primera etapa" | `<button className="bg-navy-metallic ...">` | `<Button variant="primary" size="sm">` |
| `StagesTab.tsx` | Botón "+ Etapa" (header) | `<button className="bg-navy-metallic text-[10px] py-1.5 ...">` (~26px) | `<Button variant="primary" size="sm">` (32px — ver §7.4) |
| `StagesTab.tsx` | KPI cards ×4 | `<div className="rounded-2xl bg-gray-50 border ...">` | `<Card variant="outlined" padding="none" className="rounded-2xl px-4 py-3">` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `HeroOpportunityMatrix.tsx` | Todo | SVG interactivo con dots, cuadrantes, hover. Excluido por instrucciones. |
| `HeroCategoryDonut.tsx` | Todo | SVG donut con anillos concéntricos. Excluido por instrucciones. |
| `DetailPositionMap.tsx` | Todo | SVG mini-mapa 2x2. Excluido por instrucciones. |
| `ProcessInterviewModal.tsx` | Quiz MCQ buttons A/B/C/D | Quiz-style selection con visual feedback por código. No son CTAs. |
| `ProcessDetailPanel.tsx` | Tabs "Oportunidades/Etapas" | Navegación inline con `border-b-2`, no botones de acción. |
| `StagesTab.tsx` | Swimlane stage cards | Visualización data-driven con anchura proporcional al tiempo. Color del top band desde `cfg.barColor`. La chip interior (chipBg/chipText Tailwind) también queda como está — es visualización de valor dentro de la tarjeta swimlane, no badge de estado de entidad. |
| `StagesTab.tsx` | Bottleneck callout | Alert domain-specific con icon emoji + texto. No en lista de componentes target. |
| `T3View.tsx` | Phase filter buttons | Filtros con estado nullable (ninguna fase seleccionada = all). SegmentedControl requiere valor siempre. |
| `store.ts`, `constants.ts`, services | Todo | Lógica de negocio. Excluido explícitamente. |

#### Hardcodes ad-hoc residuales en T3 tras migración

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `HeroOpportunityMatrix.tsx` | 13 hex | SVG visualization — intencional |
| `HeroCategoryDonut.tsx` | ~10 hex | SVG visualization — intencional |
| `DetailPositionMap.tsx` | ~5 hex | SVG mini-mapa — intencional |
| `T3View.tsx` | 5 phase filter `<button>` | Filtros con estado nullable (no SegmentedControl) |
| `ProcessDetailPanel.tsx` | 2 tab `<button>` | Navegación de pestañas inline |
| `StagesTab.tsx` | Stage swimlane chips | `chipBg/chipText` Tailwind — visualización proporcional al tiempo |

#### Verificación ScoreInput (readiness scoring)

**¿T3 tiene el mismo patrón de score numérico que T1 SubdimRow y T4 ScoreInput?**  
**No.** Tres controles distintos:
- **T1 `SubdimRow`** (`DimensionCard.tsx:88-106`): 5 `<button>` (0-4 escala discreta), click to set, active = filled color
- **T4 `ScoreInput`** (`T4ScoreEditors.tsx:48-112`): `<input type="range" min=0 max=100 step=5>` (slider continuo 0-100), con visual bar + thumb
- **T3 readiness**: no hay control numérico interactivo. La `orgReadiness` se ajusta con un `<Select label="Readiness del equipo">` (select categorical: alta/media/baja). Los score bars en ResultPhase son puramente visualización de resultados computados, no entrada de usuario.

**¿T1 SubdimRow y T4 ScoreInput son el mismo patrón?**  
**No.** T1 = button group discreto (0-4 enteros). T4 = range slider continuo (0-100 porcentaje). Diferentes dominios (madurez de dimensión vs puntuación de caso de uso), escala diferente, interacción diferente.

**Conclusión**: NO hay 3 consumidores del mismo `ScoreInput` en T3. Candidatura a `<ScoreInput>` compartido no aplica todavía.

---

## 9. Estado de migración al Design System — T4 (2026-06-04)

### §9.1 — T4 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T4View.tsx` | Botón back icon-only | `<button h-8 w-8 rounded-full bg-transparent>` | `<Button variant="ghost" size="sm" aria-label="Volver al dashboard" icon={<svg>}>` |
| `T4View.tsx` | Botón "↓ Importar desde T3" | `<button bg-navy-metallic>` | `<Button variant="primary" size="sm">` |
| `T4View.tsx` | Botón "Volver al Dashboard" (guard) | `<button text-navy hover:underline>` | `<Button variant="link" className="mt-2">` |
| `ImportFromT3Modal.tsx` | Wrapper modal | `<div fixed inset-0 z-50>` | `<Modal open title="Importar procesos desde T3" size="xl" footer={...}>` |
| `ImportFromT3Modal.tsx` | "Seleccionar todos" / "Limpiar" | `<button text-navy hover:underline>` ×2 | `<Button variant="link" className="text-[10px]">` ×2 |
| `ImportFromT3Modal.tsx` | "Cancelar" / "Importar" | `<button bg-gray-200/bg-navy-metallic>` ×2 | `<Button variant="ghost|primary" size="sm" loading={...}>` ×2 |
| `ImportFromT3Modal.tsx` | "Ver el Priority Board" | `<button bg-navy-metallic>` | `<Button variant="primary">` |
| `ImportFromT3Modal.tsx` | Category badge chip | `<span px-1.5 py-0.5 rounded-full>` | `<Badge shape="pill" size="xs" style={hex}>` |
| `AIActClassificationModal.tsx` | Wrapper modal | `<div fixed inset-0 z-50>` | `<Modal open title={useCaseName} size="md" footer={...}>` |
| `AIActClassificationModal.tsx` | "AI Act" pill | `<span px-2 py-0.5 rounded-full bg-navy text-white>` | `<Badge variant="navy" shape="pill" size="xs">` |
| `AIActClassificationModal.tsx` | "Cancelar" / "Guardar clasificación" | `<button border>` / `<button bg-navy-metallic>` | `<Button variant="ghost|primary" size="sm">` ×2 |
| `EconomicsTab.tsx` | "✎ Editar" / "Cancelar" / "Guardar" | `<button bg-navy-metallic/border>` ×3 | `<Button variant="primary|ghost|primary" size="sm">` ×3 |
| `EconomicsTab.tsx` | KPI summary boxes ×3 | `<div rounded-2xl bg-warm-50 border>` | `<Card variant="flat" padding="none" className="...">` ×3 |
| `EconomicsTab.tsx` | Fields grid container | `<div rounded-2xl border bg-warm-50>` | `<Card variant="flat" padding="none" className="...">` |
| `LowScoreRecommendations.tsx` | Recommendation items | `<div rounded-xl bg-warm-50 border>` | `<Card variant="outlined" padding="none" className="rounded-xl ...">` |
| `ExecDashboard.tsx` | KPI cards ×4 | `<div rounded-2xl bg-white border>` | `<Card variant="outlined" padding="none" className="rounded-2xl ...">` ×4 |
| `QuarterlyRoadmap.tsx` | Outer container | `<div rounded-2xl bg-white border>` | `<Card variant="outlined" padding="none" className="rounded-2xl ...">` |
| `UseCaseDetailPanel.tsx` | "Editar scores" / "Cancelar" / "Guardar" | `<button bg-navy-metallic/border>` ×3 | `<Button variant="primary|ghost|primary" size="sm">` ×3 |
| `UseCaseDetailPanel.tsx` | "Clasificar ahora" | `<button bg-navy-metallic>` | `<Button variant="primary">` |
| `UseCaseDetailPanel.tsx` | "Reclasificar" | `<button bg-navy-metallic>` | `<Button variant="secondary" size="sm">` |
| `UseCaseDetailPanel.tsx` | Roadmap quarter chip | `<span px-2 py-0.5 bg-navy/8 text-navy>` | `<Badge shape="pill" size="xs" style={rgba}>` |
| `UseCaseDetailPanel.tsx` | AI Act risk badge-button | `<button $badgeBg $badgeText>` | `<button className="hover:opacity-80"><Badge style={hex22/hex}></button>` |
| `UseCaseDetailPanel.tsx` | Score composite card | `<div rounded-2xl bg-warm-50 border>` | `<Card variant="flat" padding="none" className="...">` |
| `UseCaseDetailPanel.tsx` | Score preview card | `<div rounded-xl bg-navy/5 border>` | `<Card variant="flat" padding="none" className="...">` |
| `UseCaseDetailPanel.tsx` | Stakeholder score cards | `<div rounded-xl border bg-white>` | `<Card variant="outlined" padding="none" className="rounded-xl ...">` |
| `UseCaseDetailPanel.tsx` | T1/T2/CatIA context cards ×3 | `<div rounded-2xl border bg-white>` ×3 | `<Card variant="outlined" padding="none" className="rounded-2xl ...">` ×3 |
| `UseCaseDetailPanel.tsx` | "Respuestas cuestionario" card | `<div rounded-2xl border bg-warm-50>` | `<Card variant="outlined" padding="none" className="rounded-2xl ...">` |
| `UseCaseDetailPanel.tsx` | "Obligaciones regulatorias" card | `<div rounded-2xl border bg-white>` | `<Card variant="outlined" padding="none" className="rounded-2xl ...">` |
| `UseCaseDetailPanel.tsx` | Notas consultor card | `<div rounded-2xl bg-warm-50 border>` | `<Card variant="flat" padding="none" className="...">` |
| `UseCaseDetailPanel.tsx` | Roadmap: 5 inputs + 2 textareas | `<label>` sin htmlFor + `<input/textarea>` | `<FormField id="rm-*" label="..." [type="date"] [multiline rows]>` |
| `UseCaseDetailPanel.tsx` | T1 dimension chips | `<span px-2 bg-navy/8 text-navy>` | `<Badge shape="pill" size="xs" style={rgba(42,40,34,0.08)}>` |
| `UseCaseDetailPanel.tsx` | T1 weak dimension chips | `<span bg-warning-light text-warning-dark>` | `<Badge variant="warning" shape="pill" size="xs">` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `PriorityMatrix.tsx` | Todo | SVG interactivo con radialGradient, dots, hover tooltip. Excluido por instrucciones. |
| `T4ScoreEditors.tsx` | Todo | ScoreInput = slider continuo de dominio (range 0-100 con barra visual custom). Instrucción explícita: no forzar a ningún componente. |
| `UseCaseDetailPanel.tsx` | Status toggle buttons (×5) | Botones de acción con side-effect (triggering AIAct modal). Color por opción viene de Tailwind classes sin hex equivalente. No son SegmentedControl (action triggers, no meros toggles). |
| `UseCaseDetailPanel.tsx` | Score hero recommendation badge | `recommendation.badgeBg/badgeText` son Tailwind classes (no hex). Sin equivalente en `BadgeVariant`. |
| `UseCaseDetailPanel.tsx` | Go/No-Go decision card | Border/background condicional por `decision` (3 estilos distintos). Data-driven de dominio. |
| `UseCaseDetailPanel.tsx` | Tab buttons ×5 | `px-4 py-1.5 rounded-xl` TabButton pattern. 5º consumidor del patrón TabButton (ya listado como deuda en §4). No extraer hasta decisión de DS TabButton. |
| `UseCaseDetailPanel.tsx` | Roadmap quarter buttons | Estado nullable: click en quarter activo → `undefined`. SegmentedControl no soporta null. Instrucción explícita. |
| `EconomicsTab.tsx` | Mode toggle pills (benchmark/manual ×3) | `px-2 py-0.5 text-[9px]` micro-controles inline en headers de campos. Tamaño distinto de Button xs. Sin a11y issue (labels de texto). |
| `EconomicsTab.tsx` | Hourly rate preset buttons ×3 | Option picker con labels largos + hint text. SegmentedControl no soporta descriptions por opción. |
| `EconomicsTab.tsx` | Compact number inputs (w-20, w-24) | Inputs inline de ancho fijo dentro de display rows. FormField (w-full, h-10) rompería el layout. |
| `AIActClassificationModal.tsx` | Question buttons P1 (×9 opciones) / P2 (×3 opciones largas) | Estado inicial nullable ('') + P1 demasiados opciones para SegmentedControl visualmente. Instrucción explícita: nullable → no SegmentedControl. |
| `AIActClassificationModal.tsx` | P3/P4 question buttons | Estado inicial nullable (''/null). Instrucción explícita: nullable → no SegmentedControl. |
| `QuarterlyRoadmap.tsx` | Status badges en quarter cards | `statusCfg.badgeBg/badgeText` Tailwind classes (no hex). |
| `QuarterlyRoadmap.tsx` | Quarter use-case buttons (content cards) | Cards clickables con estado visual complejo (active/inactive/hover). No CTAs. |

#### Hardcodes ad-hoc residuales en T4

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `PriorityMatrix.tsx` | SVG completo | 11+ hex en SVG data viz — intencional |
| `UseCaseDetailPanel.tsx` | ~5 `<button>` | Status toggles (action buttons con domain color), tabs (TabButton pattern), Go/No-Go card |
| `UseCaseDetailPanel.tsx` | 1 badge div | Score recommendation badge (no hex en config) |
| `EconomicsTab.tsx` | ~9 `<button>` | Mode toggle pills (×3 grupos de 2) + preset buttons (×3) |
| `EconomicsTab.tsx` | ~6 `<input>` | Compact number inputs inline (w-20/w-24) |
| `AIActClassificationModal.tsx` | ~17 `<button>` | Question option buttons P1-P4 (estado inicial nullable) |
| `QuarterlyRoadmap.tsx` | ~N `<button>` + ~N `<span>` | Content cards clickables + status badge spans (Tailwind classes) |

#### Watch-list disparada

**TabButton pattern: ≥5 consumidores en T4** — `UseCaseDetailPanel` tab navigation (5 tabs: scoring/economia/roadmap/contexto/regulatorio) usa el mismo patrón `px-4 py-1.5 rounded-xl text-xs font-semibold border` que T6/T7/T8/T11. Ahora **5 consumidores** (T4 + los 4 del inventario original). → **CERRADO en §10.1.**

---

## 10. Tabs DS — TabButton formalizado (2026-06-04)

### §10.1 — Tabs component: watchitem cerrado

`TabButton` pattern (5 copias) → `<Tabs variant="pill">` en `src/shared/design-system/components/Tabs.tsx`.

#### Cambios
| Fichero | Antes | Después |
|---------|-------|---------|
| `T4/UseCaseDetailPanel.tsx` | `<button className="px-4 py-1.5 rounded-xl...">` × 5 | `<Tabs aria-label="..." value={tab} onChange={...} tabs={[...]}>` |
| `T6/T6View.tsx` | Función `TabButton` inline + 2 instancias | `<Tabs>` DS; función inline eliminada |
| `T7/T7View.tsx` | `import { TabButton } from './components/T7Tabs'` + 3 instancias | `<Tabs>` DS |
| `T8/T8View.tsx` | `import { TabButton } from './components/T8Tabs'` + 4 instancias | `<Tabs>` DS |
| `T11/T11View.tsx` | `import { TabButton } from './components/TabButton'` + 5 instancias | `<Tabs>` DS |

#### Ficheros eliminados
- `src/modules/T7_AdoptionHeatmap/components/T7Tabs.tsx` — solo exportaba TabButton
- `src/modules/T8_CommunicationMap/components/T8Tabs.tsx` — solo exportaba TabButton
- `src/modules/T11_OperatingRhythm/components/TabButton.tsx` — solo exportaba TabButton

#### Tabs DS — API
```tsx
<Tabs
  aria-label="..."       // requerido, para role="tablist"
  value={activeTab}      // controlado
  onChange={setActiveTab}
  variant="pill"         // 'pill' | 'underline'; default='pill'
  tabs={[
    { value: 'x', label: 'Etiqueta', badge?: string|number, icon?: ReactNode, disabled?: boolean }
  ]}
/>
```

#### A11y
- `role="tablist"` + `aria-label` en el contenedor
- Cada botón: `role="tab"` + `aria-selected` + `aria-controls` + `id`
- Roving tabindex: solo el tab activo tiene `tabIndex=0`; resto `-1`
- Teclado: ArrowLeft/Right/Up/Down (circular), Home (primero), End (último) → activación automática + focus
- `focus-visible:ring-2 focus-visible:ring-navy/50`

### §10.2 — Patrón `border-b-2` (tabs underline): investigación

**Consumidores en el codebase:**
- `src/shared/design-system/components/Tabs.tsx:66` — variante `underline` del DS Tabs (ya existía antes)
- `src/modules/T3_ValueStreamMap/components/ProcessDetailPanel.tsx:141` — navegación Oportunidades/Etapas

**Veredicto: 1 consumidor ad-hoc + 1 en DS.**

El `border-b-2` de `ProcessDetailPanel` es exactamente el patrón `variant="underline"` del DS Tabs:
```tsx
// T3 ProcessDetailPanel — ad-hoc actual
'px-4 py-3 text-xs font-medium border-b-2 transition-colors'
// DS Tabs variant="underline"
'px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors'
```
Diferencias menores: `py-3` vs `py-2.5`, `text-xs` vs `text-sm`. **No hay un 2º consumidor independiente**: es solo T3 ProcessDetailPanel. **Con 1 consumidor, el umbral de extracción (2) no se alcanza todavía.** Dejarlo como está y migrar si aparece un 2º.

### §10.3 — Tabs `variant="underline"` ✅ CERRADO (2026-06-04)

T3 `ProcessDetailPanel` migrado a `<Tabs variant="underline">`. DS Tabs actualizado para "sin cambio visual":
- `UNDERLINE_BASE = 'px-4 py-3 text-xs font-medium border-b-2 transition-colors'` (era `py-2.5 text-sm -mb-px`)
- `UNDERLINE_ACTIVE = 'border-navy text-lean-black dark:text-gray-100'` (era `text-navy`)
- `navClass underline = 'flex gap-0'` — sin `border-b`; el wrapper del consumidor lo provee (`<div className="border-b border-border dark:border-white/6 px-8">`)

**Regla de migración establecida**: el variant `underline` de Tabs NO incluye su propio `border-b` — el consumidor provee la línea separadora en su wrapper. Esto evita que el borde quede recortado por el padding horizontal del contenedor.

---

## 11. Estado de migración al Design System — T5 (2026-06-04)

### §11.1 — T5 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T5View.tsx` | Botón "Volver" | `<button text-sm text-text-muted>` + SVG | `<Button variant="link" icon={<svg>}>Volver</Button>` |
| `T5View.tsx` | Badge "T5" | `<span px-2 py-0.5 bg-navy text-white rounded-full>` | `<Badge variant="navy" shape="pill" size="xs" className="font-bold">T5</Badge>` |
| `MaturityBadge.tsx` | Componente completo | `<span $badgeBg $badgeText rounded-full>` + dot inline | `<Badge style={{ bg: hex22, color: hex }}><span dot/>{label}</Badge>` |
| `DomainCard.tsx` | Outer card | `<div rounded-2xl bg-white border p-5>` | `<Card variant="outlined" padding="none" className="rounded-2xl p-5 flex flex-col gap-4">` |
| `DomainCard.tsx` | Rec + score sub-card | `<div rounded-xl border bg-gray-50>` | `<Card variant="flat" padding="none" className="... bg-gray-50 ...">` |
| `DomainCard.tsx` | Governance card | `<div rounded-xl border bg-gray-50/50>` | `<Card variant="flat" padding="none" className="... bg-gray-50/50 ...">` |
| `DomainCard.tsx` | Rec badge | `<span $badgeBg $badgeText rounded-full>` + dot | `<Badge style={hex22/hex} shape="pill" size="sm">` + dot span child |
| `DomainCard.tsx` | "Editar" button | `<button bg-navy-metallic>` | `<Button variant="primary" size="sm">` |
| `EditModal.tsx` | Wrapper modal | `<div fixed inset-0 z-50>` | `<Modal open title size="lg" footer={...}>` |
| `EditModal.tsx` | Cancel + Save buttons | `<button border>` + `<button bg-navy-metallic>` | `<Button variant="ghost\|primary" size="sm">` ×2 |
| `EditModal.tsx` | Preview card | `<div rounded-xl border bg-gray-50>` | `<Card variant="flat" padding="none" className="...">` |
| `EditModal.tsx` | Preview rec badge | `<span $badgeBg $badgeText>` + dot | `<Badge style={hex22/hex} shape="pill" size="sm">` + dot span |
| `DomainProjectsModal.tsx` | Wrapper modal | `<div fixed inset-0 z-50>` | `<Modal open title size="lg" footer={...}>` |
| `DomainProjectsModal.tsx` | "Cerrar" button | `<button border w-full>` | `<Button variant="ghost" size="sm" fullWidth>` |
| `DomainProjectsModal.tsx` | UC item cards ×N | `<div rounded-xl border bg-gray-50>` | `<Card variant="flat" padding="none" className="...">` |
| `DomainProjectsModal.tsx` | T3 proc cards ×N | `<div rounded-xl border bg-gray-50>` | `<Card variant="flat" padding="none" className="...">` |
| `DomainProjectsModal.tsx` | UC status badges | `<span $style.bg $style.text rounded-full text-[9px]>` | `<Badge variant={UC_STATUS_VARIANT} shape="pill" size="xs">` |
| `DeptCategoryModal.tsx` | Wrapper modal | `<div fixed inset-0 z-50>` | `<Modal open title size="lg" footer={...}>` |
| `DeptCategoryModal.tsx` | "Cerrar" button | `<button border w-full>` | `<Button variant="ghost" size="sm" fullWidth>` |
| `DeptCategoryModal.tsx` | Quadrant summary card | `<div rounded-xl border bg-gray-50>` | `<Card variant="flat" padding="none" className="...">` |
| `DeptCategoryModal.tsx` | Rec badge | `<span $badgeBg $badgeText>` + dot | `<Badge style={hex22/hex}>` + dot span |
| `DeptCategoryModal.tsx` | UC item cards ×N | `<div rounded-xl border bg-gray-50>` | `<Card variant="flat" padding="none" className="...">` |
| `DeptCategoryModal.tsx` | T3 proc cards ×N | `<div rounded-xl border bg-gray-50>` | `<Card variant="flat" padding="none" className="...">` |
| `DeptCategoryModal.tsx` | UC status badges | `<span $style.bg $style.text>` | `<Badge variant={UC_STATUS_VARIANT} shape="pill" size="xs">` |
| `ActivationSequence.tsx` | Outer container | `<div rounded-2xl bg-white border p-5>` | `<Card variant="outlined" padding="none" className="rounded-2xl p-5">` |
| `PortfolioMatrix.tsx` | Outer container | `<div rounded-2xl bg-white border p-5>` | `<Card variant="outlined" padding="none" className="rounded-2xl p-5">` |
| `t5StatusMaps.ts` | UC_STATUS_VARIANT | (nuevo) | `Record<string, BadgeVariant>` — elimina dependencia de Tailwind classes |
| `t5StatusMaps.ts` | UC_COMPLETADO_STYLE | (nuevo) | `{ backgroundColor: rgba(42,40,34,0.1), color: '#2A2822' }` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `T5DimBars.tsx` | Todo | Progress bars data viz con hex inline — excluido por reglas |
| `PortfolioMatrix.tsx` | Domain chips (burbujas) | Visualización posicional absolutamente posicionada, con inline styles de posición/tamaño/hex. Núcleo visual de T5. |
| `PortfolioMatrix.tsx` | Tabla de adopción por departamento | Data viz con dots clickables. Inline styles de hex. |
| `ActivationSequence.tsx` | Domain sequence buttons | Content cards interactivos con inline style de colores de dominio. |
| `EditModal.tsx` | Sliders de evaluación | Domain score input (como T4 ScoreEditors) — range input con accentColor hex. Instrucción explícita. |
| `DomainCard.tsx` | Governance notes (warning callout) | Callout específico de dominio con `bg-warning-light/40 border-warning-dark/20`. |

#### Hardcodes ad-hoc residuales en T5

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `PortfolioMatrix.tsx` | ~15 `style={}` | Domain chips posicionadas, dot buttons viz, hex inline |
| `ActivationSequence.tsx` | ~6 `<button>` | Domain sequence cards interactivas |
| `EditModal.tsx` | ~N `<input type="range">` | Sliders con accentColor hex |
| `DomainCard.tsx` | 1 `<div>` | Governance notes warning callout |

#### Verificación de hipótesis

**¿T5 requirió piezas/variants nuevos?**
NO. T5 se migró con los 7 componentes existentes (Button, FormField, Card, Badge, Modal, SegmentedControl, Tabs). No hubo necesidad de nuevos variants o componentes. Los únicos añadidos fueron en `t5StatusMaps.ts`: `UC_STATUS_VARIANT` (Record de BadgeVariant) y `UC_COMPLETADO_STYLE` — ambos son datos de dominio, no DS.

**¿Disparó watch-items?**

- **Rec/Maturity badge con hex inline** (T5): `style={{ backgroundColor: hex22, color: hex }}` + dot como span child — patrón que ya existía en T3 (`CategoryBadge`), T4 (`CategoryBadge`). Ahora **T5 añade 4 más**. El patrón está estabilizado.
- **`fullWidth` en Button** (T5 modales): `<Button fullWidth>Cerrar</Button>` — primer consumidor de `fullWidth` en modo `size="sm"`. Solo 1 consumidor. Bajo umbral.
- **No hay toggle nullable nuevo**: T5 no tiene ningún toggle exclusivo — los domain chips son contenido clickable (selección con side-effect), no toggles de valor. SegmentedControl no se usó.
- **Tabs `variant="underline"`: 1 consumidor (T3)** — umbral de extracción no alcanzado para nuevos consumidores.

---

## 12. Estado de migración — T6 (2026-06-04)

### §12.1 — T6 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T6View.tsx` | Botón "Volver" | `<button text-sm text-text-muted>` + SVG | `<Button variant="link" size="sm" icon={<svg>}>Volver</Button>` |
| `T6View.tsx` | Badge "T6" | `<span px-2 py-0.5 bg-navy text-white rounded-full>` | `<Badge variant="navy" shape="pill" size="xs" className="font-bold">T6</Badge>` |
| `T6View.tsx` | highRisk pill | `<span bg-orange-100 text-orange-700 rounded-full>` | `<Badge variant="warning" shape="pill">🔴 N casos alto riesgo</Badge>` |
| `T6View.tsx` | unclassified pill | `<span bg-gray-100 text-gray-500 rounded-full>` | `<Badge variant="default" shape="pill">⬜ N sin clasificar</Badge>` |
| `T6View.tsx` | "✦ Generada con IA" pill | `<span bg-amber-100 text-amber-700 rounded-full>` | `<Badge variant="warning" shape="pill" size="xs">✦ Generada con IA · sector</Badge>` |
| `T6View.tsx` | Cobertura AI Act container | `<div rounded-2xl border border-border bg-white>` | `<Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">` |
| `T6View.tsx` | Tabla casos container | `<div rounded-2xl border border-border bg-white overflow-hidden>` | `<Card variant="outlined" padding="none" className="rounded-2xl overflow-hidden">` |
| `T6View.tsx` | "Ver todos ×" | `<button text-[10px] text-navy hover:underline>` | `<Button variant="link" size="xs">Ver todos ×</Button>` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `T6View.tsx` | ShadowAICard outer wrapper | Necesita `style={{ backgroundColor, borderColor }}` con hex data-driven. Card puede aceptar style vía spread de props HTML, pero el pattern es claro con el div+style actual. Semánticamente es un card especial de alerta. |
| `T6View.tsx` | KPI filter buttons (nivel riesgo) | `cfg.badgeBg/badgeText` son Tailwind classes (sin hex). Botones interactivos con active state visual. No son DS Badge. |
| `T6View.tsx` | Risk badge en tablas | `riskCfg.badgeBg/badgeText` Tailwind classes sin hex equivalente — no migrable a DS Badge. |
| `PolicyTab` | Documento de política completo | El `<div id="lean-policy-document">` es contenido imprimible con secciones, tablas y estilos `print:`. Migrar los divs internos a Card rompería los estilos de impresión. |
| `PolicyTab` | "Generar política con IA" button | Color amber personalizado (borde-amber-300, bg-amber-50, text-amber-700). Sin equivalent DS variant. Patrón amber CTA recurrente en T6. |
| `PolicyTab` | "Volver a plantilla" button | `text-text-subtle hover:text-red-500` — hover danger específico, no cubierto por `variant="link"` (que usa navy). |

#### Hardcodes ad-hoc residuales en T6

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `T6View.tsx` | ShadowAICard wrapper | `style={{ backgroundColor, borderColor }}` amber data-driven |
| `T6View.tsx` | ~5 KPI filter `<button>` | Tailwind class-based color por nivel de riesgo |
| `T6View.tsx` | Risk badges en tabla | `riskCfg.badgeBg/badgeText` Tailwind |
| `PolicyPDF.tsx` | 35 hex | PDF rendering — excluido explícitamente |
| `PolicyTab` | 2 `<button>` | Amber CTA + volver-a-plantilla |

---

## 13. Estado de migración — T7 (2026-06-04)

### §13.1 — T7 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T7View.tsx` | Botón "Volver al dashboard" | `<button text-xs text-text-muted>` + SVG | `<Button variant="link" size="sm" icon={<svg>}>` |
| `T7View.tsx` | Badge "T7" | `<span px-2.5 py-1 rounded-lg bg-navy text-white>` | `<Badge variant="navy" shape="pill" size="xs" className="font-bold font-mono uppercase tracking-wider">T7</Badge>` |
| `T7View.tsx` | Stat card Stakeholders | `<div text-center px-3 py-2 rounded-lg bg-gray-50 border>` | `<Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-white/6">` |
| `T7View.tsx` | Stat card Adoptantes | `<div text-center px-3 py-2 rounded-lg bg-success-light border>` | `<Card variant="flat" padding="none" className="... bg-success-light border border-success-light">` |
| `T7View.tsx` | Stat card Resistentes | `<div text-center px-3 py-2 rounded-lg bg-danger-light border>` | `<Card variant="flat" padding="none" className="... bg-danger-light border border-danger-light">` |
| `T7View.tsx` | Empty state | `<div rounded-xl border bg-white p-12 text-center>` | `<Card variant="outlined" padding="none" className="rounded-xl p-12 text-center">` |
| `T7BellCurveTab.tsx` | SVG wrapper | `<div flex-1 rounded-xl border bg-white overflow-hidden>` | `<Card variant="outlined" padding="none" className="flex-1 min-w-0 rounded-xl overflow-hidden">` |
| `T7MomentumCard.tsx` | Card wrapper | `<div w-52 rounded-xl border bg-white p-4>` | `<Card variant="outlined" padding="none" className="w-52 flex-shrink-0 rounded-xl p-4 space-y-4">` |
| `T7MomentumCard.tsx` | Momentum badge | `<span ${momentumLevel.bg} ${momentumLevel.color}>` | `<Badge variant={pct>=65?'success':pct>=40?'warning':'danger'} size="xs">` |
| `T7CondensedCard.tsx` | Card wrapper | `<div relative rounded-xl border bg-white p-5 shadow-sm>` | `<Card variant="outlined" padding="none" className="relative rounded-xl p-5 shadow-sm">` |
| `T7DeptRecommendationsTab.tsx` | Dept cards ×N | `<div rounded-xl border bg-white p-5>` | `<Card variant="outlined" padding="none" className="rounded-xl p-5">` |
| `T7DeptRecommendationsTab.tsx` | Readiness badge | `<span ${readiness.color} rounded-full>` | `<Badge variant={pct>=75?'success':pct>=40?'warning':'danger'} shape="pill" size="xs">` |
| `T7PlanPhaseCard.tsx` | Phase card wrapper | `<div rounded-xl border bg-white p-6>` | `<Card variant="outlined" padding="none" className="rounded-xl p-6">` |
| `T7PlanPhaseCard.tsx` | Segment chips | `<span text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-text-muted>` | `<Badge variant="default" shape="pill" size="xs">` |
| `T7ChangeManagementPlanTab.tsx` | "Restaurar plantilla" | `<button border hover:bg-gray-50>` | `<Button variant="ghost" size="sm">` |
| `T7ChangeManagementPlanTab.tsx` | "Generar plan con IA" | `<button bg-navy text-white disabled:bg-gray-100>` + spinner manual | `<Button variant="primary" size="sm" loading={isGenerating} icon={<svg>}>` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `T7BellCurveTab.tsx` | SVG Bell Curve | Visualización SVG compleja — excluida por instrucciones |
| `T7BellCurveTab.tsx` | Spotlight filter chips (dept) | Data-driven hex de `deptFill()`. Buttons con inline style activo. No son DS Button (son filter chips con color por departamento). |
| `T7CondensedCard.tsx` | Close `×` button | `w-6 h-6` (24px). `Button size="xs"` = 28px rompe layout. Microcontrol in-card. |
| `T7CondensedCard.tsx` | Dept/Archetype/Resistance badge spans | `deptCfg().badgeBg/badgeText`, `arcCfg.badgeBg/badgeText`, `resCfg.color` — Tailwind class strings sin hex. No migrable a DS Badge sin añadir hex a las configs. |
| `T7DeptRecommendationsTab.tsx` | Stakeholder mini-chips | `flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border` — chip con archetype badge Tailwind class. |
| `T7DeptRecommendationsTab.tsx` | Archetype badge dentro mini-chip | `arcCfg.badgeBg/badgeText` Tailwind. |
| `T7ChangeManagementPlanTab.tsx` | LLM indicator badge (`bg-navy/8 text-navy`) | Tint-navy pattern (`bg-navy/10 opacity text-navy`). Badge `variant="navy"` = solid navy text-white. Visual diferente. Patrón recurrente en T7/T8 pero sin DS variant equivalente. |
| `T7ChangeManagementPlanTab.tsx` | Error callout div | `bg-danger-light/30 border border-danger-light`. Card flat sería igual — deuda menor. |
| `T7PlanPhaseCard.tsx` | Phase label pill | `bg-navy/10 dark:bg-navy/20 text-navy` — tint-navy (10% opacity). Badge navy = solid. Visual diferente. |
| `T7PlanPhaseCard.tsx` | Action number circles | `w-4 h-4 rounded-full bg-navy/10 text-navy`. Numbered circles en list, no badges. |
| `T7PlanPhaseCard.tsx` | Risk callout | `bg-danger-light/30 border border-danger-light` — domain-specific alert. |

#### Hardcodes ad-hoc residuales en T7

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `T7BellCurveTab.tsx` | SVG completo + 10 hex | Visualización data viz — intencional |
| `T7BellCurveTab.tsx` | ~N `<button>` dept | Filter chips con color data-driven |
| `T7CondensedCard.tsx` | 3 `<span>` badge | Tailwind class-based department/archetype/resistance |
| `T7DeptRecommendationsTab.tsx` | Stakeholder mini-chips | Archetype badge Tailwind inline |
| `T7PlanPhaseCard.tsx` | Phase label pill + circles + risk callout | Tint-navy pattern + specialized UI |
| `T7ChangeManagementPlanTab.tsx` | LLM indicator div | Tint-navy pattern |

---

## 14. Estado de migración — T8 (2026-06-04)

### §14.1 — T8 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T8View.tsx` | Botón "Volver al dashboard" | `<button text-xs text-text-muted>` + SVG | `<Button variant="link" size="sm" icon={<svg>}>` |
| `T8View.tsx` | Badge "T8" | `<span px-2.5 py-1 rounded-lg bg-navy text-white>` | `<Badge variant="navy" shape="pill" size="xs" className="font-bold font-mono">T8</Badge>` |
| `T8View.tsx` | Stat cards ×4 | `<div text-center px-3 py-2 rounded-lg ...>` ×4 | `<Card variant="flat" padding="none" className="...">` ×4 |
| `T8View.tsx` | "Restaurar plantilla" | `<button border hover:bg-gray-50>` | `<Button variant="ghost" size="sm">` |
| `T8View.tsx` | "Personalizar/Regenerar con IA" | `<button bg-navy text-white disabled:bg-gray-100>` + spinner manual | `<Button variant="primary" size="sm" loading={isGenerating} icon={<svg>}>` |
| `T8View.tsx` | Empty state | `<div rounded-xl border bg-white p-12 text-center>` | `<Card variant="outlined" padding="none" className="rounded-xl p-12 text-center">` |
| `T8TimelineTab.tsx` | Action cards ×N | `<div rounded-xl border bg-white p-5>` | `<Card variant="outlined" padding="none" className="rounded-xl p-5">` |
| `T8TimelineTab.tsx` | Meta chips ×4/acción (audience/channel/type/owner) | `<span bg-gray-50 border rounded-full text-[10px]>` | `<Badge variant="default" shape="pill" size="xs">` |
| `T8ArchetypeMessagesTab.tsx` | Headline card | `<div rounded-xl border bg-white p-5>` | `<Card variant="outlined" padding="none" className="rounded-xl p-5">` |
| `T8ArchetypeMessagesTab.tsx` | Key points card | `<div rounded-xl border bg-white p-5>` | `<Card variant="outlined" padding="none" className="rounded-xl p-5">` |
| `T8ArchetypeMessagesTab.tsx` | "No decir" card | `<div rounded-xl border border-danger-light bg-danger-light/20 p-4>` | `<Card variant="flat" padding="none" className="rounded-xl border border-danger-light bg-danger-light/20 p-4">` |
| `T8ArchetypeMessagesTab.tsx` | "Apertura 1:1" card | `<div rounded-xl border bg-white p-4>` | `<Card variant="outlined" padding="none" className="rounded-xl p-4">` |
| `T8ArchetypeMessagesTab.tsx` | Resistance note callout | `<div rounded-xl border bg-gray-50 p-4>` | `<Card variant="flat" padding="none" className="rounded-xl border border-border dark:border-white/6 bg-gray-50 dark:bg-gray-800/50 p-4 flex items-start gap-3">` |
| `T8MaterialsTab.tsx` | Content wrapper | `<div flex-1 rounded-xl border bg-white overflow-hidden>` | `<Card variant="outlined" padding="none" className="flex-1 min-w-0 rounded-xl overflow-hidden">` |
| `T8MaterialsTab.tsx` | Tag chips | `<span text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-text-muted>` | `<Badge variant="default" shape="pill" size="xs">` |
| `T8DeptKitTab.tsx` | Kit cards ×N | `<div rounded-xl border bg-white p-5 space-y-4>` | `<Card variant="outlined" padding="none" className="rounded-xl p-5 space-y-4">` |
| `T8DeptKitTab.tsx` | Readiness badge | `<span ${readinessBg} text-[10px] font-semibold rounded-full>` | `<Badge variant={readiness>=65?'success':readiness>=35?'warning':'danger'} shape="pill" size="xs">` |
| `T8DeptKitTab.tsx` | Approach callout | `<div p-3 rounded-lg bg-gray-50 border>` | `<Card variant="flat" padding="none" className="p-3 rounded-lg border border-border dark:border-white/6 bg-gray-50 dark:bg-gray-800/50">` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `T8View.tsx` | "Personalizado con IA" indicator (`bg-navy/8 text-navy`) | Tint-navy pattern — mismo que T7. Sin DS variant equivalente. |
| `T8TimelineTab.tsx` | Phase header divs | `${cfg.bg} border ${cfg.border}` = Tailwind classes de dominio por fase. Son section dividers, no contenedores de contenido. |
| `T8TimelineTab.tsx` | Phase filter buttons (Todas / fase1 / fase2 / fase3) | Filtros con estado siempre seleccionado (default 'all'). El botón "Todas" usa `bg-navy-metallic`. Los botones de fase usan `${cfg.bg} ${cfg.color} ${cfg.border}` Tailwind de dominio. No SegmentedControl (colores por opción distintos). |
| `T8TimelineTab.tsx` | Priority badge `${priCfg.color}` | Tailwind class string de dominio sin hex. |
| `T8TimelineTab.tsx` | Material chips (navy tint) | `text-navy bg-navy/8` — tint-navy pattern. |
| `T8ArchetypeMessagesTab.tsx` | Archetype sidebar buttons | Layout de sidebar con avatar circular + texto. No son CTAs de acción — son navegación de selección. Avatar usa `style={{ backgroundColor: hex }}` (hex local de archetype). |
| `T8ArchetypeMessagesTab.tsx` | Action number circles | `w-5 h-5 rounded-full bg-navy/10 text-navy`. Numbered circles en list. |
| `T8MaterialsTab.tsx` | Sidebar selection buttons | Layout de sidebar con icon + título/subtítulo. Navegación de selección. |
| `T8DeptKitTab.tsx` | Concern callout | `bg-warning-light/40 border border-warning-light` — domain-specific warning. |
| `T8DeptKitTab.tsx` | Ambassador chips (indigo) | `bg-indigo-100 text-indigo-700` — indigo. Sin DS variant equivalente. |
| `T8DeptKitTab.tsx` | Action number circles | `style={{ backgroundColor: color }}` con hex data-driven de dept. |
| `T8CopyButton.tsx` | Todo | Componente con dos estados (copy/copied). Estado copied = success colors. CopyButton tiene behavior específico; migrar a Button requeriría className override complicado para el estado success. Deuda menor. |

#### Hardcodes ad-hoc residuales en T8

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `T8View.tsx` | "Personalizado con IA" indicator | Tint-navy pattern |
| `T8TimelineTab.tsx` | Phase filter `<button>` ×4 | Tailwind class-based por fase |
| `T8TimelineTab.tsx` | Priority badge | `priCfg.color` Tailwind |
| `T8TimelineTab.tsx` | Material chips | Tint-navy pattern |
| `T8ArchetypeMessagesTab.tsx` | Sidebar buttons + action circles | Navegación + numbered bullets |
| `T8MaterialsTab.tsx` | Sidebar selection buttons | Navegación de material |
| `T8DeptKitTab.tsx` | Concern callout + ambassador chips + action circles | Specifics de dominio |
| `T8CopyButton.tsx` | Completo | Copy button con estado success |

---

## 15. Verificaciones de hipótesis — Lote T6/T7/T8 (2026-06-04)

### ¿Algún módulo necesitó piezas/variants nuevos?

**NO. Sustitución pura.** T6, T7 y T8 se migraron con los 7 componentes existentes. Ningún variant nuevo fue necesario.

La función `momentumVariant` y `readinessVariant` son derivaciones locales de datos de dominio a `BadgeVariant` existentes — no añaden nada al DS.

### ¿El Badge "tintado + dot" es candidato a prop `dotColor`?

El patrón `<Badge style={{ backgroundColor: hex+'22', color: hex }}><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: hex }} /></Badge>` existe en:
- T5 `MaturityBadge.tsx` — 1 instancia
- T5 `DomainCard.tsx` — 2 instancias (rec badge + inline rec card)
- T5 `EditModal.tsx` — 1 instancia
- T5 `DeptCategoryModal.tsx` — 1 instancia

**T6, T7, T8 NO añaden instancias de este patrón.** El conteo permanece en 5 instancias, todas en T5. Las migraciones de T6/T7/T8 usan `variant=` semántico (success/warning/danger/default/navy) sin dot.

**Veredicto**: 5 instancias idénticas, todas en T5. La repetición es suficiente para candidatura. Propuesta: añadir prop `dot?: boolean` + `dotStyle?: React.CSSProperties` a Badge. Al llegar a T9/T10/T11 si se reutiliza el patrón → cerrar con prop nueva.

### ¿Algún watch-item alcanzó 2º consumidor?

| Watch-item | Estado |
|-----------|--------|
| `Button fullWidth` | T5 = 2 instancias (DomainProjectsModal + DeptCategoryModal). T6/T7/T8 = 0 nuevas. Total: 2. **Umbral alcanzado en T5.** Patron establecido, no requiere extracción adicional. |
| `FormField ancho compacto` | T6/T7/T8 no usan FormField. Sigue sin 2º consumidor. |
| `toggle text-[9px]` | T6/T7/T8 no añaden toggles de este tipo. |
| `Badge "tintado + dot"` | T6/T7/T8 = 0 instancias nuevas. Sigue en 5, todas T5. |

**Resultado: ningún watch-item alcanza umbral nuevo en este lote.** El `Button fullWidth` ya tenía 2 consumidores en T5; T6/T7/T8 no lo usan.

---

## 16. Estado de migración — T9 (2026-06-04)

### §16.1 — T9 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T9View.tsx` | Función `Badge` local (helper hex-color) | `function Badge({ label, bg, color })` con `<span style={{...}}>` | Eliminada. Todas las instancias → DS `<Badge shape="pill" size="xs" style={{ backgroundColor, color }}>` |
| `T9View.tsx` | statusBadge (×2, ai y free) | `<Badge label bg color>` → JSX variable | `<Badge shape="pill" size="xs" style={...}>{label}</Badge>` |
| `T9View.tsx` | Source + Risk badges inline (×2 cada uno) | `<Badge label bg color>` local | DS `<Badge shape="pill" size="xs" style={...}>` |
| `T9View.tsx` | Department chip | `<span bg-gray-100 rounded-full text-[10px]>` | `<Badge variant="default" shape="pill" size="xs" className="shrink-0">` |
| `T9View.tsx` | Botón back | `<button text-xs text-text-muted>` + SVG | `<Button variant="link" size="sm" icon={<svg>}>` |
| `T9View.tsx` | "Crear snapshot" | `<button bg-navy-metallic text-white>` | `<Button variant="primary" size="sm">` |
| `T9View.tsx` | "+ Añadir iniciativa" | `<button bg-navy-metallic text-white>` | `<Button variant="primary" size="sm" onClick={...}>` |
| `T9View.tsx` | Stat cards ×4 | `<div rounded-xl bg-white border>` ×4 | `<Card variant="outlined" padding="none" className="rounded-xl px-5 py-4">` ×4 |
| `T9View.tsx` | Gantt container | `<div rounded-2xl bg-white border overflow-hidden>` | `<Card variant="outlined" padding="none" className="rounded-2xl overflow-hidden">` |
| `AddFreeItemForm` | Container | `<div border-t bg-gray-50 px-5 py-4>` | `<Card variant="flat" padding="none" className="border-t ... px-5 py-4 bg-gray-50">` |
| `AddFreeItemForm` | Input "Nombre de la iniciativa *" | `<label text-[10px]>` + `<input className={INPUT_CLS}>` | `<FormField id="free-item-name" label="..." placeholder="...">` |
| `AddFreeItemForm` | Input "Departamento" | `<label text-[10px]>` + `<input className={INPUT_CLS}>` | `<FormField id="free-item-department" label="...">` |
| `AddFreeItemForm` | Input "Responsable" | `<label text-[10px]>` + `<input className={INPUT_CLS}>` | `<FormField id="free-item-responsible" label="...">` |
| `AddFreeItemForm` | "Añadir al roadmap" | `<button bg-navy-metallic disabled:opacity-40>` | `<Button variant="primary" size="sm" disabled={!form.name.trim()}>` |
| `AddFreeItemForm` | "Cancelar" | `<button border hover:bg-gray-100>` | `<Button variant="ghost" size="sm" onClick={onCancel}>` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `T9View.tsx` | T9 badge span (`bg-navy/10 text-navy`) | Tint-navy pattern (10% opacity). Badge `variant="navy"` = solid navy text-white. Visual diferente. |
| `T9View.tsx` | Year selector (prev/next buttons) | Compound control (‹ / year / ›) con estado propio. No son CTAs aislados; el triple es una unidad de control indivisible. |
| `T9View.tsx` | Gantt cabecera Q1-Q4 (colored dividers) | data viz headers con inline style (`background: bg, color: color` desde DS hex constants). No son Cards. |
| `GanttRowItem` | Responsible inline edit `<input>` | Micro-input de edición inline dentro de Gantt row (w-28). FormField sería demasiado grande para este contexto. |
| `GanttRowItem` | Responsible edit `<button>` | Trigger inline (click to edit). Micro-action dentro de Gantt row; no CTA standalone. |
| `AddFreeItemForm` | `<select>` mes inicio/fin, riesgo, estado | Native select fuera de la lista de 7 componentes DS disponibles. |

#### Hardcodes ad-hoc residuales en T9

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `T9View.tsx` | T9 badge span | Tint-navy `bg-navy/10 text-navy` |
| `T9View.tsx` | Year selector | Compound prev/next control ad-hoc |
| `T9View.tsx` | Gantt Q1-Q4 header cells | Hex data-driven colored cells |
| `GanttRowItem` | Inline edit input + button | Micro-controls en Gantt row |
| `AddFreeItemForm` | 4 `<select>` | Native selects (mes/riesgo/estado) |

#### Nota: eliminación de `INPUT_CLS`

`const INPUT_CLS = SELECT_CLS` eliminado (constante sin uso tras migrar los 3 inputs a FormField). `SELECT_CLS` permanece para los 4 selects nativos.

---

## 17. Estado de migración — T10 (2026-06-04)

### §17.1 — T10: Sin migración aplicable

T10 es el "Wow Moment" dashboard — una pantalla de 6 paneles de datos. Sus componentes usan colores **gold** (#C8860A) y **tint-amber** que no tienen equivalente en los 7 DS components disponibles:

| Componente | Patrón | Por qué no migra |
|-----------|--------|-----------------|
| `NavButton.tsx` | Link button `text-gold hover:text-gold-hover` | DS Button `variant="link"` = navy. Color gold ≠ DS variant. |
| `PanelCard.tsx` | Tag chip `${TAG_CLASSES[tagColor]}` | `purple` = `bg-[#EEEDFE] text-[#3C3489]` — sin DS BadgeVariant. Migración parcial rompería coherencia visual. |
| `EmptyStates.tsx` | CTA gold `style={{ background: '#C8860A' }}` | DS Button primary = navy-metallic. El gold es intencional como color de marca de T10. |
| `P1-P6 panels` | `NavButton` (gold link) | Usan NavButton ya extraído. No ad-hoc inline. |
| `DashboardHeader.tsx` | Read-only banner + sprint badge | Solo texto/spans. Sin buttons. |
| `HeroMetric.tsx` | Display puro | Sin interacción. |

**Conclusión**: T10 no tiene patrones migrables a los 7 DS components sin cambio visual semántico. El color gold es el design token de identidad de T10 — no se sustituye por navy.

---

## 18. Estado de migración — T11 (2026-06-04)

### §18.1 — T11 Detalle (parcial — warm dark palette bloqueante)

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T11View.tsx` | Botón "Volver al dashboard" | `<button text-xs text-text-subtle>` | `<Button variant="link" size="sm" icon={<svg>}>` |
| `T11View.tsx` | Badge "T11" | `<span bg-amber-100 text-amber-700 rounded-full text-[9px]>` | `<Badge variant="warning" shape="pill" size="xs" className="font-bold font-mono">T11</Badge>` |
| `T11View.tsx` | "Exportar modelo operativo" | `<button bg-navy text-white px-3 py-1.5>` | `<Button variant="primary" size="sm" icon={<svg>}>Exportar modelo operativo</Button>` |

#### Por qué los contenedores de T11 NO se migran a Card

T11 usa una paleta dark mode específica (`dark:bg-warm-700`, `dark:bg-warm-600`, `dark:bg-warm-800`, `dark:border-warm-500`) distinta de la paleta estándar del DS Card (`dark:bg-gray-900`, `dark:border-white/6`). Migrar los divs a Card cambiaría el color de fondo en dark mode — **regresión visual**. Los divs permanecen como están.

| Contenedor | Dark mode actual | Si usara Card outlined | Decisión |
|-----------|-----------------|----------------------|---------|
| Hero card | `dark:bg-warm-700` | `dark:bg-gray-900` | LEAVE |
| KPI strip cards | `dark:bg-warm-700` | `dark:bg-gray-900` | LEAVE |
| "How it works" card | `dark:bg-warm-700` | `dark:bg-gray-900` | LEAVE |
| SAFe note | `dark:bg-warm-800` | `dark:bg-gray-900` | LEAVE |

#### Componentes T11 — ad-hoc residual

| Componente | Qué | Razón |
|-----------|-----|-------|
| `CadenciaTab.tsx` | Event cards (`dark:bg-warm-600`) | Warm palette |
| `CadenciaTab.tsx` | Level badge spans (`${lcfg.badge} ${lcfg.badgeText}`) | Tailwind class strings |
| `CadenciaTab.tsx` | Participant chips (`dark:bg-warm-700`) | Warm palette |
| `DecisionesTab.tsx` | Decision cards (`dark:bg-warm-600`) | Warm palette |
| `DecisionesTab.tsx` | Level separator badge spans | Tailwind class strings |
| `KpisTab.tsx` | Table container (`dark:bg-warm-600`) | Warm palette |
| `KpisTab.tsx` | Source badge `style={{ backgroundColor: lcfg.hex }}` | Data-driven hex, text-white. Non-pill shape (`rounded`). Leave. |
| `ObjetivosTab.tsx` | Phase selection buttons | Data-driven active color (PHASE_COLORS[phase]). Per-item custom color → not SegmentedControl |
| `EventDetailPanel.tsx` | Frequency badge spans | Tailwind class strings |
| `EventDetailPanel.tsx` | Close ×button | `p-1.5` (12px padding) < Button xs h-7. Micro-control. |
| `AdaptiveModeBadge.tsx` | Whole component | Compound indicator (dot + label + description) with Tailwind classes per mode |
| `MaturityPill.tsx` | Display component | Data viz stars, no interaction |

---

## 19. Estado de migración — T12 (2026-06-04)

### §19.1 — T12 Detalle de migración

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `T12View.tsx` | Botón "Volver al dashboard" | `<button text-xs text-text-muted>` + SVG | `<Button variant="link" size="sm" icon={<svg>}>` |
| `T12View.tsx` | "Importar desde T6" | `<button bg-gray-100 text-text-muted hover:bg-gray-200>` | `<Button variant="ghost" size="sm" icon={<svg>}>` |
| `T12View.tsx` | "Exportar para auditor" | `<button bg-navy-metallic text-white>` | `<Button variant="primary" size="sm" icon={<svg>}>` |
| `T12View.tsx` | "Expandir todos / Colapsar todos" | `<button text-[11px] text-text-muted hover:text-lean-black>` | `<Button variant="link" size="sm" onClick={...}>` |
| `ClauseSidebar` | Progreso global card | `<div rounded-xl border border-border bg-white dark:bg-gray-900 px-4 py-3 mb-2>` | `<Card variant="outlined" padding="none" className="rounded-xl px-4 py-3 mb-2">` |
| `ControlCardWrapper` | Outer card | `<div rounded-xl border border-border bg-white dark:bg-gray-900 hover:border-border-hover>` | `<Card variant="outlined" padding="none" className="rounded-xl transition-all duration-200 [shadow-sm|hover:border-border-hover]">` |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `StatusBadge` function | `${cfg.badgeBg} ${cfg.badgeText}` | Tailwind class strings de dominio. Sin hex equivalente. |
| `ControlCardWrapper` | "← Retroceder" | Micro-action muy sutil (`text-[10px] text-text-subtle hover:bg-gray-100 px-2 py-1`). Tamaño < Button xs. Deuda menor. |
| `ControlCardWrapper` | "Avanzar" button con `style={{ backgroundColor: nextCfg.hex }}` | Data-driven hex color por estado (en_progreso/pendiente_revision/aprobado). DS Button primary = navy-metallic. No hay variant hex-configurable. |
| `ControlCardWrapper` | "✓ Control aprobado" span | Status indicator text solo. No action. |
| `T12View.tsx` | T12 badge span (`bg-navy/10 text-navy`) | Tint-navy pattern. Leave. |
| `T12View.tsx` | "T6" import source badge | violet/indigo, `text-[8px]`. Sin DS BadgeVariant. |
| `ClauseSidebar` | Clause selection buttons | Data-driven active state `backgroundColor: cfg.hex + '12'`. Navigation items, not CTAs. |
| `ClauseSidebar` | Clause number `<span style={{ backgroundColor: cfg.hex }}>` | Compact code chip (hex-colored, rounded). |
| `T12View.tsx` | Section complete success banner | `bg-success-light border border-success-dark/20` — semantic callout. |

#### Hardcodes ad-hoc residuales en T12

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `T12View.tsx` | T12 badge span | Tint-navy |
| `ClauseSidebar` | Clause nav buttons | Data-driven hex active state (bg-navy/10 + hex) |
| `ClauseSidebar` | Clause number span | Hex-colored compact code display |
| `ControlCardWrapper` | "Retroceder" | Micro-action ultra-sutil |
| `ControlCardWrapper` | "Avanzar" button | Hex data-driven bg color |
| `StatusBadge` | Todas las instancias | Tailwind class strings |

---

## 20. Verificaciones de hipótesis — Lote T9/T10/T11/T12 (2026-06-04)

### ¿Algún módulo necesitó pieza/variant nuevo?

**T9: NO.** Sustitución pura. La eliminación de la función `Badge` local no requirió nuevo DS variant — todos los hex-color badges del Gantt usan el patrón `style={{ backgroundColor, color }}` ya establecido en T3/T4/T5.

**T10: N/A.** Sin migración (color gold = no-DS).

**T11: NO.** El badge "T11" usa `variant="warning"` (amber ≈ warning). El text-[9px] vs text-[10px] es diferencia de 1px, dentro del rango aceptable.

**T12: NO.** Sustitución pura. ControlCardWrapper → Card outlined limpio.

### ¿Algún watch-item alcanzó 2º consumidor independiente?

| Watch-item | Lote T9/T10/T11/T12 | Estado acumulado |
|-----------|---------------------|-----------------|
| `FormField ancho compacto` | T9 `AddFreeItemForm` — los 3 inputs usan FormField standard (full-width), NO compact. Sin 2º consumidor. | Sigue sin 2º consumidor |
| `toggle text-[9px]` | No en ninguno de los 4 módulos | Sin cambio |
| `Badge tintado+dot` | No en T9/T10/T11/T12 | Sigue en 5, todas T5 |
| `Button fullWidth` | No en T9/T10/T11/T12 | Sigue en 2 (T5) |
| `Tint-navy pattern` | T9 (T9 badge), T11 (era T11 badge — migrado a warning), T12 (T12 badge) | T9+T12 = 2 tint-navy badges residuales. T11 MIGRADO a warning. Patrón tint-navy tiene 3+ usos residuales (T6/T7/T8/T9/T12 headers) → **candidato a `variant="navy-tint"` en Badge DS**. |

### Badge tint-navy — nuevo candidato watch-item

El patrón `<span className="... bg-navy/10 dark:bg-navy/20 text-navy dark:text-warm-100 ...">T{N}</span>` aparece en:
- T9View.tsx → T9 badge (migratable)
- T12View.tsx → T12 badge (migratable)
- T6View ya era inline `bg-navy/10` pattern (ver T6 dejado)
- T7/T8 LLM indicator divs (not a badge, a pill-with-dot)
- T11 → MIGRADO a `variant="warning"` (amber, no tint-navy)

Instancias de "tool badge tint-navy": T9, T12 = 2 consumidores. **Umbral de 2 alcanzado.** Propuesta: añadir `variant="navy-ghost"` a DS Badge (`bg-navy/10 dark:bg-navy/20 text-navy dark:text-warm-100`). Anotar como §20.1 para PR separado.

✓ `grep "function Badge" T9View.tsx → 0`  
✓ `grep "bg-navy-metallic" T9/T11/T12 → 0`  
✓ Ficheros editados: T9View.tsx, T11View.tsx, T12View.tsx, docs/COMPONENT-INVENTORY.md

---

## 20. Estado de migración — T11 completo (2026-06-04)

### §20.1 — T11 Detalle de migración (lote 2 — contenedores desbloqueados)

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después | Surface dark |
|---------|-----|-------|---------|-------------|
| `T11View.tsx` | Hero card | `<div bg-white dark:bg-warm-700 border dark:border-warm-500 rounded-2xl px-6 py-5>` | `<Card variant="flat" padding="none" className="... bg-white dark:bg-warm-700 border dark:border-warm-500 ...">` | warm-700 ✓ |
| `T11View.tsx` | KPI strip cards ×4 | `<div bg-white dark:bg-warm-700 border dark:border-warm-500 rounded-xl px-5 py-4>` | `<Card variant="flat" padding="none" className="... bg-white dark:bg-warm-700 ...">` | warm-700 ✓ |
| `T11View.tsx` | "Cómo funciona" card | `<div border dark:border-warm-500 bg-white dark:bg-warm-700 rounded-2xl px-6 py-5>` | `<Card variant="flat" padding="none" className="... dark:bg-warm-700 dark:border-warm-500 ...">` | warm-700 ✓ |
| `T11View.tsx` | SAFe note | `<div border dark:border-warm-500 bg-surface dark:bg-warm-800 rounded-xl px-5 py-4>` | `<Card variant="flat" padding="none" className="... bg-surface dark:bg-warm-800 dark:border-warm-500 ...">` | warm-800 ✓ |
| `DecisionesTab.tsx` | Escalada note | `<div border dark:border-warm-500 bg-surface dark:bg-warm-800 rounded-xl px-5 py-4>` | `<Card variant="flat" padding="none" className="...">` | warm-800 ✓ |
| `KpisTab.tsx` | Source badge | `<span text-[9px] font-bold text-white style={{ backgroundColor: lcfg.hex }}>` | `<Badge size="xs" style={{ backgroundColor: lcfg.hex, color: '#ffffff' }}>` | — |

#### Técnica: Card flat + className para surfaces warm-700/warm-800

Card `outlined` provee `dark:bg-warm-800`. Para surfaces `dark:bg-warm-700` (distintas), se usa `variant="flat"` que provee `bg-transparent border-transparent` — sin conflicto con los bg/border del className. En Tailwind JIT, las clases de className se aplican después de las del variant → la surface declarada en className gana siempre. ✓

#### Contenedores NO migrados — warm-600 bloqueante

| Contenedor | Surface dark | Razón del bloqueo |
|-----------|-------------|------------------|
| CadenciaTab EventCards | `dark:bg-warm-600 ${lcfg.border}` | Border dinámico de domain config. `border-transparent` (Card flat) aparece DESPUÉS de `border-emerald/blue/amber` en el CSS → flat ganaría y borraría el borde visual |
| DecisionesTab DecisionCards | `dark:bg-warm-600 ${lcfg.border}` | Ídem |
| KpisTab table container | `dark:bg-warm-600 dark:border-warm-500` | bg-warm-600 — no existe Card variant para esta elevación |
| ObjetivosTab content card | `dark:bg-warm-600 dark:border-warm-500` | Ídem |
| EventDetailPanel aside | `dark:bg-warm-800 border-l` | Panel lateral deslizante. No es un Card. |

**Acción futura**: Cuando se añada `elevated-light` o `card-sm` variant a Card (si warm-600 se establece como elevación), migrar estos contenedores.

#### Level badges — Cadencia/Decisiones/KPIs

Los badges de nivel (`${lcfg.badge} ${lcfg.badgeText}`) usan Tailwind class strings de T11_LEVEL_CONFIG (emerald/blue/amber). Estos NO se migran a DS Badge porque:
1. Son class-by-domain (patrón establecido)
2. Las clases emerald/blue/amber difieren de DS Badge success/info/warning en luminosidad (emerald-100 ≠ success-light, blue-700 ≠ info-dark)

#### KpisTab source badge — nota de tamaño

El badge de fuente original usaba `text-[9px] font-bold`. DS Badge `size="xs"` = `text-[10px] font-semibold`. La diferencia es 1px y un peso ligeramente menor — standardización DS aceptable.

#### Dark mode T11 — ¿visualmente idéntico?

**Sí.** En todos los contenedores migrados:
- `dark:bg-warm-700` → explícito en className de Card flat (no cambia)
- `dark:border-warm-500` → explícito en className de Card flat (no cambia)
- `dark:bg-warm-800` → explícito en className de Card flat (no cambia)
- Card flat provee `bg-transparent border-transparent` sin dark: overrides → sin conflicto

---

## 21. Estado de migración — T10 (2026-06-04, lote 2)

### §21.1 — T10 Detalle de migración (lote 2 — UI color-neutral)

#### Reemplazado (ad-hoc → DS)

| Fichero | Qué | Antes | Después |
|---------|-----|-------|---------|
| `PanelCard.tsx` | Outer card container | `<div bg-white dark:bg-warm-600 rounded-xl p-4 cursor-pointer>` | `<Card variant="flat" padding="none" className="... bg-white dark:bg-warm-600 ...">` — surface idéntica ✓ |
| `PanelCard.tsx` | Tag chip | `<span ${TAG_CLASSES[tagColor]} rounded-full text-[10px]>` | `<Badge variant={TAG_VARIANT[tagColor]} shape="pill" size="xs" style={TAG_INLINE_STYLE[tagColor]}>` |
| `P1MaturityPanel.tsx` | Tier badge | `<span bg-warning-light/bg-info-light rounded-full text-[10px]>` | `<Badge variant={avg < 2 ? 'warning' : 'info'} shape="pill" size="xs">` |
| `P2PortfolioPanel.tsx` | Initiative status chips | `<span bg-success-light/bg-warning-light rounded text-[10px]>` | `<Badge variant={... 'success' : 'warning'} size="xs" className="shrink-0">` |
| `P3AdoptionPanel.tsx` | Shadow AI progress track | `dark:bg-gray-800` (frío) | `dark:bg-warm-700` (warm, fix residual) |

#### PanelCard tag chip — mapeo TagColor → BadgeVariant

| TagColor | BadgeVariant | Método |
|---------|-------------|--------|
| `warning` | `warning` | Variant semántico (exact bg/text match) |
| `amber` | `warning` | Variant semántico (same classes) |
| `success` | `success` | Variant semántico |
| `info` | `info` | Variant semántico |
| `danger` | `danger` | Variant semántico |
| `purple` | `default` + inline style `{ backgroundColor: '#EEEDFE', color: '#3C3489' }` | Hex data-driven (no DS variant para purple). Dark mode: inline style toma precedencia sobre Tailwind → mismo comportamiento que el original (sin dark variant) |

#### Dejado sin tocar (y por qué)

| Fichero | Qué | Razón |
|---------|-----|-------|
| `NavButton.tsx` | Todo el componente | Gold identity control. DS Button `variant="link"` usa `text-gold-text` (light) + `hover:underline`, mientras NavButton necesita `text-gold` + `hover:text-gold-hover`. Hover behavior distinto (underline vs color change). Requeriría múltiples `!` overrides. Patrón descrito en task como "ad-hoc documentado si controles de identidad sin componente DS que encaje". |
| `EmptyStates.tsx` | CTA `<button style={{ background: '#C8860A' }}>` | Excepción documentada por task: único consumidor de gold como CTA; DS Button primary = navy-metallic gradient (no override de color por style). |
| `EmptyStates.tsx` | Icon containers + numbered circles | Gold hex identity. Data-driven inline style. |
| `P3AdoptionPanel.tsx` | Shadow AI callout div | `style={{ backgroundColor: rgba(200,134,10,0.04), borderColor: rgba(200,134,10,0.25) }}` — gold identity data-driven. |
| `P4EcosystemPanel.tsx` | Bottleneck callout | `style={{ background: rgba(127,119,221,0.08) }}` purple ecosystem identity. |
| `P4-P6` | DonutChart, DimBar, StatusBar, MetricChip, DeptBar | Visualizaciones de datos. Excluidas por reglas. |
| `DashboardHeader.tsx` | Todo | Solo texto/spans. Sin botones ni containers migrables. |

#### Hardcodes ad-hoc residuales en T10

| Fichero | Tipo | Descripción |
|---------|------|-------------|
| `NavButton.tsx` | `<button>` completo | Gold link navigation — sin DS fit exacto |
| `EmptyStates.tsx` | CTA gold | Excepción documentada |
| `EmptyStates.tsx` | Icon divs + numbered circles | Gold hex identity |
| `P3AdoptionPanel.tsx` | Shadow AI callout | Gold inline style |
| `P4EcosystemPanel.tsx` | Bottleneck callout | Purple ecosystem inline style |
| `P5RiskPanel.tsx` | ISO progress bar fill | `bg-gold` — identity |
| `P1-P6` | Progress bars inline style | Data-driven hex fills |
