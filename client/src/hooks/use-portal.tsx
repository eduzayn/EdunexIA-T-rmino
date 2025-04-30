import { createContext, useContext, useState, ReactNode } from "react";

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
}

// Lista de portais disponíveis com suas configurações
export const PORTALS: PortalConfig[] = [
  {
    id: 'admin',
    name: 'Portal Administrativo',
    description: 'Gerenciamento completo do ambiente educacional',
    baseRoute: '/admin',
  },
  {
    id: 'student',
    name: 'Portal do Aluno',
    description: 'Acesso a cursos, avaliações e material didático',
    baseRoute: '/student',
  },
  {
    id: 'teacher',
    name: 'Portal do Professor', 
    description: 'Gerenciamento de turmas, conteúdo e avaliações',
    baseRoute: '/teacher',
  },
  {
    id: 'hub',
    name: 'Portal do Polo',
    description: 'Gerenciamento de unidades educacionais',
    baseRoute: '/hub',
  },
  {
    id: 'partner',
    name: 'Portal do Parceiro',
    description: 'Gerenciamento de certificações e parcerias',
    baseRoute: '/partner',
  }
];

// Interface do contexto de portal
interface PortalContextType {
  currentPortal: PortalConfig;
  setCurrentPortal: (portal: PortalType) => void;
  portals: PortalConfig[];
}

// Valor padrão para o contexto (Portal Administrativo)
const defaultPortal = PORTALS.find(p => p.id === 'admin') as PortalConfig;

// Criação do contexto
export const PortalContext = createContext<PortalContextType>({
  currentPortal: defaultPortal,
  setCurrentPortal: () => {},
  portals: PORTALS
});

// Props do provider
interface PortalProviderProps {
  children: ReactNode;
}

// Provider que gerencia o estado do portal selecionado
export function PortalProvider({ children }: PortalProviderProps) {
  const [currentPortal, setCurrentPortalState] = useState<PortalConfig>(defaultPortal);

  // Função para alterar o portal atual
  const setCurrentPortal = (portalId: PortalType) => {
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
      portals: PORTALS
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