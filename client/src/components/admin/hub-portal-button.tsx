import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { usePortal } from '@/hooks/use-portal';

/**
 * Componente que permite ao administrador alternar entre a visualização
 * do Portal do Polo e o Portal Administrativo usando o botão flutuante
 */
export const HubPortalButton: React.FC = () => {
  const [isHubView, setIsHubView] = useState(false);
  const [location, navigate] = useLocation();
  const { setCurrentPortal } = usePortal();
  
  // Mapeamento de rotas entre os portais
  const routeMap: Record<string, { admin: string, hub: string }> = {
    // Dashboards
    "/admin/hub-view": { 
      admin: "/admin/dashboard", 
      hub: "/hub/dashboard" 
    },
    // Cursos
    "/admin/courses": { 
      admin: "/admin/courses", 
      hub: "/hub/courses" 
    },
    // Estudantes
    "/admin/students": { 
      admin: "/admin/students", 
      hub: "/hub/students" 
    },
    // Professores
    "/admin/teachers": { 
      admin: "/admin/teachers", 
      hub: "/hub/teachers" 
    }
  };
  
  // Identificar a rota atual e seu equivalente no outro portal
  const currentRouteMap = Object.entries(routeMap).find(([adminRoute, _]) => 
    location.startsWith(adminRoute)
  );
  
  const toggleView = () => {
    // Alternar o estado
    const newIsHubView = !isHubView;
    setIsHubView(newIsHubView);
    
    // Se a mudança for para visualização do polo
    if (newIsHubView) {
      // Muda para o portal do polo
      setCurrentPortal('hub');
      
      // Se estiver em uma rota mapeada, navegar para a rota equivalente no portal do polo
      if (currentRouteMap) {
        navigate(currentRouteMap[1].hub);
      } else {
        // Caso contrário, ir para o dashboard do polo
        navigate('/hub/dashboard');
      }
    } else {
      // Se a mudança for para visualização de admin, voltar para o dashboard admin
      setCurrentPortal('admin');
      navigate('/admin/dashboard');
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={toggleView} 
        variant="default" 
        size="lg" 
        className="rounded-full w-14 h-14 shadow-lg"
      >
        {isHubView ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
      </Button>
      <span className="sr-only">
        {isHubView ? 'Voltar ao Portal Administrativo' : 'Ver como Polo'}
      </span>
    </div>
  );
};

export default HubPortalButton;