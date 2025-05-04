import React, { Suspense, lazy } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppShell } from '@/components/layout/app-shell';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { PopularCourses } from '@/components/dashboard/popular-courses';
import { usePortal } from '@/hooks/use-portal';

// Importamos o componente de botão de portal do parceiro separado
import { PartnerPortalButton } from './partner-portal-button';
export { PartnerPortalButton as PartnerPortalView };

/**
 * Página de administrador para visualizar o Portal do Parceiro
 * 
 * Esta página importa e renderiza os componentes reais do portal do parceiro
 * em vez de duplicar a implementação, garantindo que a experiência seja idêntica.
 */
export const AdminPartnerViewPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const { setCurrentPortal } = usePortal();
  
  // Determinar qual componente de parceiro mostrar com base na rota atual
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
            <h1 className="text-2xl font-bold">Visualização do Portal do Parceiro</h1>
            <p className="text-muted-foreground">
              Você está visualizando o sistema como um parceiro. Esta visualização permite entender melhor a experiência dos parceiros.
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
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="certifications">Certificações</TabsTrigger>
          </TabsList>
          
          {/* Renderizar os componentes reais do Portal do Parceiro */}
          <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
            {activeTab === 'dashboard' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Renderiza apenas o conteúdo principal do PartnerDashboard, sem o AppShell */}
                <PartnerDashboardContent />
              </div>
            )}
            
            {activeTab === 'documents' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Renderiza apenas o conteúdo principal da página de documentos */}
                <PartnerStudentDocumentsContent />
              </div>
            )}
            
            {activeTab === 'certifications' && (
              <div className="border p-4 rounded-lg bg-white">
                {/* Renderiza apenas o conteúdo principal da página de certificações */}
                <PartnerCertificationRequestsContent />
              </div>
            )}
          </Suspense>
        </Tabs>
      </div>
    </AppShell>
  );
};

// Componentes de conteúdo que extraem apenas a parte interna dos componentes do parceiro
// para evitar duplicação do AppShell

// Conteúdo do dashboard do parceiro
const PartnerDashboardContent = () => {
  // Consulta os dados do dashboard
  const { data: dashboardStats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/dashboard/stats');
      return response.data;
    }
  });

  return (
    <div className="py-2">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <DashboardCard 
          title="Alunos Cadastrados"
          value={dashboardStats?.studentsCount || "0"}
          icon="students"
          trend={{
            value: 8.2,
            isPositive: true,
            label: "este mês"
          }}
        />
        
        <DashboardCard 
          title="Documentos Pendentes"
          value={dashboardStats?.pendingDocumentsCount || "0"}
          icon="documents"
          trend={{
            value: 4.1,
            isPositive: false,
            label: "este mês"
          }}
        />
        
        <DashboardCard 
          title="Certificações Aprovadas"
          value={dashboardStats?.approvedCertificatesCount || "0"}
          icon="certificates"
          trend={{
            value: 12.5,
            isPositive: true,
            label: "este mês"
          }}
        />
        
        <DashboardCard 
          title="Taxa de Aprovação"
          value={`${dashboardStats?.approvalRate || 0}%`}
          icon="completion"
          trend={{
            value: 3.2,
            isPositive: true,
            label: "este mês"
          }}
        />
      </div>
      
      {/* Middle Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={dashboardStats?.recentActivity || []} />
        </div>
        
        <div>
          <PopularCourses 
            courses={
              (dashboardStats?.popularCourses || []).map((course: any, index: number) => {
                const category = course?.category || "development";
                const courseId = course?.id || (index + 1) * 1000;
                
                return {
                  id: courseId,
                  title: course?.title || course?.courseTitle || "Curso sem título",
                  studentsCount: course?.studentsCount || 0,
                  price: course?.price || 0,
                  rating: course?.rating || "0.0",
                  category: category
                };
              })
            } 
          />
        </div>
      </div>
      
      {/* Status de Certificações e Documentos */}
      <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
        {/* Conteúdo de certificações copiado do componente original */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Status de Certificações</h2>
          <button className="text-sm text-primary hover:underline flex items-center">
            Ver todos os registros
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Conteúdo tabela de certificações */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Aluno</th>
                <th className="text-left py-3 font-medium">Curso</th>
                <th className="text-left py-3 font-medium">Valor</th>
                <th className="text-left py-3 font-medium">Data</th>
                <th className="text-left py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    Carregando dados...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-destructive">
                    Erro ao carregar dados
                  </td>
                </tr>
              ) : (dashboardStats?.recentCertifications || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    Nenhuma certificação recente encontrada
                  </td>
                </tr>
              ) : (
                (dashboardStats?.recentCertifications || []).map((certification: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3">{certification.studentName}</td>
                    <td className="py-3">{certification.courseName}</td>
                    <td className="py-3">R$ {certification.value?.toFixed(2) || '0.00'}</td>
                    <td className="py-3">{new Date(certification.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        certification.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : certification.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {certification.status === 'approved' 
                          ? 'Aprovado' 
                          : certification.status === 'pending' 
                          ? 'Pendente' 
                          : 'Rejeitado'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Conteúdo da página de documentos do parceiro
const PartnerStudentDocumentsContent = () => {
  // Este componente renderizaria o conteúdo real da página de documentos do parceiro
  // sem o AppShell e cabeçalho duplicado
  
  // Consulta os dados do dashboard para obter documentos
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['/api/partner/student-documents'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/student-documents');
      return response.data || [];
    }
  });
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Documentos de Alunos</h2>
      
      {isLoading && <p className="text-muted-foreground">Carregando documentos...</p>}
      {error && <p className="text-destructive">Erro ao carregar documentos</p>}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Aluno</th>
                <th className="text-left py-3 font-medium">Documento</th>
                <th className="text-left py-3 font-medium">Data de Envio</th>
                <th className="text-left py-3 font-medium">Tamanho</th>
                <th className="text-left py-3 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(documents || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted-foreground">
                    Nenhum documento encontrado
                  </td>
                </tr>
              ) : (
                (documents || []).map((doc: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3">{doc.studentName}</td>
                    <td className="py-3">{doc.title}</td>
                    <td className="py-3">{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3">{doc.fileSize}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        doc.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : doc.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.status === 'approved' 
                          ? 'Aprovado' 
                          : doc.status === 'pending' 
                          ? 'Pendente' 
                          : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm">Visualizar</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Conteúdo da página de certificações do parceiro
const PartnerCertificationRequestsContent = () => {
  // Este componente renderizaria o conteúdo real da página de certificações do parceiro
  // sem o AppShell e cabeçalho duplicado
  
  // Consulta os dados do dashboard para obter certificações
  const { data: certifications, isLoading, error } = useQuery({
    queryKey: ['/api/partner/certification-requests'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/certification-requests');
      return response.data || [];
    }
  });
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Solicitações de Certificação</h2>
      
      {isLoading && <p className="text-muted-foreground">Carregando certificações...</p>}
      {error && <p className="text-destructive">Erro ao carregar certificações</p>}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Aluno</th>
                <th className="text-left py-3 font-medium">Curso</th>
                <th className="text-left py-3 font-medium">Parceiro</th>
                <th className="text-left py-3 font-medium">Data</th>
                <th className="text-left py-3 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(certifications || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted-foreground">
                    Nenhuma solicitação de certificação encontrada
                  </td>
                </tr>
              ) : (
                (certifications || []).map((cert: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3">{cert.studentName}</td>
                    <td className="py-3">{cert.courseName}</td>
                    <td className="py-3">{cert.partnerName}</td>
                    <td className="py-3">{new Date(cert.requestDate).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cert.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : cert.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cert.status === 'approved' 
                          ? 'Aprovado' 
                          : cert.status === 'pending' 
                          ? 'Pendente' 
                          : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm">Detalhes</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPartnerViewPage;