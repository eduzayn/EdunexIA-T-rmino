import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, RefreshCw, Wallet, PlusCircle, Users, FileBarChart, CheckCircle2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Componente principal da página de Oportunidades
export default function OpportunitiesPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  
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
            <h1 className="text-3xl font-bold">Oportunidades</h1>
            <p className="text-muted-foreground">
              Acompanhe e gerencie o funil de vendas para seus cursos
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
              Nova Oportunidade
            </Button>
          </div>
        </div>
        
        {/* Tabs para navegação na página */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="forecasting">Previsões</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da Tab Visão Geral */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Card de Oportunidades Abertas */}
              <Card className="bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Oportunidades Abertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">0</div>
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funcionalidade em breve
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Valor Total */}
              <Card className="bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Valor Total (R$)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">R$ 0,00</div>
                    <Wallet className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funcionalidade em breve
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Taxa de Conversão */}
              <Card className="bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">0%</div>
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funcionalidade em breve
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Oportunidades Ganhas */}
              <Card className="bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Oportunidades Ganhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">0</div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funcionalidade em breve
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Visão Geral de Oportunidades</CardTitle>
                <CardDescription>
                  Acompanhe o status e progresso das suas oportunidades de venda
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <FileBarChart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Módulo em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      O módulo de Oportunidades estará disponível em breve para ajudar no gerenciamento das suas vendas.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Pipeline */}
          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline de Vendas</CardTitle>
                <CardDescription>
                  Visualize o status das suas oportunidades em cada estágio do processo de vendas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <FileBarChart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Pipeline em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      O pipeline de vendas permitirá visualizar e gerenciar todas as etapas do processo comercial.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={showComingSoonToast}>
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Previsões */}
          <TabsContent value="forecasting">
            <Card>
              <CardHeader>
                <CardTitle>Previsão de Vendas</CardTitle>
                <CardDescription>
                  Analise tendências e estimativas de receita futura baseadas no pipeline atual
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center items-center p-10 border-t">
                  <div className="text-center">
                    <FileBarChart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-1">Previsões em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      As funcionalidades de previsão e análise de tendências estarão disponíveis em breve.
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