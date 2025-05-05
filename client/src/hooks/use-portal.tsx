import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Tipos de portais disponíveis no sistema
export type PortalType = 
  | 'admin'     // Portal Administrativo
  | 'student'   // Portal do Aluno
  | 'teacher'   // Portal do Professor
  | 'hub'       // Portal do Polo
  | 'partner';  // Portal do Parceiro

// Informações de configuração para cada tipo de portal
export interface PortalConfig {
  id: PortalType;
  name: string;
  description: string;
  baseRoute: string;
  icon?: string;
  requiredRole?: PortalType; // Papel necessário para acessar este portal
}

// Lista de portais disponíveis com suas configurações
export const PORTALS: PortalConfig[] = [
  {
    id: 'admin',
    name: 'Portal Administrativo',
    description: 'Gerenciamento completo do ambiente educacional',
    baseRoute: '/admin',
    requiredRole: 'admin'
  },
  {
    id: 'student',
    name: 'Portal do Aluno',
    description: 'Acesso a cursos, avaliações e material didático',
    baseRoute: '/student',
    requiredRole: 'student'
  },
  {
    id: 'teacher',
    name: 'Portal do Professor', 
    description: 'Gerenciamento de turmas, conteúdo e avaliações',
    baseRoute: '/teacher',
    requiredRole: 'teacher'
  },
  {
    id: 'hub',
    name: 'Portal do Polo',
    description: 'Gerenciamento de unidades educacionais',
    baseRoute: '/hub',
    requiredRole: 'hub'
  },
  {
    id: 'partner',
    name: 'Portal do Parceiro',
    description: 'Gerenciamento de certificações e parcerias',
    baseRoute: '/partner',
    requiredRole: 'partner'
  }
];

// Interface do contexto de portal
interface PortalContextType {
  currentPortal: PortalConfig;
  setCurrentPortal: (portal: PortalType) => void;
  portals: PortalConfig[];
  availablePortals: PortalConfig[]; // Portais disponíveis para o usuário atual
}

// Valor padrão para o contexto (Portal Administrativo)
const defaultPortal = PORTALS.find(p => p.id === 'admin') as PortalConfig;

// Criação do contexto
export const PortalContext = createContext<PortalContextType>({
  currentPortal: defaultPortal,
  setCurrentPortal: () => {},
  portals: PORTALS,
  availablePortals: PORTALS
});

// Props do provider
interface PortalProviderProps {
  children: ReactNode;
}

// Provider que gerencia o estado do portal selecionado
export function PortalProvider({ children }: PortalProviderProps) {
  const { user } = useAuth();
  const [currentPortal, setCurrentPortalState] = useState<PortalConfig>(defaultPortal);
  const [availablePortals, setAvailablePortals] = useState<PortalConfig[]>(PORTALS);

  // Determinar quais portais estão disponíveis com base no papel do usuário
  useEffect(() => {
    if (user) {
      // Admin tem acesso a todos os portais
      if (user.role === 'admin') {
        setAvailablePortals(PORTALS);
        return;
      }
      
      // Outros usuários só têm acesso ao portal correspondente ao seu papel
      const userRole = user.role as PortalType;
      const userPortal = PORTALS.find(p => p.id === userRole);
      
      if (userPortal) {
        setAvailablePortals([userPortal]);
        
        // Se o portal atual não estiver disponível para o usuário, mudar para o portal correspondente ao seu papel
        if (currentPortal.id !== userRole) {
          setCurrentPortalState(userPortal);
          localStorage.setItem('edunexia-current-portal', userRole);
        }
      } else {
        // Se o papel do usuário não corresponder a nenhum portal, usar o portal do aluno como fallback
        const fallbackPortal = PORTALS.find(p => p.id === 'student') as PortalConfig;
        setAvailablePortals([fallbackPortal]);
        setCurrentPortalState(fallbackPortal);
        localStorage.setItem('edunexia-current-portal', 'student');
      }
    }
  }, [user, currentPortal.id]);

  // Função para alterar o portal atual
  const setCurrentPortal = (portalId: PortalType) => {
    // Verificar se o portal está disponível para o usuário
    const isAvailable = availablePortals.some(p => p.id === portalId);
    
    if (!isAvailable && user?.role !== 'admin') {
      console.error('Portal não disponível para este usuário');
      return;
    }
    
    const portal = PORTALS.find(p => p.id === portalId);
    if (portal) {
      setCurrentPortalState(portal);
      // Salvar em localStorage para persistir entre sessões
      localStorage.setItem('edunexia-current-portal', portalId);
      
      // Não redirecionamos automaticamente mais, permitindo que a navegação
      // seja feita pelos links na barra lateral
    }
  };

  return (
    <PortalContext.Provider value={{ 
      currentPortal, 
      setCurrentPortal,
      portals: PORTALS,
      availablePortals
    }}>
      {children}
    </PortalContext.Provider>
  );
}

// Hook personalizado para acessar o contexto de portal
export function usePortal() {
  const context = useContext(PortalContext);
  
  if (context === undefined) {
    throw new Error("usePortal deve ser usado dentro de um PortalProvider");
  }
  
  return context;
}