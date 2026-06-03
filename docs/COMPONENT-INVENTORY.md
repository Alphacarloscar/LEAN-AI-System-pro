# Component Inventory — GOBY Frontend

> Generado: 2026-06-03 · Rama: `refactor-AI-SOS`  
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
| `TabButton` | `T6View.tsx` (inline), `T7Tabs.tsx`, `T8Tabs.tsx`, `T11/TabButton.tsx` | **4 copias** — mismo `px-4 py-1.5 rounded-xl text-xs` con active/inactive states |
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
