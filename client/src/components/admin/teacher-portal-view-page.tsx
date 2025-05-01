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
import TeacherDashboardContent from '@/components/teacher/teacher-dashboard-content'

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
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex space-x-1 mb-4">
            <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
            <TabsTrigger value="classes" className="flex-1">Turmas</TabsTrigger>
            <TabsTrigger value="assessments" className="flex-1">Avaliações</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">Agenda</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <TeacherDashboardContent />
          </TabsContent>
          
          <TabsContent value="classes">
            <div className="p-4 bg-card rounded-md mt-4">
              <p className="text-muted-foreground">
                Visualização de turmas do professor será implementada em uma próxima fase.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="assessments">
            <div className="p-4 bg-card rounded-md mt-4">
              <p className="text-muted-foreground">
                Visualização de avaliações do professor será implementada em uma próxima fase.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule">
            <div className="p-4 bg-card rounded-md mt-4">
              <p className="text-muted-foreground">
                Visualização da agenda do professor será implementada em uma próxima fase.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default AdminTeacherViewPage;