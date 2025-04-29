import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
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

  console.log("ProtectedRoute - Renderizando componente protegido");
  return <Route path={path} component={Component} />;
}
