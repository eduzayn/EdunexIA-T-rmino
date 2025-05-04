import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import {
  MessageSquare,
  FileText,
  Settings,
  Upload,
  BookOpen,
  BrainCircuit,
  Lightbulb,
  Library,
  ArrowRight,
  Image,
  PenTool,
  BarChart,
  ChevronRight
} from "lucide-react";

export default function AIDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Buscar configurações da IA - simulação, será substituída por chamada real à API
  const { data: aiSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/ai/settings'],
    queryFn: async () => {
      // Simulação de API - será substituída por fetch real
      return new Promise<{
        assistantName: string;
        defaultModel: string;
        maxTokensPerRequest: number;
        enabledFeatures: string[];
        customInstructions: string;
      }>((resolve) => {
        setTimeout(() => {
          resolve({
            assistantName: 'Prof. Ana',
            defaultModel: 'claude-3-7-sonnet-20250219',
            maxTokensPerRequest: 2048,
            enabledFeatures: ['chat', 'contentGeneration', 'textAnalysis', 'imageAnalysis'],
            customInstructions: 'Atue como uma assistente educacional focada no contexto brasileiro.'
          });
        }, 1000);
      });
    },
  });

  // Exemplo de histórico recente
  const recentActivities = [
    { id: 1, type: 'chat', title: 'Conversação sobre metodologias de ensino', timestamp: '2025-05-04T10:30:00Z' },
    { id: 2, type: 'content', title: 'Geração de plano de aula sobre frações', timestamp: '2025-05-03T14:15:00Z' },
    { id: 3, type: 'analysis', title: 'Análise de redação sobre meio ambiente', timestamp: '2025-05-02T09:45:00Z' },
    { id: 4, type: 'image', title: 'Análise de gráfico de desempenho dos alunos', timestamp: '2025-05-01T16:20:00Z' },
  ];

  // Funções auxiliares
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderiza o ícone apropriado para cada tipo de atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'content':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'analysis':
        return <PenTool className="h-5 w-5 text-purple-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-amber-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Inteligência Artificial</h1>
          <p className="text-muted-foreground">
            Assistente educacional inteligente para apoiar suas atividades pedagógicas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="features">Funcionalidades</TabsTrigger>
            <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Aba de Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Cartão de Boas-vindas com Prof. Ana */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src="/assets/prof-ana-avatar.png" alt="Prof. Ana" />
                    <AvatarFallback className="text-2xl bg-primary text-white">
                      PA
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-primary mb-2">
                      {isLoadingSettings ? (
                        <Skeleton className="h-8 w-32" />
                      ) : (
                        `Olá, eu sou ${aiSettings?.assistantName || 'Prof. Ana'}!`
                      )}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Sua assistente educacional IA, pronta para ajudar com atividades pedagógicas, 
                      análise de conteúdo e criação de materiais didáticos personalizados. 
                      Como posso ajudar você hoje?
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => window.location.href = '/admin/ai/chat'}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Iniciar Conversa
                      </Button>
                      <Button variant="outline" onClick={() => window.location.href = '/admin/ai/content-generator'}>
                        <FileText className="mr-2 h-4 w-4" />
                        Gerar Material Didático
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Estatísticas de uso */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Uso do Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Conversas</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Análises de texto</span>
                      <span className="font-medium">14</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Materiais gerados</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Análises de imagem</span>
                      <span className="font-medium">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Atividades recentes */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Atividades Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-3 border-b">
                        <div className="mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full" onClick={() => window.location.href = '/admin/ai/history'}>
                    Ver todo histórico
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Alertas e sugestões */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Dicas da Prof. Ana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Prompts eficientes:</span> Para obter melhores respostas, 
                      seja específico com suas instruções. Mencione o nível educacional, objetivos 
                      pedagógicos e contexto da sua solicitação.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Personalize minhas respostas:</span> Você pode 
                      ajustar minhas configurações para personalizar o tipo de respostas que ofereço 
                      de acordo com as necessidades específicas da sua instituição.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Funcionalidades */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Conversa com a IA */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Conversa Educacional</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Dialogue com Prof. Ana sobre qualquer tópico educacional. Obtenha 
                    explicações, ideias para aulas, dicas pedagógicas e muito mais.
                  </p>
                  <Button onClick={() => window.location.href = '/admin/ai/chat'}>
                    Iniciar Conversa <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Gerador de Material Didático */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Gerador de Material Didático</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Crie planos de aula, atividades, exercícios, avaliações e resumos 
                    personalizados para qualquer disciplina ou nível educacional.
                  </p>
                  <Button onClick={() => window.location.href = '/admin/ai/content-generator'}>
                    Gerar Material <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Análise de Textos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <PenTool className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Análise de Textos</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Analise redações, trabalhos acadêmicos e outros textos dos alunos. 
                    Receba feedback e sugestões para melhorias.
                  </p>
                  <Button onClick={() => window.location.href = '/admin/ai/text-analyzer'}>
                    Analisar Textos <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Análise de Imagens */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Image className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Análise de Imagens</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Analise gráficos, diagramas, trabalhos artísticos e outros 
                    conteúdos visuais. Identifique conceitos e receba explicações.
                  </p>
                  <Button onClick={() => window.location.href = '/admin/ai/image-analyzer'}>
                    Analisar Imagens <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba de Base de Conhecimento */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Base de Conhecimento Personalizada</CardTitle>
                <CardDescription>
                  Alimente a IA com documentos institucionais para respostas mais precisas e contextualizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex-1">
                    <BrainCircuit className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Como funciona</h3>
                    <p className="text-sm text-blue-900 mb-3">
                      Ao adicionar documentos à base de conhecimento, a IA analisará 
                      seu conteúdo e usará essas informações para fornecer respostas 
                      mais precisas e alinhadas com as políticas e materiais da sua instituição.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mt-0.5">1</div>
                        <p className="text-sm text-blue-900">Faça upload de documentos institucionais</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mt-0.5">2</div>
                        <p className="text-sm text-blue-900">A IA processa e indexa o conteúdo</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mt-0.5">3</div>
                        <p className="text-sm text-blue-900">Respostas são enriquecidas com seus materiais</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border flex-1">
                    <h3 className="text-xl font-semibold mb-4">Gerencie seus documentos</h3>
                    <div className="space-y-4">
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Nenhum documento adicionado ainda
                        </p>
                        <Button onClick={() => window.location.href = '/admin/ai/knowledge-base'}>
                          Adicionar Documentos
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => window.location.href = '/admin/ai/knowledge-base'} className="w-full">
                  <Library className="mr-2 h-4 w-4" />
                  Gerenciar Base de Conhecimento
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Aba de Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da IA</CardTitle>
                <CardDescription>
                  Personalize o comportamento e as respostas da sua assistente IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingSettings ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Nome da Assistente</h3>
                      <p className="text-muted-foreground mb-1 text-sm">
                        Personalize como você deseja se referir à sua assistente IA
                      </p>
                      <div className="flex items-center justify-between border p-3 rounded-md bg-gray-50">
                        <span className="font-medium">{aiSettings?.assistantName || 'Prof. Ana'}</span>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Instruções Personalizadas</h3>
                      <p className="text-muted-foreground mb-1 text-sm">
                        Defina como a assistente deve responder às perguntas
                      </p>
                      <div className="border p-3 rounded-md bg-gray-50">
                        <p className="text-sm">{aiSettings?.customInstructions || 'Atue como uma assistente educacional focada no contexto brasileiro.'}</p>
                        <div className="flex justify-end mt-2">
                          <Button variant="ghost" size="sm">Editar</Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Funcionalidades Ativas</h3>
                      <p className="text-muted-foreground mb-1 text-sm">
                        Selecione quais recursos devem estar disponíveis
                      </p>
                      <div className="border p-3 rounded-md bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Conversação Educacional</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Geração de Conteúdo</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Análise de Textos</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Análise de Imagens</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => window.location.href = '/admin/ai/settings'} className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar a Assistente IA
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}