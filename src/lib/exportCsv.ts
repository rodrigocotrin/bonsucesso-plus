export interface ExportCsvOptions {
  /** Nome base do arquivo (sem extensão .csv) */
  filename: string;
  /** Cabeçalhos das colunas em português */
  headers: string[];
  /** Linhas de dados na mesma ordem dos cabeçalhos */
  rows: Array<Array<string | number | boolean | null | undefined>>;
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const raw = String(value).replace(/\r?\n|\r/g, ' ').trim();
  if (raw.includes(';') || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Gera e baixa um arquivo CSV compatível com Microsoft Excel (PT-BR):
 * - Codificação UTF-8 com BOM (`\uFEFF`) para preservar acentuação em português.
 * - Separador `;` (ponto e vírgula) padrão Excel Brasil.
 */
export function exportToCsv({ filename, headers, rows }: ExportCsvOptions): void {
  const headerLine = headers.map(escapeCsvCell).join(';');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(';'));
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const sanitizedName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', sanitizedName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Aciona o diálogo nativo de impressão (`@media print`).
 */
export function triggerPrintReport(): void {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
}
