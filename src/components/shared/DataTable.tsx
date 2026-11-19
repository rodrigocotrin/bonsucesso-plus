import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  SearchBar,
  Select,
  SelectOption,
  SkeletonTable,
} from '../ui';
import { cn } from '../../utils/formatters';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  renderCell: (row: T) => React.ReactNode;
  sortAccessor?: (row: T) => string | number;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableFilterConfig<T> {
  id: string;
  label: string;
  options: SelectOption[];
  predicate: (row: T, selectedValue: string) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  getRowKey: (row: T) => string;
  searchLabel?: string;
  searchPlaceholder?: string;
  searchPredicate?: (row: T, query: string) => boolean;
  filters?: Array<DataTableFilterConfig<T>>;
  renderMobileCard?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  headerExtraAction?: React.ReactNode;
}

/**
 * Lei de Hick: Tabelas exibem no máximo 6 colunas visíveis.
 * Informações secundárias e fichas completas devem abrir em um SlideOverDrawer lateral.
 */
const MAX_VISIBLE_COLUMNS = 6;

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  searchLabel = 'Pesquisar',
  searchPlaceholder = 'Filtrar por nome, matrícula ou CPF...',
  searchPredicate,
  filters = [],
  renderMobileCard,
  onRowClick,
  isLoading = false,
  pageSize = 10,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Não há itens correspondentes aos filtros aplicados.',
  emptyAction,
  headerExtraAction,
}: DataTableProps<T>) {
  const visibleColumns = useMemo(
    () => columns.slice(0, MAX_VISIBLE_COLUMNS),
    [columns]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of filters) {
      initial[f.id] = 'all';
    }
    return initial;
  });

  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (filterId: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [filterId]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSortClick = (column: DataTableColumn<T>) => {
    if (!column.sortAccessor) return;
    if (sortColumnId === column.id) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumnId(column.id);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    const resetMap: Record<string, string> = {};
    for (const f of filters) {
      resetMap[f.id] = 'all';
    }
    setFilterValues(resetMap);
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return data.filter((row) => {
      if (query && searchPredicate && !searchPredicate(row, query)) {
        return false;
      }
      for (const f of filters) {
        const val = filterValues[f.id] ?? 'all';
        if (val !== 'all' && !f.predicate(row, val)) {
          return false;
        }
      }
      return true;
    });
  }, [data, searchQuery, searchPredicate, filters, filterValues]);

  const sortedData = useMemo(() => {
    if (!sortColumnId) return filteredData;
    const activeCol = visibleColumns.find((c) => c.id === sortColumnId);
    if (!activeCol || !activeCol.sortAccessor) return filteredData;

    const accessor = activeCol.sortAccessor;
    return [...filteredData].sort((a, b) => {
      const valA = accessor(a);
      const valB = accessor(b);
      const cmp =
        typeof valA === 'number' && typeof valB === 'number'
          ? valA - valB
          : String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumnId, sortDirection, visibleColumns]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    Object.values(filterValues).some((v) => v !== 'all');

  if (isLoading) {
    return <SkeletonTable rows={6} columns={visibleColumns.length} />;
  }

  return (
    <div className="space-y-4">
      {/* Barra Horizontal de Pesquisa e Filtros Combináveis (oculta na impressão) */}
      {(searchPredicate || filters.length > 0 || headerExtraAction) && (
        <div className="no-print rounded-lg border border-line bg-surface p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
            {searchPredicate && (
              <div
                className={cn(
                  'md:col-span-12',
                  filters.length === 1 && 'lg:col-span-7',
                  filters.length >= 2 && 'lg:col-span-6'
                )}
              >
                <SearchBar
                  label={searchLabel}
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}

            {filters.map((filter) => (
              <div
                key={filter.id}
                className={cn(
                  'md:col-span-6',
                  filters.length === 1 ? 'lg:col-span-5' : 'lg:col-span-3'
                )}
              >
                <Select
                  label={filter.label}
                  value={filterValues[filter.id] ?? 'all'}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  options={filter.options}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-muted">
            <span>
              Exibindo <strong className="num text-ink">{paginatedData.length}</strong> de{' '}
              <strong className="num text-ink">{totalItems}</strong>{' '}
              {totalItems === 1 ? 'registro' : 'registros'}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-line bg-paper px-2.5 text-xs font-medium text-ink hover:bg-subtle"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Limpar filtros</span>
                </button>
              )}
              {headerExtraAction}
            </div>
          </div>
        </div>
      )}

      {/* Tabela Densa (Desktop) + Cards Empilhados (Mobile) */}
      {paginatedData.length > 0 ? (
        <>
          {/* Mobile (< 768px): Lista de Cards Empilhados Limpos (sem bordas aninhadas) */}
          <div className="space-y-2.5 md:hidden print:hidden">
            {paginatedData.map((row) => {
              const primaryCol = visibleColumns[0];
              const actionCol = visibleColumns.find((c) => c.id === 'actions');
              const detailCols = visibleColumns
                .slice(1)
                .filter((c) => c.id !== 'actions');

              return (
                <div
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'rounded-lg border border-line bg-surface p-4 space-y-3',
                    onRowClick && 'cursor-pointer hover:bg-subtle'
                  )}
                >
                  {renderMobileCard ? (
                    renderMobileCard(row)
                  ) : (
                    <>
                      {primaryCol && (
                        <div>
                          <span className="text-[11px] font-medium text-ink-muted">
                            {primaryCol.header}
                          </span>
                          <div className="mt-0.5 text-sm font-semibold text-ink">
                            {primaryCol.renderCell(row)}
                          </div>
                        </div>
                      )}

                      {detailCols.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 rounded-md bg-subtle p-3">
                          {detailCols.map((col) => (
                            <div key={col.id} className="min-w-0">
                              <span className="block text-[11px] font-medium text-ink-muted">
                                {col.header}
                              </span>
                              <div className="mt-0.5 text-xs text-ink">
                                {col.renderCell(row)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {actionCol && (
                        <div className="flex items-center justify-end pt-1">
                          {actionCol.renderCell(row)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop (>= 768px) & Print: Tabela Densa Operacional */}
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-surface md:block print:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-ink bg-paper">
                <tr className="h-10">
                  {visibleColumns.map((col) => {
                    const isSortable = Boolean(col.sortAccessor);
                    const isSorted = sortColumnId === col.id;
                    return (
                      <th
                        key={col.id}
                        scope="col"
                        aria-sort={
                          isSorted
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : isSortable
                            ? 'none'
                            : undefined
                        }
                        className={cn(
                          'px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-muted',
                          col.headerClassName
                        )}
                      >
                        {isSortable ? (
                          <button
                            type="button"
                            onClick={() => handleSortClick(col)}
                            className="inline-flex items-center gap-1.5 text-left uppercase tracking-wider text-ink-muted hover:text-ink"
                          >
                            <span>{col.header}</span>
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-ink" aria-hidden="true" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-ink" aria-hidden="true" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-ink-muted/70" aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedData.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'h-11 bg-surface transition-colors duration-100 hover:bg-subtle',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn('px-4 py-2 align-middle text-sm text-ink', col.cellClassName)}
                      >
                        {col.renderCell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação Tabular */}
          {totalPages > 1 && (
            <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-2.5">
              <span className="text-xs text-ink-muted">
                Página <strong className="num text-ink">{safePage}</strong> de{' '}
                <strong className="num text-ink">{totalPages}</strong> (
                <span className="num">{totalItems}</span> registros)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            hasActiveFilters ? (
              <Button
                variant="secondary"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={handleResetFilters}
              >
                Limpar filtros
              </Button>
            ) : (
              emptyAction
            )
          }
        />
      )}
    </div>
  );
}
