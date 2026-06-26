// ─────────────────────────────────────────────────────────────
// GOBY — Design System Components
// Barrel de exportación — importa desde aquí, no de archivos individuales
//
// Uso: import { Button, Card, Badge } from '@shared/design-system/components'
// ─────────────────────────────────────────────────────────────

// ── Grupo A — Primitivos ──
export { Button }              from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { FormField }           from './FormField'
export type { FormFieldProps } from './FormField'

export { Input }               from './Input'
export type { InputProps }     from './Input'

export { Textarea }            from './Textarea'
export type { TextareaProps }  from './Textarea'

export { Select }              from './Select'
export type { SelectProps, SelectOption } from './Select'

export { Card }                from './Card'
export type { CardProps, CardVariant, CardPadding } from './Card'

export { Badge }               from './Badge'
export type { BadgeProps, BadgeVariant, BadgeShape, BadgeSize } from './Badge'

export { Alert }               from './Alert'
export type { AlertProps, AlertVariant } from './Alert'

export { Skeleton, SkeletonCard, SkeletonTable } from './Skeleton'
export type { SkeletonProps, SkeletonShape }      from './Skeleton'

// ── Grupo B — Compuestos ──
export { Checkbox }            from './Checkbox'
export type { CheckboxProps }  from './Checkbox'

export { Radio, RadioGroup }   from './Radio'
export type { RadioProps, RadioGroupProps, RadioOption } from './Radio'

export { Switch }              from './Switch'
export type { SwitchProps }    from './Switch'

export { Tag }                 from './Tag'
export type { TagProps }       from './Tag'

export { Avatar, AvatarGroup } from './Avatar'
export type { AvatarProps, AvatarGroupProps, AvatarSize } from './Avatar'

export { Panel }               from './Panel'
export type { PanelProps }     from './Panel'

export { Modal }               from './Modal'
export type { ModalProps, ModalSize } from './Modal'

export { Drawer }              from './Drawer'
export type { DrawerProps, DrawerSide } from './Drawer'

export { ToastContainer, ToastProvider, useToast } from './Toast'
export type { ToastItem, ToastVariant, ShowToastOptions } from './Toast'

export { ServiceErrorToast } from './ServiceErrorToast'
export type { ServiceErrorToastProps } from './ServiceErrorToast'

export { Table }               from './Table'
export type { TableProps, TableColumn, SortDirection } from './Table'

export { Tabs }                from './Tabs'
export type { TabsProps, TabItem } from './Tabs'

export { Accordion }           from './Accordion'
export type { AccordionProps, AccordionItem } from './Accordion'

export { Breadcrumb }          from './Breadcrumb'
export type { BreadcrumbProps, BreadcrumbItem } from './Breadcrumb'

export { Stepper }             from './Stepper'
export type { StepperProps, StepItem, StepStatus } from './Stepper'

export { SegmentedControl }    from './SegmentedControl'
export type { SegmentedControlProps, SegmentedControlOption } from './SegmentedControl'

// ── Grupo C — Layout / feedback ──
export { Spinner }             from './Spinner'
export type { SpinnerProps, SpinnerSize } from './Spinner'

export { StreamingIndicator }  from './StreamingIndicator'
export type { StreamingIndicatorProps } from './StreamingIndicator'

export { ToolHeader }          from './ToolHeader'
export type { ToolHeaderProps } from './ToolHeader'

export { EmptyState }          from './EmptyState'
export type { EmptyStateProps } from './EmptyState'
