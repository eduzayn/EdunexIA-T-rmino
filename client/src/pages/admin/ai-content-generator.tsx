import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Lucide Icons
import {
  FileText,
  Download,
  Copy,
  Send,
  CheckCheck,
  RefreshCw,
  Info,
  Sparkles,
  BookOpen,
  GraduationCap,
  Book,
  ChevronRight,
  Loader2,
  Settings,
  CheckCircle,
  MoveRight,
  ClipboardList,
} from "lucide-react";

// Tipos
type ContentType = 
  | 'lesson-plan' 
  | 'exercise' 
  | 'assessment' 
  | 'summary' 
  | 'rubric' 
  | 'slides' 
  | 'activity'
  | 'project'
  | 'custom';

interface ContentTypeInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  suggestedParams: Record<string, string>;
}

export default function AIContentGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [activeTab, setActiveTab] = useState('generate');
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<ContentType>('lesson-plan');
  const [educationLevel, setEducationLevel] = useState('high-school');
  const [additionalParams, setAdditionalParams] = useState<Record<string, string | boolean>>({
    duration: '',
    objectives: '',
    includeExamples: true,
    includeAssessment: true,
    includeResources: true,
  });
  const [customParameters, setCustomParameters] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [savedContents, setSavedContents] = useState<Array<{id: string, title: string, type: string, content: string, createdAt: Date}>>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  // Informações sobre tipos de conteúdo
  const contentTypes: Record<ContentType, ContentTypeInfo> = {
    'lesson-plan': {
      title: 'Plano de Aula',
      description: 'Um roteiro detalhado para ministrar uma aula específica',
      icon: <BookOpen className="h-5 w-5" />,
      suggestedParams: {
        duration: '50 minutos',
        objectives: 'Compreender os conceitos básicos; Aplicar os conhecimentos em exemplos práticos',
      }
    },
    'exercise': {
      title: 'Lista de Exercícios',
      description: 'Exercícios práticos para fixação de conteúdo',
      icon: <ClipboardList className="h-5 w-5" />,
      suggestedParams: {
        difficulty: 'Médio',
        quantity: '10 exercícios',
      }
    },
    'assessment': {
      title: 'Avaliação',
      description: 'Instrumento formal para avaliar o aprendizado',
      icon: <CheckCircle className="h-5 w-5" />,
      suggestedParams: {
        format: 'Prova escrita',
        totalPoints: '10 pontos',
        duration: '1 hora',
      }
    },
    'summary': {
      title: 'Resumo/Síntese',
      description: 'Material de estudo com os principais pontos do tema',
      icon: <FileText className="h-5 w-5" />,
      suggestedParams: {
        format: 'Tópicos principais',
        length: 'Médio (1-2 páginas)',
      }
    },
    'rubric': {
      title: 'Rubrica de Avaliação',
      description: 'Critérios para avaliação de atividades e trabalhos',
      icon: <ClipboardList className="h-5 w-5" />,
      suggestedParams: {
        categories: 'Conteúdo, Organização, Criatividade, Apresentação',
        scale: '1-5 pontos por categoria',
      }
    },
    'slides': {
      title: 'Roteiro para Slides',
      description: 'Estrutura para apresentação de slides educacionais',
      icon: <FileText className="h-5 w-5" />,
      suggestedParams: {
        slides: '10-15 slides',
        includeNotes: 'sim',
      }
    },
    'activity': {
      title: 'Atividade Interativa',
      description: 'Atividade pedagógica com foco em participação ativa',
      icon: <Sparkles className="h-5 w-5" />,
      suggestedParams: {
        duration: '30 minutos',
        groupSize: 'Duplas ou trios',
        materials: 'Listar materiais necessários',
      }
    },
    'project': {
      title: 'Projeto Educacional',
      description: 'Projeto de longo prazo para desenvolvimento de competências',
      icon: <GraduationCap className="h-5 w-5" />,
      suggestedParams: {
        duration: '2 semanas',
        deliverables: 'Relatório escrito e apresentação',
        objectives: 'Objetivos de aprendizagem do projeto',
      }
    },
    'custom': {
      title: 'Conteúdo Personalizado',
      description: 'Defina seu próprio tipo de material educacional',
      icon: <Settings className="h-5 w-5" />,
      suggestedParams: {
        description: 'Descreva o tipo de conteúdo que deseja',
      }
    },
  };
  
  // Níveis educacionais
  const educationLevels = [
    { value: 'elementary', label: 'Ensino Fundamental I (1º ao 5º ano)' },
    { value: 'middle-school', label: 'Ensino Fundamental II (6º ao 9º ano)' },
    { value: 'high-school', label: 'Ensino Médio' },
    { value: 'higher-education', label: 'Ensino Superior' },
    { value: 'technical', label: 'Ensino Técnico' },
    { value: 'adult-education', label: 'Educação de Jovens e Adultos (EJA)' },
    { value: 'special-education', label: 'Educação Especial' },
  ];
  
  // Mutation para gerar conteúdo
  const generateContentMutation = useMutation({
    mutationFn: async () => {
      // Prepara os parâmetros para a API
      const parameters: Record<string, any> = {
        educationLevel,
        ...additionalParams,
      };
      
      // Adiciona parâmetros customizados se fornecidos
      if (customParameters) {
        parameters.customParameters = customParameters;
      }
      
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          type: contentTypes[contentType].title,
          parameters,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar conteúdo');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setActiveTab('result');
      
      toast({
        title: 'Conteúdo gerado',
        description: 'Material didático criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na geração',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Função para copiar conteúdo para a área de transferência
  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setIsCopied(true);
      
      toast({
        title: 'Copiado!',
        description: 'O conteúdo foi copiado para a área de transferência.',
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  // Função para baixar o conteúdo como arquivo de texto
  const downloadContent = () => {
    if (generatedContent) {
      const fileName = `${contentTypes[contentType].title.toLowerCase().replace(/\s+/g, '-')}-${topic.substring(0, 30).toLowerCase().replace(/\s+/g, '-')}.txt`;
      
      const element = document.createElement('a');
      const file = new Blob([generatedContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: 'Download iniciado',
        description: 'O conteúdo está sendo baixado como arquivo de texto.',
      });
    }
  };
  
  // Função para salvar o conteúdo na biblioteca
  const saveToLibrary = () => {
    if (generatedContent) {
      const newContent = {
        id: Date.now().toString(),
        title: topic,
        type: contentTypes[contentType].title,
        content: generatedContent,
        createdAt: new Date()
      };
      
      setSavedContents([newContent, ...savedContents]);
      
      toast({
        title: 'Conteúdo salvo',
        description: 'Material adicionado à sua biblioteca pessoal.',
      });
    }
  };
  
  // Função para limpar o formulário
  const clearForm = () => {
    setTopic('');
    setContentType('lesson-plan');
    setEducationLevel('high-school');
    setAdditionalParams({
      duration: '',
      objectives: '',
      includeExamples: true,
      includeAssessment: true,
      includeResources: true,
    });
    setCustomParameters('');
    setGeneratedContent(null);
    setActiveTab('generate');
    
    toast({
      title: 'Formulário limpo',
      description: 'Todos os campos foram limpos.',
    });
  };
  
  // Função para atualizar um parâmetro adicional
  const updateParameter = (key: string, value: string | boolean) => {
    setAdditionalParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Renderiza os parâmetros adicionais de acordo com o tipo de conteúdo
  const renderAdditionalParams = () => {
    const params = contentTypes[contentType].suggestedParams;
    
    return (
      <div className="space-y-4">
        {Object.entries(params).map(([key, defaultValue]) => (
          <div key={key}>
            <Label htmlFor={key} className="capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Label>
            <Input
              id={key}
              placeholder={defaultValue}
              value={(additionalParams[key] as string) || ''}
              onChange={(e) => updateParameter(key, e.target.value)}
              disabled={generateContentMutation.isPending}
            />
          </div>
        ))}
        
        {/* Opções comuns */}
        <div className="space-y-2 pt-2">
          <Label>Opções Adicionais</Label>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="includeExamples"
              checked={!!additionalParams.includeExamples}
              onCheckedChange={(checked) => updateParameter('includeExamples', !!checked)}
              disabled={generateContentMutation.isPending}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="includeExamples"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir exemplos
              </label>
              <p className="text-sm text-muted-foreground">
                Adicionar exemplos práticos ao material
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="includeAssessment"
              checked={!!additionalParams.includeAssessment}
              onCheckedChange={(checked) => updateParameter('includeAssessment', !!checked)}
              disabled={generateContentMutation.isPending}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="includeAssessment"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir avaliação
              </label>
              <p className="text-sm text-muted-foreground">
                Adicionar métodos de avaliação dos alunos
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="includeResources"
              checked={!!additionalParams.includeResources}
              onCheckedChange={(checked) => updateParameter('includeResources', !!checked)}
              disabled={generateContentMutation.isPending}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="includeResources"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir recursos
              </label>
              <p className="text-sm text-muted-foreground">
                Sugerir materiais e recursos didáticos
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Formatar data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerador de Conteúdo Educacional</h1>
            <p className="text-muted-foreground">
              Crie materiais didáticos personalizados com a Prof. Ana
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={clearForm}
              disabled={generateContentMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Novo Conteúdo
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Gerar Conteúdo</TabsTrigger>
            <TabsTrigger value="result" disabled={!generatedContent}>Resultado</TabsTrigger>
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
          </TabsList>
          
          {/* Aba de Geração de Conteúdo */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Defina o tema e o tipo de conteúdo que deseja criar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="topic">Tema ou Assunto</Label>
                      <Input
                        id="topic"
                        placeholder="Ex: Fotossíntese, Revolução Francesa, Equações do 2º grau..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={generateContentMutation.isPending}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Seja específico para obter melhores resultados
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="content-type">Tipo de Conteúdo</Label>
                      <Select
                        value={contentType}
                        onValueChange={(value) => setContentType(value as ContentType)}
                        disabled={generateContentMutation.isPending}
                      >
                        <SelectTrigger id="content-type">
                          <SelectValue placeholder="Selecione o tipo de conteúdo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(contentTypes).map(([value, { title, icon }]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center">
                                <span className="mr-2 text-muted-foreground">{icon}</span>
                                <span>{title}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contentTypes[contentType].description}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="education-level">Nível Educacional</Label>
                      <Select
                        value={educationLevel}
                        onValueChange={setEducationLevel}
                        disabled={generateContentMutation.isPending}
                      >
                        <SelectTrigger id="education-level">
                          <SelectValue placeholder="Selecione o nível educacional" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Parâmetros Específicos</CardTitle>
                    <CardDescription>
                      Personalize detalhes do {contentTypes[contentType].title.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderAdditionalParams()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Parâmetros Avançados (Opcional)</CardTitle>
                    <CardDescription>
                      Forneca instruções adicionais específicas para o conteúdo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Ex: Inclua um experimento prático; Aborde a perspectiva de autores específicos; Adapte para alunos com dificuldade em leitura..."
                      value={customParameters}
                      onChange={(e) => setCustomParameters(e.target.value)}
                      className="min-h-24 resize-none"
                      disabled={generateContentMutation.isPending}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => generateContentMutation.mutate()}
                      disabled={!topic.trim() || generateContentMutation.isPending}
                    >
                      {generateContentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando Conteúdo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Gerar Conteúdo Educacional
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div>
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Dicas de Uso</CardTitle>
                    <CardDescription>
                      Como obter os melhores resultados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">Seja específico com o tema</h3>
                      <p className="text-sm text-muted-foreground">
                        "Fotossíntese em plantas C4" é melhor que apenas "Fotossíntese"
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold">Indique o contexto educacional</h3>
                      <p className="text-sm text-muted-foreground">
                        Selecione o nível educacional correto para adequação do conteúdo
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold">Use parâmetros avançados</h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione instruções específicas para personalizar completamente o material
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Exemplos de temas bem definidos:</h3>
                      <div className="space-y-2">
                        <div className="text-sm p-2 rounded-md border">
                          <span className="font-medium">Matemática:</span> Geometria analítica - Distância entre ponto e reta
                        </div>
                        <div className="text-sm p-2 rounded-md border">
                          <span className="font-medium">História:</span> Revolução Industrial e seus impactos sociais
                        </div>
                        <div className="text-sm p-2 rounded-md border">
                          <span className="font-medium">Biologia:</span> Sistema circulatório humano - Estrutura e função
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                          Lembre-se de revisar e adaptar o conteúdo gerado para suas necessidades específicas. 
                          A Prof. Ana fornece um ponto de partida que pode ser personalizado.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Aba de Resultado */}
          <TabsContent value="result" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>
                        {contentTypes[contentType].title}: {topic}
                      </CardTitle>
                      <CardDescription>
                        Gerado por Prof. Ana para {educationLevels.find(level => level.value === educationLevel)?.label}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={copyToClipboard} 
                        title="Copiar conteúdo"
                      >
                        {isCopied ? (
                          <CheckCheck className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={downloadContent} 
                        title="Baixar conteúdo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow overflow-auto">
                    <div className="bg-gray-50 p-4 rounded-md h-full overflow-auto whitespace-pre-wrap">
                      {generatedContent}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Este conteúdo foi gerado por I.A. para fins de apoio pedagógico. 
                        Recomenda-se revisar e adaptar antes de utilizar.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={saveToLibrary}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Salvar na Biblioteca
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div>
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Próximos Passos</CardTitle>
                    <CardDescription>
                      Opções para utilizar seu conteúdo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                          <Download className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Exportar</h3>
                          <p className="text-sm text-muted-foreground">
                            Baixe o conteúdo como arquivo de texto para edição posterior
                          </p>
                          <Button 
                            variant="link" 
                            className="px-0 text-sm h-auto"
                            onClick={downloadContent}
                          >
                            Baixar arquivo <MoveRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                          <Copy className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Copiar</h3>
                          <p className="text-sm text-muted-foreground">
                            Copie o conteúdo para a área de transferência
                          </p>
                          <Button 
                            variant="link" 
                            className="px-0 text-sm h-auto"
                            onClick={copyToClipboard}
                          >
                            Copiar para área de transferência <MoveRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                          <Book className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Salvar</h3>
                          <p className="text-sm text-muted-foreground">
                            Guarde na biblioteca pessoal para acesso futuro
                          </p>
                          <Button 
                            variant="link" 
                            className="px-0 text-sm h-auto"
                            onClick={saveToLibrary}
                          >
                            Adicionar à biblioteca <MoveRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Gerar Novo</h3>
                          <p className="text-sm text-muted-foreground">
                            Crie um novo conteúdo educacional
                          </p>
                          <Button 
                            variant="link" 
                            className="px-0 text-sm h-auto"
                            onClick={() => setActiveTab('generate')}
                          >
                            Voltar ao gerador <MoveRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Aba de Biblioteca */}
          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Minha Biblioteca de Conteúdos</CardTitle>
                <CardDescription>
                  Materiais didáticos salvos para uso futuro
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedContents.length > 0 ? (
                  <div className="space-y-4">
                    {savedContents.map((content) => (
                      <div 
                        key={content.id} 
                        className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setGeneratedContent(content.content);
                          setTopic(content.title);
                          // Encontrar o tipo de conteúdo baseado no título
                          const contentTypeKey = Object.entries(contentTypes).find(
                            ([_key, { title }]) => title === content.type
                          )?.[0] as ContentType;
                          if (contentTypeKey) {
                            setContentType(contentTypeKey);
                          }
                          setActiveTab('result');
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{content.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{content.type}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {formatDate(content.createdAt)}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Sua biblioteca está vazia</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      Gere e salve conteúdos educacionais para acessá-los rapidamente no futuro.
                    </p>
                    <Button onClick={() => setActiveTab('generate')}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Criar Novo Conteúdo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}