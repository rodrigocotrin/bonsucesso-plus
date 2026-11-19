import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { UserRole } from '../../types';
import { getDefaultRouteForRole } from '../../utils/formatters';

export interface PrivateRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

/**
 * Controle de Acesso Baseado em Perfil (RBAC).
 * - Se não estiver autenticado, redireciona para /login preservando a intenção.
 * - Se estiver autenticado mas tentar acessar rota exclusiva de outro perfil,
 *   redireciona com segurança para a página inicial do seu próprio perfil.
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, currentAccount } = useSession();
  const location = useLocation();

  if (!isAuthenticated || !currentAccount) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentAccount.role)) {
    const safeHome = getDefaultRouteForRole(currentAccount.role);
    return <Navigate to={safeHome} replace />;
  }

  return <>{children}</>;
};
