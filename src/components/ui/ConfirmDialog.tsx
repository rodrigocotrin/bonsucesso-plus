import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  consequenceNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  isLoading?: boolean;
}

/**
 * Diálogo de Confirmação (Nielsen #5 — Prevenção de Erros).
 * Variante `danger` é obrigatória para inativações (soft delete): faixa e botão em Vermelho.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  consequenceNote,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isLoading = false,
}) => {
  const isDanger = variant === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      tone={isDanger ? 'critical' : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink">{description}</p>

        {consequenceNote && (
          <div
            className={
              isDanger
                ? 'flex items-start gap-3 rounded border border-critical-border bg-critical-bg p-4'
                : 'flex items-start gap-3 rounded border border-assess-border bg-assess-bg p-4'
            }
          >
            <AlertTriangle
              className={isDanger ? 'mt-0.5 h-4 w-4 shrink-0 text-critical' : 'mt-0.5 h-4 w-4 shrink-0 text-assess-ink'}
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-ink">{consequenceNote}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
