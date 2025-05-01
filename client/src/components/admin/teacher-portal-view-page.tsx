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

// Importar os componentes de conteúdo do Portal do Professor
import TeacherDashboardContent from '@/components/teacher/teacher-dashboard-content';

/**
 * Página de administrador para visualizar o Portal do Professor
 * 
 * Esta página importa e renderiza os componentes reais do portal do professor
 * em vez de duplicar a implementação, garantindo que a experiência seja idêntica.
 */
export const AdminTeacherViewPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const { setCurrentPortal } = usePortal();
  
  // Determinar qual componente de professor mostrar com base na rota atual
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
            <h1 className="text-2xl font-bold">Visualização do Portal do Professor</h1>
            <p className="text-muted-foreground">
              Você está visualizando o sistema como um professor. Esta visualização permite entender melhor a experiência dos professores.
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
            <TabsTrigger value="classes">Turmas</TabsTrigger>
            <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          </TabsList>
          
          {/* Renderizar os componentes reais do Portal do Professor */}
          <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
            {activeTab === 'dashboard' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Renderiza apenas o conteúdo principal do TeacherDashboard, sem o AppShell */}
                <TeacherDashboardContent />
              </div>
            )}
            
            {activeTab === 'classes' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Futuramente será implementado o conteúdo das turmas */}
                <div className="p-6 text-center">
                  <p className="text-lg font-medium">Visualização de Turmas</p>
                  <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
                </div>
              </div>
            )}
            
            {activeTab === 'assessments' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Futuramente será implementado o conteúdo das avaliações */}
                <div className="p-6 text-center">
                  <p className="text-lg font-medium">Visualização de Avaliações</p>
                  <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
                </div>
              </div>
            )}
          </Suspense>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default AdminTeacherViewPage;