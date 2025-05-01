import React, { Suspense } from 'react';
import { useLocation } from 'wouter';
import { usePortal } from '@/hooks/use-portal';
import { EyeOff } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

// Importar os componentes de conteúdo do Portal do Polo
import HubDashboardContent from '@/components/hub/hub-dashboard-content';

/**
 * Página de administrador para visualizar o Portal do Polo
 * 
 * Esta página importa e renderiza os componentes reais do portal do polo
 * em vez de duplicar a implementação, garantindo que a experiência seja idêntica.
 */
export const AdminHubViewPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const { setCurrentPortal } = usePortal();
  
  // Determinar qual componente de polo mostrar com base na rota atual
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
  // Função para retornar ao Portal Administrativo
  const returnToAdmin = () => {
    setCurrentPortal('admin');
    navigate('/admin/dashboard');
  };
  
  return (
    <AppShell>
      <div className="container px-4 py-6 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Visualização do Portal do Polo</h1>
            <p className="text-muted-foreground">
              Você está visualizando o sistema como um gestor de polo. Esta visualização permite entender melhor a experiência dos polos educacionais.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={returnToAdmin}
          >
            <EyeOff className="h-4 w-4" /> Voltar ao Portal Administrativo
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="students">Alunos</TabsTrigger>
          </TabsList>
          
          {/* Renderizar os componentes reais do Portal do Polo */}
          <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
            {activeTab === 'dashboard' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Renderiza apenas o conteúdo principal do HubDashboard, sem o AppShell */}
                <HubDashboardContent />
              </div>
            )}
            
            {activeTab === 'courses' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Aqui renderizaria o conteúdo da página de cursos */}
                <div className="p-4 text-center">
                  <h3 className="text-lg font-medium mb-2">Cursos do Polo</h3>
                  <p className="text-muted-foreground">Lista de cursos disponíveis neste polo educacional.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'students' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Aqui renderizaria o conteúdo da página de alunos */}
                <div className="p-4 text-center">
                  <h3 className="text-lg font-medium mb-2">Alunos do Polo</h3>
                  <p className="text-muted-foreground">Lista de alunos matriculados neste polo educacional.</p>
                </div>
              </div>
            )}
          </Suspense>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default AdminHubViewPage;