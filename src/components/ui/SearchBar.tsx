import React from 'react';
import { Search, X } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface SearchBarProps extends Omit<InputProps, 'leftIcon' | 'rightElement'> {
  value: string;
  onValueChange: (newValue: string) => void;
  onClear?: () => void;
}

/**
 * Barra de busca padronizada do Bonsucesso+.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  label = 'Pesquisar',
  value,
  onValueChange,
  onClear,
  placeholder = 'Filtrar por nome, matrícula ou CPF...',
  ...props
}) => {
  const handleClear = () => {
    onValueChange('');
    onClear?.();
  };

  return (
    <Input
      type="search"
      label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onValueChange(e.target.value)}
      leftIcon={<Search className="h-4 w-4" />}
      rightElement={
        value.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar busca"
            className="inline-flex h-7 items-center gap-1 rounded border border-line bg-paper px-2 text-xs font-medium text-ink hover:bg-subtle"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Limpar</span>
          </button>
        ) : undefined
      }
      {...props}
    />
  );
};
