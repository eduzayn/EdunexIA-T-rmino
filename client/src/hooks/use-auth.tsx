import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginData = Pick<InsertUser, "username" | "password">;

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

// Criando contexto com valor padrão para evitar problemas de HMR
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as UseMutationResult<SelectUser, Error, LoginData>,
  logoutMutation: {} as UseMutationResult<void, Error, void>,
  registerMutation: {} as UseMutationResult<SelectUser, Error, InsertUser>,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  console.log("AuthProvider - Inicializando");
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  console.log("AuthProvider - Estado atual:", { user, isLoading, error });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("loginMutation - Iniciando login com:", credentials.username);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        console.log("loginMutation - Resposta bruta:", res);
        
        // Verificar se a resposta é JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          console.log("loginMutation - Resposta do servidor (JSON):", data);
          return data;
        } else {
          // Se não for JSON, exibir erro
          const text = await res.text();
          console.error("loginMutation - Resposta não-JSON:", text);
          throw new Error("Resposta inválida do servidor");
        }
      } catch (error) {
        console.error("loginMutation - Erro ao processar requisição:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("loginMutation - Login bem sucedido:", user);
      queryClient.setQueryData(["/api/user"], user);
      // Forçar refetch dos dados do usuário
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      console.error("loginMutation - Erro no login:", error);
      toast({
        title: "Falha no login",
        description: error.message || "Ocorreu um erro durante o login.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo(a) ao Edunéxia, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao sair",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
