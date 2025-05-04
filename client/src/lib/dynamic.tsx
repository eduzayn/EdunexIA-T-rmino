import React, { useState, useEffect } from 'react';

/**
 * Função auxiliar para carregar componentes dinamicamente.
 * Similar à funcionalidade dynamic() do Next.js, mas para React em Vite.
 */
export default function dynamic<T>(loader: () => Promise<any>) {
  return function DynamicComponent(props: any) {
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
    
    useEffect(() => {
      let isMounted = true;
      
      (async () => {
        try {
          const module = await loader();
          if (isMounted) {
            setComponent(() => module.default || module);
          }
        } catch (error) {
          console.error('Error loading dynamic component:', error);
        }
      })();
      
      return () => {
        isMounted = false;
      };
    }, []);
    
    if (!Component) {
      // Placeholder enquanto carrega
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}