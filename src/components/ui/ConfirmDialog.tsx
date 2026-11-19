import React from 'react';
import { AlertTriangle, Check, CornerUpLeft } from 'lucide-react';
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
 * Diálogo de Confirmação focado na Heurística de Prevenção de Erros (Nielsen #5).
 * Explica claramente o que vai acontecer antes de executar ações sensíveis ou destrutivas.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  consequenceNote,
  confirmLabel = 'Sim, confirmar',
  cancelLabel = 'Voltar sem alterar',
  variant = 'primary',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            leftIcon={<CornerUpLeft className="h-4 w-4" />}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={
              variant === 'danger' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed">
          {description}
        </p>

        {consequenceNote && (
          <div className="rounded-xl border border-warning-500/50 bg-warning-50 p-4 text-sm text-slate-900 dark:border-amber-700 dark:bg-warning-900/30 dark:text-amber-100 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-700 dark:text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-bold">Por que estamos perguntando isso? </span>
              <span>{consequenceNote}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
