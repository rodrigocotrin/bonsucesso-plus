import React from 'react';
import { BrandLockup } from '../ui';

export interface PrintReportHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Cabeçalho exclusivo para modo de impressão (`hidden print:flex`).
 * Exibe a logo Bonsucesso+, o título do relatório e a data/hora exata de emissão.
 */
export const PrintReportHeader: React.FC<PrintReportHeaderProps> = ({
  title,
  subtitle,
}) => {
  const emittedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <div className="hidden print:flex print:w-full print:items-center print:justify-between print:border-b-2 print:border-black print:pb-3 print:mb-4">
      <div className="flex items-center gap-3">
        <BrandLockup subtitle="Cursinho Comunitário • Relatório Oficial" />
      </div>

      <div className="text-right">
        <p className="text-base font-bold text-black">{title}</p>
        {subtitle && <p className="text-xs text-black/80">{subtitle}</p>}
        <p className="num mt-0.5 text-[11px] text-black/70">
          Emitido em {emittedAt}
        </p>
      </div>
    </div>
  );
};
