import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Megaphone, 
  RefreshCw, 
  PlusCircle, 
  FileBarChart, 
  Users, 
  LineChart, 
  Mail,
  MessageSquare,
  Calendar
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Componente principal da página de Campanhas
export default function CampaignsPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("active");
  
  // Função para mostrar que a funcionalidade está em desenvolvimento
  const showComingSoonToast = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve.",
      variant: "default",
    });
  };
  
  return (
    <AppShell>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">
              Crie e gerencie campanhas de marketing para seus cursos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={showComingSoonToast}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              size="sm"
              onClick={showComingSoonToast}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>
        
        {/* Tabs para filtrar campanhas por status */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Ativas</TabsTrigger>
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da Tab Ativas */}
          <TabsContent value="active">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Card de Email Campaigns */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">E-mail</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Campanhas ativas
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de SMS/WhatsApp Campaigns */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">SMS/WhatsApp</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Campanhas ativas
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Eventos */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Eventos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Eventos ativos
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Leads Gerados */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total de leads
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Campanhas Ativas</CardTitle>
                <CardDescription>
                  Campanhas de marketing em execução no momento
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Módulo em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      O módulo de Campanhas estará disponível em breve para ajudar nas suas estratégias de marketing.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Agendadas */}
          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Campanhas Agendadas</CardTitle>
                <CardDescription>
                  Campanhas prontas para iniciar automaticamente nas datas programadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Agendamentos em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      Em breve você poderá programar campanhas para iniciar automaticamente em datas específicas.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Concluídas */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Campanhas Concluídas</CardTitle>
                <CardDescription>
                  Histórico e resultados de campanhas finalizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Análise de Resultados em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      Em breve você poderá analisar o desempenho e resultados das suas campanhas de marketing.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Rascunhos */}
          <TabsContent value="draft">
            <Card>
              <CardHeader>
                <CardTitle>Rascunhos de Campanhas</CardTitle>
                <CardDescription>
                  Campanhas em fase de criação e planejamento
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <FileBarChart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Criação de Campanhas em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      O editor de campanhas estará disponível em breve para a criação de novas estratégias de marketing.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Seção de Recursos Destacados */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recursos que estarão disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integração com WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Envie mensagens automáticas e personalizadas para leads e alunos potenciais.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={showComingSoonToast}>
                  Em breve
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automação de E-mail</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crie fluxos automatizados de e-mails para nutrir leads durante o funil de vendas.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={showComingSoonToast}>
                  Em breve
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise de Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acompanhe métricas como taxas de abertura, conversão e ROI das suas campanhas.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={showComingSoonToast}>
                  Em breve
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}