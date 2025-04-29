import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | { method: string; body?: string; headers?: Record<string, string> },
  options?: RequestInit,
): Promise<Response> {
  let url: string;
  let requestOptions: RequestInit;

  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    requestOptions = options || {};
  } else {
    url = urlOrOptions.method.includes(' ') 
      ? urlOrOptions.method.split(' ')[1] 
      : urlOrOptions.method;
    requestOptions = {
      method: urlOrOptions.method.includes(' ') 
        ? urlOrOptions.method.split(' ')[0] 
        : 'GET',
      body: urlOrOptions.body,
      headers: urlOrOptions.headers,
    };
  }

  const res = await fetch(url, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...requestOptions.headers,
    },
    credentials: 'include',
  });

  await throwIfResNotOk(res);
  return res;
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
