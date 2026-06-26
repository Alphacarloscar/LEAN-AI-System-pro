# GOBY — Dirección de Diseño Visual
> Versión 1.0 · 2026-06-22 · Autor: Alpha + Claude (Strategic Design Review)
> Referencia visual: Zara web · Google Antigravity · Obsidian Amber (sistema actual)

---

## 1. Filosofía de diseño

**Principio rector:** El usuario paga por la herramienta. Cada píxel debe justificar su presencia transmitiendo competencia, no decoración.

### 1.1 Los 4 pilares

| Pilar | Definición | Anti-patrón que eliminamos |
|-------|-----------|---------------------------|
| **Monocromo warm** | El 95% de la interfaz vive en la escala warm (ivory → obsidian). El color es la excepción, no la norma. | Arcoíris de píldoras categóricas, badges multicolor, fondos saturados |
| **Tipografía como jerarquía** | El tamaño, peso y tracking del texto son la herramienta principal de diferenciación visual. No el color. | H1 en 14px, rangos tipográficos comprimidos, todo en text-sm |
| **Gold como firma** | Un único acento de marca (gold #C8860A) para CTAs, estados activos y elementos de identidad. | Múltiples acentos compitiendo (verde, azul, rojo como identidad) |
| **Color funcional, nunca decorativo** | El color solo aparece cuando codifica información que no puede transmitirse de otro modo. | Píldoras de categoría coloreadas, barras cromáticas sin semántica, fondos gradient decorativos |

### 1.2 Referencia Zara / Antigravity → Obsidian Amber

| Zara/Antigravity | GOBY (Obsidian Amber) | Adaptación |
|------------------|----------------------|------------|
| Negro puro + blanco puro | warm-950 (#1C1A16) + warm-50 (#F7F4EE) | Misma intensidad, undertone cálido |
| Sin acento de color | Gold (#C8860A) como acento único | Conservamos el gold — es la firma de la marca |
| Tipografía editorial dominante | Inter con escala expandida (ver §3) | Subimos el rango de 14–16px a 14–32px |
| Whitespace masivo | Contenedores max-w-7xl + px-8 unificados | Aumentamos breathing room entre tarjetas |
| Diferenciación por posición + tipo | Posición + tipo + micro-dot warm | Añadimos el dot como ancla mínima de categoría |

---

## 2. Sistema cromático

### 2.1 Paleta core (95% de la UI)

```
SUPERFICIE
  warm-50   #F7F4EE   ← fondo principal light
  white     #FFFFFF   ← cards, modales
  warm-800  #2A2822   ← fondo principal dark
  warm-900  #22201C   ← superficie app dark

TINTA
  lean-black #1C1A16  ← texto primario light
  warm-50    #F7F4EE  ← texto primario dark
  warm-500   #8A857C  ← texto secundario (muted)
  warm-400   #9A9790  ← texto terciario (subtle)

BORDES
  border     #D4D0C8  ← borde principal light
  warm-600/30         ← borde principal dark

ACENTO ÚNICO
  gold       #C8860A  ← CTAs, nav activa, firma de marca
  gold-hover #B5780A  ← hover
  gold-muted #A08050  ← estados sutiles
  gold-faint rgba(200,134,10,0.08) ← fondos de selección
```

### 2.2 Semáforo funcional (solo cuando hay umbral de negocio real)

```
success    #5FAF8A   ← dato que supera objetivo definido
warning    #D4A85C   ← dato que está en zona de atención
danger     #C06060   ← dato que incumple objetivo o requiere acción
info       #6A90C0   ← dato neutral informativo
```

**Regla de aplicación del semáforo:** Un color semántico SOLO aparece si existe un umbral cuantificable de negocio detrás (ej: "score < 30 = danger"). Si el número es simplemente un dato sin juicio de valor, va en tinta warm. Esto elimina el patrón actual de "51% en rojo" cuando 51% es simplemente un dato.

**Variantes soft (fondos de card/badge):**
```
success-soft  success/10 sobre warm-50
warning-soft  warning/10 sobre warm-50
danger-soft   danger/10 sobre warm-50
info-soft     info/10 sobre warm-50
```

### 2.3 Sistemas categóricos (máx. 2 en todo el producto)

#### Sistema A: Dominios de IA (T5 + referencias cruzadas)
Cada dominio tiene identidad visual persistente. Paleta desaturada, warm-aligned.

| Dominio | Color | Token | Uso |
|---------|-------|-------|-----|
| Predictiva | Azul acero desaturado | `domain-predictive` | Icono + borde + dot |
| Asistente | Gold warm | `domain-assistant` | Icono + borde + dot |
| Optimización | Esmeralda apagado | `domain-optimization` | Icono + borde + dot |
| Agéntica | Verde salvia | `domain-agentic` | Icono + borde + dot |
| Auto-IA | Cobre warm | `domain-auto-ai` | Icono + borde + dot |
| RPA | Gris pizarra | `domain-rpa` | Icono + borde + dot |

**Aplicación:** Círculo de icono con borde del color + fondo surface. Nunca fondo saturado. El color actúa como "anillo" identificativo, no como relleno.

#### Sistema B: Departamentos (T7 curva de Rogers + filtros simultáneos)
Solo activado cuando múltiples departamentos deben distinguirse en el mismo viewport.

| Departamento | Color | Token |
|-------------|-------|-------|
| Marketing | warm-700 | `dept-1` |
| IT | warm-500 | `dept-2` |
| Operaciones | gold (acento) | `dept-3` |
| Dirección | warm-300 | `dept-4` |
| RRHH | warm-200 | `dept-5` |

**Diferenciación:** Escala tonal monocromática (5 escalones de warm) en lugar de 5 hues distintos. Preserva el espíritu Zara/monocromo. El departamento "en foco" (filtrado/seleccionado) se ilumina en gold, los demás quedan en su tono warm.

**Excepción:** Si pruebas de usabilidad demuestran que la escala tonal no basta para la curva de Rogers (stakeholders dispersos con solo 1-2 puntos por dpto), se permite una paleta de 5 hues warm-aligned (todos en el mismo nivel de saturación y luminosidad, solo variando el matiz). Pero la escala tonal es la primera opción.

**Regla inquebrantable:** Los dos sistemas NUNCA aparecen en la misma pantalla. Una pantalla muestra dominios OR departamentos, jamás ambos.

### 2.4 Lo que desaparece

- Píldoras coloreadas de categoría de herramienta en T10 (T1·Readiness verde, T4·Portfolio gold, etc.) → pasan a ser texto mono warm con borde warm-200
- Fondos saturados: bg-red-600, bg-emerald-900, bg-blue-900, bg-amber-900 → bg-surface + border-l-[3px] con color semántico
- Paleta violet en T12 → reemplazada por gold (criticidad alta)
- Rainbow fills en AdaptiveModeBadge (T11) → patrón surface + border-left accent
- Gray fría (gray-100, gray-200, slate-400, etc.) → equivalentes warm

---

## 3. Jerarquía tipográfica

### 3.1 Escala expandida (Inter)

| Nivel | Clase | Tamaño | Peso | Tracking | Uso |
|-------|-------|--------|------|----------|-----|
| **Display** | text-3xl | 30px | font-bold | tracking-tight | Números KPI gigantes (T10 dashboard) |
| **H1 Tool** | text-xl | 20px | font-semibold | normal | Título de herramienta en ToolHeader |
| **H2 Section** | text-lg | 18px | font-semibold | normal | Secciones principales dentro de una tool |
| **H3 Card** | text-base | 16px | font-semibold | normal | Títulos de cards y paneles |
| **H4 Label** | text-xs | 12px | font-mono uppercase | tracking-widest | Etiquetas de sección, caps labels |
| **Body** | text-sm | 14px | font-normal | normal | Texto principal |
| **Caption** | text-xs | 12px | font-normal | normal | Texto auxiliar, timestamps |

**Cambio crítico:** H1 de tool pasa de `text-sm` (14px) a `text-xl` (20px). Este único cambio sube la percepción de profesionalidad más que cualquier otro ajuste cromático.

### 3.2 Regla H3 unificada
Las dos personalidades actuales de H3 (mono uppercase VS semibold 14px) se separan:
- `text-xs font-mono uppercase tracking-widest` → pasa a ser **H4 Label** (nueva categoría)
- `text-sm font-semibold` → se promueve a **H3 Card** como `text-base font-semibold`

### 3.3 Números KPI
Los grandes números del dashboard (1.8, €80K, 80%) usan `text-3xl font-bold` en tinta warm por defecto. Solo adquieren color semántico si hay un umbral de negocio que lo justifique. Nunca el color es decorativo en un KPI.

---

## 4. Espaciado y layout

### 4.1 Contenedor unificado
```
Todas las tools: max-w-7xl mx-auto px-8
Modales: max-w-2xl (sm) / max-w-4xl (lg)
Header global: px-6 (ya unificado)
```

### 4.2 Escala de espaciado canónica (4px base)
```
Valores permitidos: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)
Valores .5 eliminados: gap-1.5 → gap-2, p-1.5 → p-2, py-2.5 → py-3, gap-2.5 → gap-3
```

### 4.3 Radios unificados
```
rounded-xl   → cards, paneles, modales (único valor para contenedores)
rounded-lg   → inputs, botones, tooltips
rounded-md   → badges, chips, tags
rounded-full → avatares, toggles, botones icon-only
```
Eliminado: `rounded-2xl` (71 instancias → migrar a rounded-xl), `rounded-3xl` (5 instancias → eliminar).

### 4.4 Sombras reducidas
```
shadow-sm    → cards en light mode (elevación sutil)
shadow-md    → dropdowns, tooltips
shadow-border → bordes virtuales (token custom existente)
```
Eliminado: `shadow-lg`, `shadow-xl`, `shadow-2xl` (12+ instancias). El efecto de profundidad se consigue con `border` + `shadow-sm`, no con sombras pesadas. Espíritu Zara = plano con mínima elevación.

---

## 5. Iconografía

### 5.1 Fuente única: Lucide React

### 5.2 Configuración canónica
```
Tamaño estándar: h-4 w-4 (16px)
Grosor: strokeWidth={1.5}
Color: hereda del texto padre (currentColor)
```

### 5.3 Tipos de uso

| Tipo | Ejemplo | Color | Requiere leyenda |
|------|---------|-------|-----------------|
| **Funcional** | X cerrar, ChevronDown, Search | warm-400 (text-muted) | No — forma universal |
| **Semántico** | AlertTriangle riesgo, CheckCircle ok | Hereda del token semántico (danger, success) | Sí — texto inline o tooltip |
| **Identificativo** | Brain predictiva, Network agéntica | Hereda del token de dominio | Sí — siempre con etiqueta |

### 5.4 Lo que se elimina
- SVG inline hardcodeados → migrar a componentes Lucide
- strokeWidth={2} → {1.5} en todo el sistema (96 violaciones)
- Strings literales de icono renderizados como texto ("alert-triangle", "network") → instanciar componente real
- Emoji en JSX → eliminar completamente (prohibido por DS §4.1)

---

## 6. Rediseño T10 — Dashboard ejecutivo

### 6.1 Estado actual vs objetivo

| Elemento | Actual | Objetivo |
|----------|--------|----------|
| Píldoras de categoría | 6 colores pasteles distintos | Texto mono warm + borde warm-200 |
| KPI numéricos grandes | Coloreados arbitrariamente (gold, verde, rojo) | Tinta warm por defecto. Solo semáforo si hay umbral |
| Barras de progreso | Multi-color (verde, azul, gold) | Gold como único acento. Resto en warm-300 |
| Donuts y radars | Paleta ad-hoc (#D85A30, #EF9F27, #97C459) | Tokens canónicos del DS (success, warning, danger, info) |
| PanelCard shadow | shadow-lg | shadow-sm + border |
| Tags categóricos | Purple, amber sin token DS | Badge DS con variante semántica canónica |

### 6.2 Cadena de componentes (palanca de cambio)
```
Card (DS) → PanelCard → P1...P6
```
PanelCard es el punto de intervención. Un cambio en PanelCard propaga a los 6 paneles.

### 6.3 Centralización de heroColor()
```
heroColor(score) actual:
  < 30  → #C05035 (HEX huérfano)
  30-60 → #EF9F27 (HEX huérfano)
  ≥ 60  → #2A7A52 (HEX huérfano)

heroColor(score) objetivo:
  < 30  → var(--color-danger)
  30-60 → var(--color-warning)
  ≥ 60  → var(--color-success)
```

### 6.4 Resultado visual esperado
El dashboard pasará de ser una fiesta de color a un cuadro de mando sobrio donde la información habla a través de la tipografía y la posición, y el color solo aparece como señal de alerta cuando un KPI sale de la zona esperada. El gold de marca queda como firma sutil en las barras de progreso y el badge de sprint.

---

## 7. Principios de gobernanza visual

### 7.1 Regla de los 3 colores por pantalla
En cualquier viewport, el usuario no debería percibir más de 3 familias cromáticas simultáneas:
1. Tinta warm (texto + bordes)
2. Gold (acento de marca + selección activa)
3. UN sistema categórico O semáforo, nunca ambos

### 7.2 Regla de color categórico justificado
Un sistema de color categórico solo se justifica cuando:
- Múltiples entidades deben distinguirse simultáneamente en el mismo viewport
- Posición y tipografía no bastan para codificar la categoría
- El usuario mantiene un modelo mental persistente de esas entidades

### 7.3 Regla de capas en data viz
En gráficos complejos (ej: curva de Rogers T7), máximo 3 dimensiones categóricas codificadas simultáneamente, cada una con un canal visual distinto:
- **Posición** → fase de adopción (eje X)
- **Color** → departamento (relleno de burbuja)
- **Forma/letra** → arquetipo conductual (contenido de burbuja)
Nunca se añade una cuarta dimensión visual sin eliminar una de las anteriores.

---

*Este documento es la fuente de verdad de diseño visual. Cualquier decisión cromática, tipográfica o de espaciado que no esté aquí debe consultarse antes de implementarse.*
