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
  Settings, 
  RefreshCw, 
  PlusCircle, 
  Workflow, 
  Zap, 
  MessageSquare,
  Mail,
  Calendar,
  GitBranch,
  CheckCircle2,
  LayoutGrid
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Componente principal da página de Automações
export default function AutomationsPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("flows");
  
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
            <h1 className="text-3xl font-bold">Automações</h1>
            <p className="text-muted-foreground">
              Configure fluxos automatizados para suas operações comerciais
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
              Nova Automação
            </Button>
          </div>
        </div>
        
        {/* Tabs para diferentes tipos de automação */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="flows">Fluxos</TabsTrigger>
            <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da Tab Fluxos */}
          <TabsContent value="flows">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Card de Fluxo de Boas-vindas */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="text-xs bg-secondary/30 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-2 bg-blue-100">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="mt-2">Boas-vindas ao Lead</CardTitle>
                  <CardDescription>
                    Fluxo de mensagens de boas-vindas para novos leads capturados
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 justify-between">
                  <div className="text-xs text-muted-foreground">Status: <span className="text-gray-400">Inativo</span></div>
                  <Button variant="ghost" size="sm" onClick={showComingSoonToast}>Configurar</Button>
                </CardFooter>
              </Card>
              
              {/* Card de Fluxo de Recuperação */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="text-xs bg-secondary/30 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-2 bg-amber-100">
                      <Mail className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <CardTitle className="mt-2">Recuperação de Abandono</CardTitle>
                  <CardDescription>
                    Recupera matrículas abandonadas com sequência de e-mails/SMS
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 justify-between">
                  <div className="text-xs text-muted-foreground">Status: <span className="text-gray-400">Inativo</span></div>
                  <Button variant="ghost" size="sm" onClick={showComingSoonToast}>Configurar</Button>
                </CardFooter>
              </Card>
              
              {/* Card de Fluxo de Notificação */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="text-xs bg-secondary/30 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-2 bg-green-100">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="mt-2">Lembrete de Eventos</CardTitle>
                  <CardDescription>
                    Envia lembretes para eventos e webinars programados
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 justify-between">
                  <div className="text-xs text-muted-foreground">Status: <span className="text-gray-400">Inativo</span></div>
                  <Button variant="ghost" size="sm" onClick={showComingSoonToast}>Configurar</Button>
                </CardFooter>
              </Card>
              
              {/* Card de Novo Fluxo */}
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[220px]">
                  <PlusCircle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-center text-muted-foreground">
                    Criar novo fluxo de automação
                  </p>
                  <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                    Adicionar Fluxo
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Editor de Fluxos</CardTitle>
                <CardDescription>
                  Crie fluxos personalizados com um editor visual intuitivo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Editor de Fluxos em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      Em breve você poderá criar fluxos de automação com um poderoso editor visual de arrastar e soltar.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Gatilhos */}
          <TabsContent value="triggers">
            <Card>
              <CardHeader>
                <CardTitle>Gatilhos de Automação</CardTitle>
                <CardDescription>
                  Configure eventos que iniciam automaticamente seus fluxos de trabalho
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Novo Lead Cadastrado</p>
                        <p className="text-sm text-muted-foreground">Ativa quando um lead é criado no sistema</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={showComingSoonToast}>Configurar</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Mudança de Status</p>
                        <p className="text-sm text-muted-foreground">Ativa quando um lead muda de status no funil</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={showComingSoonToast}>Configurar</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Matrícula Finalizada</p>
                        <p className="text-sm text-muted-foreground">Ativa quando uma matrícula é concluída</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={showComingSoonToast}>Configurar</Button>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground mb-3">Mais gatilhos estarão disponíveis em breve</p>
                  <Button onClick={showComingSoonToast}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Criar Novo Gatilho
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Templates */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Mensagens</CardTitle>
                <CardDescription>
                  Crie modelos de mensagens para utilizar em seus fluxos de automação
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Boas-vindas</CardTitle>
                      <CardDescription>E-mail de boas-vindas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Template para e-mail de boas-vindas para novos leads.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={showComingSoonToast}>
                        Editar Template
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Lembrete de Evento</CardTitle>
                      <CardDescription>SMS de lembrete</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Template para SMS de lembrete de eventos e webinars.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={showComingSoonToast}>
                        Editar Template
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recuperação</CardTitle>
                      <CardDescription>WhatsApp de recuperação</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Template para mensagem de WhatsApp para recuperação de matrículas.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={showComingSoonToast}>
                        Editar Template
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[160px]">
                      <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-center text-muted-foreground">
                        Criar novo template
                      </p>
                      <Button className="mt-3" variant="outline" size="sm" onClick={showComingSoonToast}>
                        Adicionar
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Logs */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Automação</CardTitle>
                <CardDescription>
                  Acompanhe a execução e o histórico das suas automações
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Monitoramento em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      Em breve você poderá visualizar logs detalhados da execução de todas as suas automações.
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
      </div>
    </AppShell>
  );
}