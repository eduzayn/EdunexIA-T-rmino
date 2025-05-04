import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type RoleType = 'admin' | 'student' | 'teacher' | 'partner' | 'hub';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  /**
   * Lista de papéis que podem acessar esta rota.
   * Se não for especificado, qualquer usuário autenticado pode acessar.
   * Administradores sempre têm acesso a todas as rotas.
   */
  roles?: RoleType[];
}

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  // Adicionar logs para depuração
  console.log("ProtectedRoute - path:", path);
  console.log("ProtectedRoute - isLoading:", isLoading);
  console.log("ProtectedRoute - user:", user);

  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="ml-4 text-lg">Carregando...</div>
          </div>
        )}
      </Route>
    );
  }

  if (!user) {
    console.log("ProtectedRoute - Redirecionando para /auth");
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }

  // Verificar se o usuário tem permissão para acessar esta rota
  // Administradores sempre têm acesso a qualquer rota
  const hasAccess = 
    user.role === 'admin' || 
    !roles || // Se não foram especificados papéis, qualquer usuário autenticado pode acessar
    roles.includes(user.role as RoleType);

  if (!hasAccess) {
    console.log("ProtectedRoute - Acesso negado por falta de permissão. Papel do usuário:", user.role);
    // Redirecionar para uma página de acesso negado ou para o dashboard principal
    return (
      <Route path={path}>
        {() => <Redirect to="/" />}
      </Route>
    );
  }

  console.log("ProtectedRoute - Renderizando componente protegido");
  return <Route path={path} component={Component} />;
}
