import { QueryClient } from '@tanstack/react-query';

// Criação do cliente de consulta para o React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

// Interface estendida para incluir a propriedade data
interface ApiRequestOptions extends RequestInit {
  data?: any;
}

// Função auxiliar para fazer solicitações à API
export const apiRequest = async (
  url: string,
  options: ApiRequestOptions = {}
): Promise<any> => {
  try {
    // Garantir que a URL começa com '/'
    const apiUrl = url.startsWith('/') ? url : `/${url}`;
    
    // Configuração padrão para a solicitação
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };
    
    // Mesclar opções padrão com as opções fornecidas
    const requestOptions: RequestInit = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    };
    
    // Se houver dados para enviar e não for FormData, converter para JSON
    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method) && options.data) {
      if (!(options.body instanceof FormData)) {
        requestOptions.body = JSON.stringify(options.data);
      }
    }
    
    // A propriedade data não faz parte de RequestInit, então não a incluímos
    
    // Fazer a solicitação
    const response = await fetch(apiUrl, requestOptions);
    
    // Se o status não for de sucesso, lançar erro
    if (!response.ok) {
      // Tentar obter detalhes do erro a partir do corpo da resposta
      let errorDetail = '';
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.message || errorBody.error || JSON.stringify(errorBody);
      } catch (e) {
        errorDetail = response.statusText;
      }
      
      throw new Error(`API Error: ${response.status} - ${errorDetail}`);
    }
    
    // Tentar analisar a resposta como JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return {
        data: await response.json(),
        status: response.status,
      };
    }
    
    // Se não for JSON, retornar o texto
    return {
      data: await response.text(),
      status: response.status,
    };
    
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};