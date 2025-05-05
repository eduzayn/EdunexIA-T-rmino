import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Componente para login automático com credenciais de admin
 * Apenas para desenvolvimento - não usar em produção
 */
export function AutoLogin() {
  const { user, loginMutation } = useAuth();
  const [isAttempting, setIsAttempting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Credenciais de teste
  const credentials = {
    username: 'admintest',
    password: 'password123'
  };

  // Tenta fazer login automaticamente na inicialização
  useEffect(() => {
    // Não tenta novamente se já está logado ou se já tentou anteriormente
    if (user || isAttempting || attempts > 0) return;
    
    const autoLogin = async () => {
      try {
        setIsAttempting(true);
        setError(null);
        console.log('Tentando login automático com:', credentials.username);
        loginMutation.mutate(credentials);
      } catch (err) {
        console.error('Erro no login automático:', err);
        setError(typeof err === 'string' ? err : 'Falha no login automático');
      } finally {
        setIsAttempting(false);
        setAttempts(prev => prev + 1);
      }
    };

    // Pequeno delay para garantir que o componente esteja totalmente montado
    const timer = setTimeout(() => {
      autoLogin();
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, loginMutation, isAttempting, attempts]);

  // Manipulador para tentar login manual
  const handleManualLogin = () => {
    setIsAttempting(true);
    setError(null);
    console.log('Tentando login manual com:', credentials.username);
    loginMutation.mutate(credentials);
    setAttempts(prev => prev + 1);
  };

  if (user) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-green-100 dark:bg-green-900/30 p-3 rounded-md shadow-md text-sm">
        <div className="text-green-700 dark:text-green-300 font-medium flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          Autenticado como {user.username} ({user.role})
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Auto Login</CardTitle>
          <CardDescription>
            Conectando automaticamente com a conta de administrador...
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          
          {(isAttempting || loginMutation.isPending) ? (
            <div className="flex flex-col items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-center text-muted-foreground">
                Conectando como administrador...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Usuário:</div>
                <div className="font-medium">{credentials.username}</div>
                <div className="text-muted-foreground">Senha:</div>
                <div className="font-medium">{credentials.password}</div>
              </div>
              
              <Button 
                onClick={handleManualLogin} 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                Login Manual
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-2">
                Tentativa {attempts} de login automático.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}