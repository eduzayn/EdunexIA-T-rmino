import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/lib/protected-route';
import { Eye, EyeOff, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const [location, navigate] = useLocation();
  
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
            onClick={() => navigate('/admin/dashboard')}
          >
            <EyeOff className="h-4 w-4" /> Voltar ao Portal Administrativo
          </Button>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="certifications">Certificações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            {/* Componente PartnerDashboard importado e renderizado diretamente */}
            <div className="p-6 bg-white rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Dashboard do Parceiro</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Alunos Cadastrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end">
                      <div className="text-2xl font-bold">42</div>
                      <div className="text-xs font-medium text-green-600">
                        <span>+8.2%</span>
                        <span className="text-gray-400 ml-1">este mês</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-none shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Documentos Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end">
                      <div className="text-2xl font-bold">8</div>
                      <div className="text-xs font-medium text-red-600">
                        <span>+4.1%</span>
                        <span className="text-gray-400 ml-1">este mês</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-none shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Certificações Aprovadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end">
                      <div className="text-2xl font-bold">15</div>
                      <div className="text-xs font-medium text-green-600">
                        <span>+12.5%</span>
                        <span className="text-gray-400 ml-1">este mês</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-none shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Taxa de Aprovação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end">
                      <div className="text-2xl font-bold">75%</div>
                      <div className="text-xs font-medium text-gray-400">
                        <span className="text-gray-400">média</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                    <CardDescription>Últimas ações realizadas na plataforma</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full w-8 h-8 bg-green-100 flex items-center justify-center text-green-600">✓</div>
                        <div>
                          <h4 className="font-medium">Documentação aprovada</h4>
                          <p className="text-sm text-muted-foreground">Documento de Identidade de João Silva foi aprovado</p>
                          <p className="text-xs text-muted-foreground mt-1">Hoje</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="rounded-full w-8 h-8 bg-blue-100 flex items-center justify-center text-blue-600">⟳</div>
                        <div>
                          <h4 className="font-medium">Certificação solicitada</h4>
                          <p className="text-sm text-muted-foreground">Nova solicitação de certificação para o curso de React</p>
                          <p className="text-xs text-muted-foreground mt-1">Hoje</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="rounded-full w-8 h-8 bg-purple-100 flex items-center justify-center text-purple-600">+</div>
                        <div>
                          <h4 className="font-medium">Novo aluno registrado</h4>
                          <p className="text-sm text-muted-foreground">Pedro Santos foi adicionado à sua lista de alunos</p>
                          <p className="text-xs text-muted-foreground mt-1">Ontem</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Certificações Recentes</CardTitle>
                    <CardDescription>Últimas certificações processadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <h4 className="font-medium">João Silva</h4>
                          <p className="text-sm text-muted-foreground">Desenvolvimento Web com React</p>
                        </div>
                        <Badge>Aprovado</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <h4 className="font-medium">Maria Oliveira</h4>
                          <p className="text-sm text-muted-foreground">Python para Ciência de Dados</p>
                        </div>
                        <Badge variant="outline">Pendente</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Ana Souza</h4>
                          <p className="text-sm text-muted-foreground">UX/UI Design</p>
                        </div>
                        <Badge variant="destructive">Rejeitado</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Seus Cursos Populares</CardTitle>
                  <CardDescription>Cursos com mais matrículas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div className="flex gap-4 items-center">
                        <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-md flex items-center justify-center">
                          <span className="font-bold">R</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Desenvolvimento Web com React</h4>
                          <div className="flex text-yellow-400 text-xs mt-1">
                            ★★★★★ <span className="text-muted-foreground ml-1">4.8</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">42 alunos</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div className="flex gap-4 items-center">
                        <div className="bg-green-100 text-green-600 w-10 h-10 rounded-md flex items-center justify-center">
                          <span className="font-bold">P</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Python para Ciência de Dados</h4>
                          <div className="flex text-yellow-400 text-xs mt-1">
                            ★★★★★ <span className="text-muted-foreground ml-1">4.6</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">38 alunos</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-md flex items-center justify-center">
                          <span className="font-bold">IA</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Inteligência Artificial - Fundamentos</h4>
                          <div className="flex text-yellow-400 text-xs mt-1">
                            ★★★★★ <span className="text-muted-foreground ml-1">4.5</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">35 alunos</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <div className="p-6 bg-white rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Documentos de Alunos</h2>
                  <p className="text-muted-foreground">
                    Gerencie todos os documentos enviados pelos alunos
                  </p>
                </div>
                <Button>Enviar Novo Documento</Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Nome do Aluno</TableHead>
                      <TableHead className="w-[200px]">Documento</TableHead>
                      <TableHead className="w-[150px]">Data de Envio</TableHead>
                      <TableHead className="w-[100px]">Tamanho</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">João Silva</TableCell>
                      <TableCell>Documento de Identidade</TableCell>
                      <TableCell>20/04/2025</TableCell>
                      <TableCell>1.2 MB</TableCell>
                      <TableCell>
                        <Badge variant="default">Aprovado</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">Maria Oliveira</TableCell>
                      <TableCell>Comprovante de Endereço</TableCell>
                      <TableCell>22/04/2025</TableCell>
                      <TableCell>856 KB</TableCell>
                      <TableCell>
                        <Badge variant="outline">Pendente</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">Pedro Santos</TableCell>
                      <TableCell>Diploma</TableCell>
                      <TableCell>25/04/2025</TableCell>
                      <TableCell>2.3 MB</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Rejeitado</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="certifications" className="space-y-4">
            <div className="p-6 bg-white rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Solicitações de Certificação</h2>
                  <p className="text-muted-foreground">
                    Gerencie todas as solicitações de certificação
                  </p>
                </div>
                <Button>Nova Solicitação</Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nome do Aluno</TableHead>
                      <TableHead className="w-[250px]">Curso</TableHead>
                      <TableHead className="w-[150px]">Data de Solicitação</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">João Silva</TableCell>
                      <TableCell>Desenvolvimento Web com React</TableCell>
                      <TableCell>15/04/2025</TableCell>
                      <TableCell>
                        <Badge variant="default">Aprovado</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">Maria Oliveira</TableCell>
                      <TableCell>Python para Ciência de Dados</TableCell>
                      <TableCell>22/04/2025</TableCell>
                      <TableCell>
                        <Badge variant="outline">Pendente</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">Ana Souza</TableCell>
                      <TableCell>UX/UI Design</TableCell>
                      <TableCell>25/04/2025</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Rejeitado</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default AdminPartnerViewPage;