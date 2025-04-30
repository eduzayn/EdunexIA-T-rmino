import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/lib/protected-route';
import { Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppShell } from '@/components/layout/app-shell';

/**
 * Componente que permite ao administrador alternar entre a visualização
 * do Portal do Parceiro e o Portal Administrativo
 */
export const PartnerPortalView: React.FC = () => {
  const [isPartnerView, setIsPartnerView] = useState(true);
  const [location, navigate] = useLocation();
  
  // Mapeamento de rotas entre os portais
  const routeMap: Record<string, { admin: string, partner: string }> = {
    // Dashboards
    "/admin/partner-view": { 
      admin: "/admin/dashboard", 
      partner: "/partner/dashboard" 
    },
    // Certificações
    "/admin/partner-certifications": { 
      admin: "/admin/partner-certifications", 
      partner: "/partner/certification-requests" 
    },
    // Documentos
    "/admin/student-documents": { 
      admin: "/admin/student-documents", 
      partner: "/partner/student-documents" 
    }
  };
  
  // Identificar a rota atual e seu equivalente no outro portal
  const currentRouteMap = Object.entries(routeMap).find(([adminRoute, _]) => 
    location.startsWith(adminRoute)
  );
  
  const toggleView = () => {
    // Alternar o estado
    const newIsPartnerView = !isPartnerView;
    setIsPartnerView(newIsPartnerView);
    
    // Se a mudança for para visualização de admin, voltar para o dashboard admin
    if (!newIsPartnerView) {
      navigate('/admin/dashboard');
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={toggleView}
        className="rounded-full h-12 w-12 shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90"
        title={isPartnerView ? "Voltar à visualização de administrador" : "Alternar para visualização de parceiro"}
      >
        {isPartnerView ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </Button>
    </div>
  );
};

/**
 * Página de administrador para visualizar o Portal do Parceiro
 */
export const AdminPartnerViewPage: React.FC = () => {
  return (
    <AppShell>
      <div className="container px-4 py-6 mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Visualização do Portal do Parceiro</h1>
          <p className="text-muted-foreground">
            Você está visualizando o sistema como um parceiro. Esta visualização permite entender melhor a experiência dos parceiros.
          </p>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="certifications">Certificações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard do Parceiro</CardTitle>
                <CardDescription>
                  Visão geral das atividades do parceiro com a plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <iframe 
                  src="/partner/dashboard" 
                  className="w-full min-h-[600px] border-0"
                  title="Portal do Parceiro - Dashboard"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => window.open('/partner/dashboard', '_blank')}
                  variant="outline"
                >
                  Abrir em nova aba
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentos do Parceiro</CardTitle>
                <CardDescription>
                  Documentos submetidos pelos parceiros para aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <iframe 
                  src="/partner/student-documents" 
                  className="w-full min-h-[600px] border-0"
                  title="Portal do Parceiro - Documentos"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => window.open('/partner/student-documents', '_blank')}
                  variant="outline"
                >
                  Abrir em nova aba
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Certificações do Parceiro</CardTitle>
                <CardDescription>
                  Solicitações de certificações realizadas pelos parceiros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <iframe 
                  src="/partner/certification-requests" 
                  className="w-full min-h-[600px] border-0"
                  title="Portal do Parceiro - Certificações"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => window.open('/partner/certification-requests', '_blank')}
                  variant="outline"
                >
                  Abrir em nova aba
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        <PartnerPortalView />
      </div>
    </AppShell>
  );
};

export default AdminPartnerViewPage;