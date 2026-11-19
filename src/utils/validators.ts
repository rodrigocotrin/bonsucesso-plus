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

/**
 * Calcula a idade completa em anos a partir de uma data ISO YYYY-MM-DD.
 */
export function calculateAgeYears(birthDateIso: string, referenceDate = new Date('2026-11-19')): number {
  if (!birthDateIso) return 18;
  const parts = birthDateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 18;
  const [year, month, day] = parts;
  let age = referenceDate.getFullYear() - year;
  const monthDiff = referenceDate.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < day)) {
    age--;
  }
  return age;
}

/**
 * Valida formato básico de CPF (11 dígitos numéricos) e verifica duplicidade no banco mockado.
 */
export function validateCpfField(
  cpfInput: string,
  existingPersons: Array<{ id: string; cpf: string }>,
  editingPersonId?: string | null
): { isValid: boolean; formatted: string; errorMessage?: string } {
  const digits = cpfInput.replace(/\D/g, '');
  if (digits.length !== 11) {
    return {
      isValid: false,
      formatted: cpfInput,
      errorMessage: 'O CPF deve conter exatamente 11 números (ex: 401.501.601-01).',
    };
  }

  const duplicate = existingPersons.find(
    (p) => p.id !== editingPersonId && p.cpf.replace(/\D/g, '') === digits
  );
  if (duplicate) {
    return {
      isValid: false,
      formatted: cpfInput,
      errorMessage: 'Já existe uma pessoa cadastrada no cursinho com este número de CPF.',
    };
  }

  const formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  return { isValid: true, formatted };
}

/**
 * Valida formato de e-mail e verifica duplicidade na base de pessoas.
 */
export function validateEmailField(
  emailInput: string,
  existingPersons: Array<{ id: string; email: string }>,
  editingPersonId?: string | null
): { isValid: boolean; errorMessage?: string } {
  const trimmed = emailInput.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: 'Informe um endereço de e-mail válido (ex: nome@comunidade.org.br).',
    };
  }

  const duplicate = existingPersons.find(
    (p) => p.id !== editingPersonId && p.email.trim().toLowerCase() === trimmed
  );
  if (duplicate) {
    return {
      isValid: false,
      errorMessage: 'Este endereço de e-mail já está vinculado a outra pessoa no sistema.',
    };
  }

  return { isValid: true };
}

/**
 * Valida telefone com DDD (mínimo 10 ou 11 dígitos).
 */
export function validatePhoneField(phoneInput: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const digits = phoneInput.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return {
      isValid: false,
      errorMessage: 'Informe o telefone ou WhatsApp com DDD (10 ou 11 dígitos, ex: (21) 99123-4567).',
    };
  }
  return { isValid: true };
}

