/**
 * Funções puras de validação para a jornada do Professor Voluntário (SRP)
 * Focadas na Heurística de Prevenção de Erros (Nielsen #5).
 */

/**
 * Valida se uma string opcional é uma URL HTTP/HTTPS bem formada.
 * Se estiver vazia, é considerada válida (pois o link externo é opcional).
 */
export function validateOptionalExternalUrl(urlInput: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const trimmed = urlInput.trim();
  if (!trimmed) {
    return { isValid: true };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        errorMessage: 'O link deve começar com https:// ou http:// (ex: https://classroom.google.com/...).',
      };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        isValid: false,
        errorMessage: 'Informe um endereço web completo (ex: https://youtube.com/...).',
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      errorMessage:
        'Formato de link inválido. Certifique-se de incluir https:// no início do endereço.',
    };
  }
}

/**
 * Valida se o horário de término da aula é posterior ao horário de início.
 */
export function validateLessonTimeRange(
  startTime: string,
  endTime: string
): { isValid: boolean; errorMessage?: string } {
  if (!startTime || !endTime) {
    return {
      isValid: false,
      errorMessage: 'Informe os horários de início e término da aula.',
    };
  }
  if (endTime <= startTime) {
    return {
      isValid: false,
      errorMessage: 'O horário de término deve ser posterior ao horário de início.',
    };
  }
  return { isValid: true };
}

/**
 * Valida uma nota digitada em relação ao intervalo permitido [0, maxScore].
 */
export function validateGradeScore(
  rawInput: string,
  maxScore: number
): {
  isValid: boolean;
  numericValue: number | null;
  errorMessage?: string;
} {
  const trimmed = rawInput.trim();
  if (trimmed === '') {
    return {
      isValid: true,
      numericValue: null,
    };
  }

  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return {
      isValid: false,
      numericValue: null,
      errorMessage: 'Digite apenas números válidos.',
    };
  }

  if (parsed < 0) {
    return {
      isValid: false,
      numericValue: parsed,
      errorMessage: 'A nota não pode ser negativa (mínimo 0).',
    };
  }

  if (parsed > maxScore) {
    return {
      isValid: false,
      numericValue: parsed,
      errorMessage: `A nota máxima permitida nesta avaliação é ${maxScore}.`,
    };
  }

  return {
    isValid: true,
    numericValue: Math.round(parsed * 10) / 10,
  };
}
