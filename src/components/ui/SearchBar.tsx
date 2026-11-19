import React from 'react';
import { Search, X } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface SearchBarProps extends Omit<InputProps, 'leftIcon' | 'rightElement'> {
  value: string;
  onValueChange: (newValue: string) => void;
  onClear?: () => void;
}

/**
 * Barra de busca acessível com rótulo visível, ícone de lupa e botão amplo com texto para limpar a busca.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  label = 'Buscar',
  value,
  onValueChange,
  onClear,
  placeholder = 'Digite o nome ou palavra-chave...',
  ...props
}) => {
  const handleClear = () => {
    onValueChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <Input
      type="search"
      label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onValueChange(e.target.value)}
      leftIcon={<Search className="h-5 w-5" />}
      rightElement={
        value.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar texto da busca"
            className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span>Limpar</span>
          </button>
        ) : undefined
      }
      {...props}
    />
  );
};
