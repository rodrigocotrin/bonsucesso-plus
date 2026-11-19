import { Person } from '../types';

/**
 * Interface flexível compatível tanto com o estado local (camelCase)
 * quanto com payloads da API Python/Django REST (snake_case).
 */
export interface PersonNameLike {
  fullName?: string;
  socialName?: string | null;
  full_name?: string;
  social_name?: string | null;
}

/**
 * Retorna o nome de exibição prioritário da pessoa:
 * Prioriza rigorosamente o Nome Social (`social_name` / `socialName`) quando preenchido,
 * recorrendo ao nome civil (`full_name` / `fullName`) apenas quando não houver Nome Social.
 */
export function getDisplayName(person?: Person | PersonNameLike | null): string {
  if (!person) return 'Usuário';

  const record = person as PersonNameLike;
  const social = (record.social_name ?? record.socialName)?.trim();
  if (social && social.length > 0) {
    return social;
  }

  const legal = (record.full_name ?? record.fullName)?.trim();
  return legal && legal.length > 0 ? legal : 'Usuário';
}

/**
 * Retorna true caso a pessoa possua Nome Social distinto do Nome Civil.
 */
export function hasSocialName(person?: Person | PersonNameLike | null): boolean {
  if (!person) return false;
  const record = person as PersonNameLike;
  const social = (record.social_name ?? record.socialName)?.trim();
  return Boolean(social && social.length > 0);
}

/**
 * Retorna o nome civil de registro (uso exclusivo em formulários administrativos e aba Dados Pessoais).
 */
export function getLegalName(person?: Person | PersonNameLike | null): string {
  if (!person) return '';
  const record = person as PersonNameLike;
  return (record.full_name ?? record.fullName)?.trim() ?? '';
}
