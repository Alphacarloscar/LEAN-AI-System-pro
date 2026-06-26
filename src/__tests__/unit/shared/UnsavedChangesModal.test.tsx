import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@shared/design-system/components', () => ({
  Modal: ({
    open,
    children,
    footer,
    title,
  }: {
    open: boolean
    children: React.ReactNode
    footer?: React.ReactNode
    title?: string
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {title && <h2>{title}</h2>}
        <div>{children}</div>
        {footer && <div>{footer}</div>}
      </div>
    ) : null,
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

import { UnsavedChangesModal } from '@/shared/components/UnsavedChangesModal'

const baseProps = {
  open: true,
  onCancel: vi.fn(),
  onDiscard: vi.fn(),
}

describe('UnsavedChangesModal', () => {
  it('no renderiza nada cuando open=false', () => {
    render(<UnsavedChangesModal {...baseProps} open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renderiza el diálogo cuando open=true', () => {
    render(<UnsavedChangesModal {...baseProps} />)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('muestra el título "Cambios sin guardar"', () => {
    render(<UnsavedChangesModal {...baseProps} />)
    expect(screen.getByText('Cambios sin guardar')).toBeTruthy()
  })

  it('muestra el mensaje por defecto cuando no se pasa message', () => {
    render(<UnsavedChangesModal {...baseProps} />)
    expect(
      screen.getByText(/Tienes cambios sin guardar/),
    ).toBeTruthy()
  })

  it('muestra mensaje personalizado cuando se pasa message prop', () => {
    render(
      <UnsavedChangesModal
        {...baseProps}
        message="Se perderán los datos del formulario de stakeholders."
      />,
    )
    expect(
      screen.getByText(/Se perderán los datos del formulario de stakeholders/),
    ).toBeTruthy()
  })

  it('botón "Seguir editando" llama onCancel al hacer click', async () => {
    const onCancel = vi.fn()
    render(<UnsavedChangesModal {...baseProps} onCancel={onCancel} />)
    await userEvent.click(screen.getByText('Seguir editando'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('botón "Descartar cambios" llama onDiscard al hacer click', async () => {
    const onDiscard = vi.fn()
    render(<UnsavedChangesModal {...baseProps} onDiscard={onDiscard} />)
    await userEvent.click(screen.getByText('Descartar cambios'))
    expect(onDiscard).toHaveBeenCalledOnce()
  })

  it('NO muestra "Guardar y continuar" cuando onSave no se pasa', () => {
    render(<UnsavedChangesModal {...baseProps} />)
    expect(screen.queryByText('Guardar y continuar')).toBeNull()
  })

  it('muestra "Guardar y continuar" cuando se pasa onSave', () => {
    render(<UnsavedChangesModal {...baseProps} onSave={vi.fn()} />)
    expect(screen.getByText('Guardar y continuar')).toBeTruthy()
  })

  it('botón "Guardar y continuar" está disabled cuando isSaving=true', () => {
    render(
      <UnsavedChangesModal {...baseProps} onSave={vi.fn()} isSaving={true} />,
    )
    const btn = screen.getByRole('button', { name: /Guardando/ })
    expect(btn).toBeDisabled()
  })

  it('muestra savingLabel personalizado cuando isSaving=true', () => {
    render(
      <UnsavedChangesModal
        {...baseProps}
        onSave={vi.fn()}
        isSaving={true}
        savingLabel="Procesando…"
      />,
    )
    expect(screen.getByText('Procesando…')).toBeTruthy()
  })

  it('botón "Guardar y continuar" llama onSave al hacer click', async () => {
    const onSave = vi.fn()
    render(<UnsavedChangesModal {...baseProps} onSave={onSave} />)
    await userEvent.click(screen.getByText('Guardar y continuar'))
    expect(onSave).toHaveBeenCalledOnce()
  })
})
