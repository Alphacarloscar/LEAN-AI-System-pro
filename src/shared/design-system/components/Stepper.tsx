// No external React imports needed — JSX handled by tsconfig jsx transform

// ─────────────────────────────────────────────────────────────
// Stepper — indicador de progreso por pasos (wizard / onboarding)
//
// Uso:
//   <Stepper steps={steps} activeStep={2} />
//   <Stepper steps={steps} activeStep={3} orientation="vertical" />
//
// Muy relevante para el sprint L.E.A.N. de 6 meses (6 fases).
// ─────────────────────────────────────────────────────────────

export interface StepItem {
  id:          string
  label:       string
  description?: string
}

export type StepStatus = 'complete' | 'active' | 'upcoming'

export interface StepperProps {
  steps:        StepItem[]
  activeStep:   number        // 1-based
  orientation?: 'horizontal' | 'vertical'
  className?:   string
  onStepClick?: (index: number) => void   // si se permite navegar clicando
}

function getStatus(index: number, activeStep: number): StepStatus {
  if (index + 1 < activeStep)  return 'complete'
  if (index + 1 === activeStep) return 'active'
  return 'upcoming'
}

// ── Icono del paso ──
function StepIcon({ status, number }: { status: StepStatus; number: number }) {
  if (status === 'complete') {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy dark:bg-warm-600">
        <svg className="h-4 w-4 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }

  if (status === 'active') {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy dark:border-warm-300 bg-white dark:bg-gray-900">
        <span className="text-xs font-semibold text-navy dark:text-warm-100">{number}</span>
      </span>
    )
  }

  // upcoming
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-white dark:bg-gray-900 dark:border-gray-700">
      <span className="text-xs font-medium text-text-subtle">{number}</span>
    </span>
  )
}

// ── Línea conectora ──
function Connector({ complete, vertical }: { complete: boolean; vertical?: boolean }) {
  const base = complete
    ? 'bg-navy dark:bg-warm-600'
    : 'bg-border dark:bg-gray-700'

  if (vertical) {
    return <div className={`w-0.5 h-8 mx-auto ${base}`} />
  }
  return <div className={`flex-1 h-0.5 mt-4 mx-2 ${base}`} />
}

// ── Horizontal ──
function HorizontalStepper({ steps, activeStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progreso">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const status = getStatus(index, activeStep)
          const isLast = index === steps.length - 1

          return (
            <li key={step.id} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                {/* Icono */}
                {onStepClick ? (
                  <button
                    onClick={() => onStepClick(index + 1)}
                    aria-current={status === 'active' ? 'step' : undefined}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-full"
                  >
                    <StepIcon status={status} number={index + 1} />
                  </button>
                ) : (
                  <div aria-current={status === 'active' ? 'step' : undefined}>
                    <StepIcon status={status} number={index + 1} />
                  </div>
                )}
                {/* Etiqueta */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    status === 'active'
                      ? 'text-navy dark:text-warm-100'
                      : status === 'complete'
                        ? 'text-lean-black dark:text-gray-100'
                        : 'text-text-muted'
                  }`}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-text-subtle mt-0.5 max-w-[80px]">{step.description}</p>
                  )}
                </div>
              </div>

              {!isLast && (
                <Connector complete={status === 'complete'} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ── Vertical ──
function VerticalStepper({ steps, activeStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progreso">
      <ol className="space-y-0">
        {steps.map((step, index) => {
          const status = getStatus(index, activeStep)
          const isLast = index === steps.length - 1

          return (
            <li key={step.id}>
              <div className="flex gap-4">
                {/* Icono + línea */}
                <div className="flex flex-col items-center">
                  {onStepClick ? (
                    <button
                      onClick={() => onStepClick(index + 1)}
                      aria-current={status === 'active' ? 'step' : undefined}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-full"
                    >
                      <StepIcon status={status} number={index + 1} />
                    </button>
                  ) : (
                    <div aria-current={status === 'active' ? 'step' : undefined}>
                      <StepIcon status={status} number={index + 1} />
                    </div>
                  )}
                  {!isLast && (
                    <Connector complete={status === 'complete'} vertical />
                  )}
                </div>

                {/* Texto */}
                <div className={`pb-${isLast ? '0' : '6'} pt-1`}>
                  <p className={`text-sm font-medium ${
                    status === 'active'
                      ? 'text-navy dark:text-warm-100'
                      : status === 'complete'
                        ? 'text-lean-black dark:text-gray-100'
                        : 'text-text-muted'
                  }`}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-text-subtle mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ── Export principal ──
export function Stepper({ orientation = 'horizontal', ...props }: StepperProps) {
  if (orientation === 'vertical') return <VerticalStepper {...props} />
  return <HorizontalStepper {...props} />
}
