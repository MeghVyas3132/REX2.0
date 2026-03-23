/**
 * REX UI Components Library
 * Exported from: apps/frontend/src/components/ui
 *
 * Core components following the REX 2.0 design system
 * - All components use CSS-based styling for maintainability
 * - All colors reference design tokens (var(--color-*))
 * - Typography uses Geist (body), Geist Mono (code), Cabinet Grotesk (display)
 * - Motion respects prefers-reduced-motion accessibility preference
 */

export { Button, type ButtonProps } from './button';
export { Input, TextArea, Select, type InputProps, type TextAreaProps, type SelectProps } from './form';
export { StatusBadge, StatusDot, type StatusBadgeProps, type StatusDotProps } from './status-badge';
export { RexBadge, type RexBadgeProps, type RexScore } from './rex-badge';
export { Card, CardHeader, CardBody, CardFooter, type CardProps, type CardHeaderProps, type CardBodyProps, type CardFooterProps } from './card';
export { CanvasNode, type CanvasNodeProps, type NodeCategory } from './canvas-node';
export { Modal, type ModalProps } from './modal';

