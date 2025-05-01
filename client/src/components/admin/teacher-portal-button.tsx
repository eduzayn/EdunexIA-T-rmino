import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { usePortal } from '@/hooks/use-portal';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Componente que permite ao administrador alternar entre a visualização
 * do Portal do Professor e o Portal Administrativo usando o botão flutuante
 */
export const TeacherPortalButton: React.FC = () => {
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [location, navigate] = useLocation();
  const { setCurrentPortal } = usePortal();
  
  // Mapeamento de rotas entre os portais
  const routeMap: Record<string, { admin: string, teacher: string }> = {
    // Dashboards
    "/admin/teacher-view": { 
      admin: "/admin/dashboard", 
      teacher: "/teacher/dashboard" 
    },
    // Turmas
    "/admin/classes": { 
      admin: "/admin/classes", 
      teacher: "/teacher/classes" 
    },
    // Disciplinas
    "/admin/subjects": { 
      admin: "/admin/subjects", 
      teacher: "/teacher/subjects" 
    },
    // Cursos
    "/admin/courses": { 
      admin: "/admin/courses", 
      teacher: "/teacher/courses" 
    },
    // Avaliações
    "/admin/assessments": { 
      admin: "/admin/assessments", 
      teacher: "/teacher/assessments" 
    }
  };
  
  // Identificar a rota atual e seu equivalente no outro portal
  const currentRouteMap = Object.entries(routeMap).find(([adminRoute, _]) => 
    location.startsWith(adminRoute)
  );
  
  const toggleView = () => {
    // Alternar o estado
    const newIsTeacherView = !isTeacherView;
    setIsTeacherView(newIsTeacherView);
    
    // Se a mudança for para visualização do professor
    if (newIsTeacherView) {
      // Muda para o portal do professor
      setCurrentPortal('teacher');
      
      // Se estiver em uma rota mapeada, navegar para a rota equivalente no portal do professor
      if (currentRouteMap) {
        navigate(currentRouteMap[1].teacher);
      } else {
        // Caso contrário, ir para o dashboard do professor
        navigate('/teacher/dashboard');
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
        {isTeacherView ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
      </Button>
      <span className="sr-only">
        {isTeacherView ? 'Voltar ao Portal Administrativo' : 'Ver como Professor'}
      </span>
    </div>
  );
};

export default TeacherPortalButton;