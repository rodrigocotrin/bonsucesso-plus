import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  SearchBar,
  Select,
  SelectOption,
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
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  headerExtraAction?: React.ReactNode;
}

/**
 * Componente Reutilizável DataTable (src/components/shared/DataTable.tsx)
 * - Extensível via generics e props (OCP), sem regras de negócio acopladas.
 * - Suporta busca textual, múltiplos filtros suspensos, ordenação por coluna (asc/desc),
 *   paginação acessível, zebra-striping inspirado no SUAP e cards empilhados no Mobile.
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  searchLabel = 'Buscar na lista',
  searchPlaceholder = 'Digite para filtrar...',
  searchPredicate,
  filters = [],
  renderMobileCard,
  pageSize = 8,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Não encontramos resultados para os filtros selecionados. Tente limpar a busca.',
  headerExtraAction,
}: DataTableProps<T>) {
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

  // 1. Filtra por busca textual e filtros suspensos
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

  // 2. Ordena pela coluna ativa
  const sortedData = useMemo(() => {
    if (!sortColumnId) return filteredData;
    const activeCol = columns.find((c) => c.id === sortColumnId);
    if (!activeCol || !activeCol.sortAccessor) return filteredData;

    const accessor = activeCol.sortAccessor;
    return [...filteredData].sort((a, b) => {
      const valA = accessor(a);
      const valB = accessor(b);
      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true });
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumnId, sortDirection, columns]);

  // 3. Paginação
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    Object.values(filterValues).some((v) => v !== 'all');

  return (
    <div className="space-y-5">
      {/* Barra de Busca e Filtros Suspensos */}
      {(searchPredicate || filters.length > 0 || headerExtraAction) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <span>
              Exibindo <strong>{paginatedData.length}</strong> de{' '}
              <strong>{totalItems}</strong>{' '}
              {totalItems === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Limpar busca e filtros</span>
                </button>
              )}
              {headerExtraAction}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo: Tabela Desktop + Cards Mobile ou EmptyState */}
      {paginatedData.length > 0 ? (
        <>
          {/* Visão Mobile (Cards Empilhados) */}
          <div className="md:hidden space-y-3">
            {paginatedData.map((row) => (
              <div
                key={getRowKey(row)}
                className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
              >
                {renderMobileCard ? (
                  renderMobileCard(row)
                ) : (
                  <div className="space-y-2.5">
                    {columns.map((col) => (
                      <div
                        key={col.id}
                        className="flex flex-col gap-0.5 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0 dark:border-slate-800"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {col.header}
                        </span>
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {col.renderCell(row)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Visão Desktop (Tabela inspirada no SUAP com zebra-striping e ordenação acessível) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100/90 text-slate-800 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-100">
                <tr>
                  {columns.map((col) => {
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
                        className={cn('px-4 py-3.5 font-extrabold', col.headerClassName)}
                      >
                        {isSortable ? (
                          <button
                            type="button"
                            onClick={() => handleSortClick(col)}
                            className="inline-flex items-center gap-1.5 rounded-lg py-0.5 text-left font-extrabold hover:text-primary-800 dark:hover:text-primary-300"
                          >
                            <span>{col.header}</span>
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((row, rowIdx) => (
                  <tr
                    key={getRowKey(row)}
                    className={cn(
                      'transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-950/30',
                      rowIdx % 2 === 1
                        ? 'bg-slate-50/60 dark:bg-slate-900/50'
                        : 'bg-white dark:bg-slate-900'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn('px-4 py-3.5 align-middle', col.cellClassName)}
                      >
                        {col.renderCell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Página <strong>{safePage}</strong> de <strong>{totalPages}</strong> (
                {totalItems} registros)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
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
                variant="primary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={handleResetFilters}
              >
                Limpar Filtros e Mostrar Todos
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
