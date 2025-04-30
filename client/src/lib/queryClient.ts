import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Tenta ler e analisar o corpo da resposta como JSON primeiro
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        throw new Error(json.message || `${res.status}: ${res.statusText}`);
      } else {
        // Verifica se o texto parece HTML
        const text = await res.text();
        if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html>')) {
          throw new Error(`${res.status}: Erro no servidor. Contate o suporte.`);
        } else {
          throw new Error(`${res.status}: ${text || res.statusText}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options?: RequestInit,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data);
  
  // Configure as opções da requisição
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    ...options,
  };
  
  // Adicionar dados ao corpo da requisição se fornecidos
  if (data !== undefined) {
    requestOptions.body = JSON.stringify(data);
  }
  
  try {
    console.log(`Enviando requisição para ${url}`, requestOptions);
    const res = await fetch(url, requestOptions);
    
    console.log(`Resposta de ${url}:`, {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries([...res.headers.entries()]),
    });
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
