import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Person, UserAccount, UserRole } from '../types';
import { useMockDatabase } from './MockDatabaseContext';
import { normalizeIdentifier } from '../utils/formatters';

const SESSION_STORAGE_KEY = 'integracurso_active_account_id';
const SELECTED_STUDENT_STORAGE_KEY = 'integracurso_guardian_student_id';

export interface LoginResult {
  success: boolean;
  errorType?: 'invalid_credentials' | 'inactive_user';
  message?: string;
  role?: UserRole;
}

interface SessionContextValue {
  isAuthenticated: boolean;
  currentAccount: UserAccount | null;
  currentPerson: Person | null;
  /**
   * Quando logado como 'guardian' (Responsável), armazena qual filho(a)/estudante está selecionado
   */
  selectedStudentForGuardian: Person | null;
  linkedStudentsForGuardian: Person[];
  setSelectedStudentIdForGuardian: (studentPersonId: string) => void;
  loginWithCredentials: (identifier: string, passwordPlain: string) => LoginResult;
  quickLoginAsRole: (role: UserRole) => LoginResult;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const DEFAULT_DEMO_ACCOUNT_BY_ROLE: Record<UserRole, string> = {
  student: 'acc-est-01', // Mariana Oliveira Santos
  guardian: 'acc-resp-01', // Dona Helena Oliveira (vinculada a 2 alunos: Mariana e Lucas)
  teacher: 'acc-prof-01', // Prof. Carlos Eduardo Lima
  coordinator: 'acc-coord-01', // Ana Paula Ribeiro
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { db, getPersonById, getStudentsForGuardian } = useMockDatabase();

  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved === 'LOGGED_OUT') return null;
    return saved || DEFAULT_DEMO_ACCOUNT_BY_ROLE.coordinator;
  });

  const [selectedGuardianStudentId, setSelectedGuardianStudentId] = useState<string | null>(() => {
    return localStorage.getItem(SELECTED_STUDENT_STORAGE_KEY);
  });

  const currentAccount = useMemo(() => {
    if (!activeAccountId) return null;
    return db.accounts.find((acc) => acc.id === activeAccountId) ?? null;
  }, [activeAccountId, db.accounts]);

  const currentPerson = useMemo(() => {
    if (!currentAccount) return null;
    return getPersonById(currentAccount.personId) ?? null;
  }, [currentAccount, getPersonById]);

  const linkedStudentsForGuardian = useMemo(() => {
    if (!currentAccount || currentAccount.role !== 'guardian') return [];
    return getStudentsForGuardian(currentAccount.personId);
  }, [currentAccount, getStudentsForGuardian]);

  const selectedStudentForGuardian = useMemo(() => {
    if (linkedStudentsForGuardian.length === 0) return null;
    const found = linkedStudentsForGuardian.find((s) => s.id === selectedGuardianStudentId);
    return found ?? linkedStudentsForGuardian[0];
  }, [linkedStudentsForGuardian, selectedGuardianStudentId]);

  useEffect(() => {
    if (activeAccountId) {
      localStorage.setItem(SESSION_STORAGE_KEY, activeAccountId);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, 'LOGGED_OUT');
    }
  }, [activeAccountId]);

  useEffect(() => {
    if (selectedGuardianStudentId) {
      localStorage.setItem(SELECTED_STUDENT_STORAGE_KEY, selectedGuardianStudentId);
    } else {
      localStorage.removeItem(SELECTED_STUDENT_STORAGE_KEY);
    }
  }, [selectedGuardianStudentId]);

  const loginWithCredentials = useCallback(
    (identifier: string, passwordPlain: string): LoginResult => {
      const normalizedInput = normalizeIdentifier(identifier);
      if (!normalizedInput || !passwordPlain.trim()) {
        return {
          success: false,
          errorType: 'invalid_credentials',
          message: 'Por favor, preencha seu e-mail (ou CPF) e sua senha para entrar.',
        };
      }

      // Localiza a Person por email ou CPF
      const matchedPerson = db.persons.find((person) => {
        const emailMatch = person.email.toLowerCase() === normalizedInput;
        const cpfDigits = person.cpf.replace(/\D/g, '');
        const cpfMatch = cpfDigits.length > 0 && cpfDigits === normalizedInput;
        return emailMatch || cpfMatch;
      });

      if (!matchedPerson) {
        return {
          success: false,
          errorType: 'invalid_credentials',
          message:
            'Não encontramos um cadastro com este e-mail ou CPF. Confira os números digitados ou use o Acesso Rápido abaixo.',
        };
      }

      const account = db.accounts.find((acc) => acc.personId === matchedPerson.id);

      if (!account || account.passwordPlainDemo !== passwordPlain.trim()) {
        return {
          success: false,
          errorType: 'invalid_credentials',
          message:
            'A senha digitada não confere. Tente novamente (dica do protótipo: a senha padrão é 123456) ou clique em "Esqueci minha senha".',
        };
      }

      if (matchedPerson.status === 'inactive' || account.status === 'inactive') {
        return {
          success: false,
          errorType: 'inactive_user',
          message:
            'Seu cadastro está temporariamente inativo ou com matrícula trancada. Converse com a secretaria ou coordenação do Cursinho Bonsucesso para reativar seu acesso.',
        };
      }

      setActiveAccountId(account.id);
      if (account.role === 'guardian') {
        const children = getStudentsForGuardian(account.personId);
        if (children.length > 0) {
          setSelectedGuardianStudentId(children[0].id);
        }
      }

      return {
        success: true,
        role: account.role,
      };
    },
    [db.persons, db.accounts, getStudentsForGuardian]
  );

  const quickLoginAsRole = useCallback(
    (role: UserRole): LoginResult => {
      const targetAccountId = DEFAULT_DEMO_ACCOUNT_BY_ROLE[role];
      const account = db.accounts.find((acc) => acc.id === targetAccountId);
      if (!account) {
        return {
          success: false,
          errorType: 'invalid_credentials',
          message: 'Conta de demonstração não encontrada.',
        };
      }

      setActiveAccountId(account.id);
      if (role === 'guardian') {
        const children = getStudentsForGuardian(account.personId);
        if (children.length > 0) {
          setSelectedGuardianStudentId(children[0].id);
        }
      }

      return {
        success: true,
        role: account.role,
      };
    },
    [db.accounts, getStudentsForGuardian]
  );

  const logout = useCallback(() => {
    setActiveAccountId(null);
    setSelectedGuardianStudentId(null);
  }, []);

  const setSelectedStudentIdForGuardian = useCallback((studentPersonId: string) => {
    setSelectedGuardianStudentId(studentPersonId);
  }, []);

  const contextValue = useMemo<SessionContextValue>(
    () => ({
      isAuthenticated: Boolean(currentAccount && currentPerson),
      currentAccount,
      currentPerson,
      selectedStudentForGuardian,
      linkedStudentsForGuardian,
      setSelectedStudentIdForGuardian,
      loginWithCredentials,
      quickLoginAsRole,
      logout,
    }),
    [
      currentAccount,
      currentPerson,
      selectedStudentForGuardian,
      linkedStudentsForGuardian,
      setSelectedStudentIdForGuardian,
      loginWithCredentials,
      quickLoginAsRole,
      logout,
    ]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession deve ser utilizado dentro de um SessionProvider');
  }
  return context;
}
