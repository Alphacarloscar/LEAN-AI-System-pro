import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ToastProvider, useToast } from '@shared/design-system/components/Toast'

// Helper: componente que expone toast API en el DOM para testing
function ToastTrigger({ label, variant = 'info', persistent }: {
  label:      string
  variant?:   'success' | 'error' | 'warning' | 'info'
  persistent?: boolean
}) {
  const { toast } = useToast()
  return (
    <button
      onClick={() => toast[variant](label, { persistent })}
    >
      {label}
    </button>
  )
}

function renderWithProvider(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>)
}

describe('ToastProvider — cola FIFO con límite 3', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('emitir 4 toasts descarta el primero (FIFO)', async () => {
    renderWithProvider(
      <>
        <ToastTrigger label="Toast 1" />
        <ToastTrigger label="Toast 2" />
        <ToastTrigger label="Toast 3" />
        <ToastTrigger label="Toast 4" />
      </>
    )

    // Emitir los 4 toasts en orden
    act(() => { screen.getByText('Toast 1').click() })
    act(() => { screen.getByText('Toast 2').click() })
    act(() => { screen.getByText('Toast 3').click() })
    act(() => { screen.getByText('Toast 4').click() })

    // Solo deben verse 3 mensajes de notificación (role=alert)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(3)

    // El primero (Toast 1) fue descartado; Toast 2, 3, 4 están presentes
    expect(screen.queryByRole('alert', { name: /Toast 1/ })).toBeNull()
    const messages = alerts.map((a) => a.textContent)
    expect(messages.some((m) => m?.includes('Toast 2'))).toBe(true)
    expect(messages.some((m) => m?.includes('Toast 3'))).toBe(true)
    expect(messages.some((m) => m?.includes('Toast 4'))).toBe(true)
  })

  it('persistent=true no auto-cierra tras la duración por defecto', async () => {
    renderWithProvider(
      <ToastTrigger label="Persistente" variant="warning" persistent={true} />
    )

    act(() => { screen.getByText('Persistente').click() })
    expect(screen.getAllByRole('alert')).toHaveLength(1)

    // Avanzar 10 segundos (> duración warning 6000ms)
    act(() => { vi.advanceTimersByTime(10_000) })

    // El toast persiste — sigue en el DOM
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })

  it('toast no-persistent se auto-cierra tras su duración', async () => {
    renderWithProvider(
      <ToastTrigger label="Temporal" variant="success" />
    )

    act(() => { screen.getByText('Temporal').click() })
    expect(screen.getAllByRole('alert')).toHaveLength(1)

    // Avanzar pasado los 3000ms de success
    act(() => { vi.advanceTimersByTime(3100) })

    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })
})
