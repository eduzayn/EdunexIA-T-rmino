import React, { useState, useRef } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Image,
  Upload,
  Download,
  Copy,
  Send,
  CheckCheck,
  RefreshCw,
  Info,
  Trash2,
  Loader2,
  UploadCloud,
  FileImage,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Table,
  BarChart,
  ChevronRight,
} from "lucide-react";

export default function AIImageAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Tipos de análise de imagem
  const analysisTypes = [
    { value: 'general', label: 'Análise Geral', 
      description: 'Descrição detalhada do conteúdo educacional da imagem' },
    { value: 'chart', label: 'Análise de Gráfico/Tabela', 
      description: 'Interpretação de dados visuais, estatísticas e tendências' },
    { value: 'diagram', label: 'Análise de Diagrama', 
      description: 'Explicação de fluxogramas, processos e sistemas' },
    { value: 'artwork', label: 'Análise de Obra Artística', 
      description: 'Análise de pinturas, esculturas ou outras expressões artísticas' },
    { value: 'document', label: 'Análise de Documento', 
      description: 'Extração de informações relevantes de documentos ou textos' },
  ];
  
  // Sugestões de prompts por tipo de análise
  const promptSuggestions: Record<string, string[]> = {
    'general': [
      'Descreva detalhadamente os elementos educacionais presentes nesta imagem',
      'Que conceitos pedagógicos esta imagem ilustra?',
      'Como esta imagem poderia ser utilizada em sala de aula?'
    ],
    'chart': [
      'Interprete os dados mostrados neste gráfico',
      'Quais são as principais tendências visíveis nesta visualização de dados?',
      'Explique as correlações presentes neste gráfico de forma simples'
    ],
    'diagram': [
      'Explique este diagrama e seu significado educacional',
      'Descreva o processo ilustrado neste fluxograma',
      'Quais são os componentes chave deste diagrama e como eles se relacionam?'
    ],
    'artwork': [
      'Analise esta obra de arte em termos de técnica, estilo e contexto histórico',
      'Explique os elementos visuais e simbólicos presentes nesta obra',
      'Como esta obra pode ser utilizada para ensinar conceitos artísticos?'
    ],
    'document': [
      'Extraia os pontos principais deste documento',
      'Resuma o conteúdo deste texto em tópicos organizados',
      'Identifique e explique os conceitos-chave presentes neste material'
    ],
  };
  
  // Mutation para analisar imagem
  const analyzeImageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Nenhuma imagem selecionada');
      }
      
      // Preparar o formulário para envio
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Adicionar o prompt customizado ou um padrão baseado no tipo de análise
      const finalPrompt = prompt || `Analise esta imagem como ${analysisTypes.find(t => t.value === analysisType)?.label.toLowerCase()}. ${analysisTypes.find(t => t.value === analysisType)?.description}`;
      formData.append('prompt', finalPrompt);
      
      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao analisar imagem');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.content);
      
      toast({
        title: 'Análise concluída',
        description: 'A imagem foi analisada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na análise',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Manipular seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Criar URL para preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Limpar análise anterior
      setAnalysisResult(null);
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  };
  
  // Função para abrir o seletor de arquivos
  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Função para copiar análise para a área de transferência
  const copyToClipboard = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
      setIsCopied(true);
      
      toast({
        title: 'Copiado!',
        description: 'A análise foi copiada para a área de transferência.',
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  // Função para baixar análise como arquivo de texto
  const downloadAnalysis = () => {
    if (analysisResult) {
      const element = document.createElement('a');
      const file = new Blob([analysisResult], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `analise-imagem-${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: 'Download iniciado',
        description: 'A análise está sendo baixada como arquivo de texto.',
      });
    }
  };
  
  // Função para limpar a seleção de arquivo
  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    
    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: 'Imagem removida',
      description: 'Selecione outra imagem para análise.',
    });
  };
  
  // Obter o ícone para o tipo de análise
  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return <BarChart className="h-5 w-5" />;
      case 'diagram':
        return <FileImage className="h-5 w-5" />;
      case 'artwork':
        return <Image className="h-5 w-5" />;
      case 'document':
        return <BookOpen className="h-5 w-5" />;
      case 'general':
      default:
        return <Image className="h-5 w-5" />;
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analisador de Imagens</h1>
            <p className="text-muted-foreground">
              Utilize a inteligência da Prof. Ana para interpretar conteúdo visual
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={clearFile}
              disabled={!selectedFile || analyzeImageMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Nova Imagem
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna de upload e configurações */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagem para Análise</CardTitle>
                <CardDescription>
                  Selecione ou arraste uma imagem para analisar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-auto max-h-96 object-contain border rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearFile}
                        disabled={analyzeImageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{selectedFile?.name}</span>
                      <span>{(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0)} MB</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-md p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={handleSelectFileClick}
                  >
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Selecione uma imagem</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Arraste e solte ou clique para selecionar
                    </p>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Imagem
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                      JPG, PNG ou GIF até 10MB
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Análise</CardTitle>
                <CardDescription>
                  Personalize como a Prof. Ana deve analisar sua imagem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="analysis-type">Tipo de Análise</Label>
                  <Select
                    value={analysisType}
                    onValueChange={setAnalysisType}
                    disabled={analyzeImageMutation.isPending}
                  >
                    <SelectTrigger id="analysis-type">
                      <SelectValue placeholder="Selecione o tipo de análise" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <span className="mr-2 text-muted-foreground">{getAnalysisTypeIcon(type.value)}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysisTypes.find(t => t.value === analysisType)?.description}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="prompt">Instruções Específicas (opcional)</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Forneça instruções específicas para a análise (opcional)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="resize-none"
                    disabled={analyzeImageMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Orientações para direcionar a análise da Prof. Ana
                  </p>
                </div>
                
                {/* Sugestões de prompts */}
                <div>
                  <Label className="text-sm">Sugestões de instruções:</Label>
                  <div className="mt-2 space-y-2">
                    {promptSuggestions[analysisType]?.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="text-sm p-2 rounded-md border cursor-pointer hover:bg-gray-50"
                        onClick={() => setPrompt(suggestion)}
                      >
                        "{suggestion}"
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => analyzeImageMutation.mutate()}
                  disabled={!selectedFile || analyzeImageMutation.isPending}
                >
                  {analyzeImageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Image className="mr-2 h-4 w-4" />
                      Analisar Imagem
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Coluna de resultado */}
          <div>
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Resultado da Análise</CardTitle>
                  <CardDescription>
                    {analysisResult ? analysisTypes.find(t => t.value === analysisType)?.label : 'Aguardando análise da imagem'}
                  </CardDescription>
                </div>
                
                {analysisResult && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={copyToClipboard} 
                      title="Copiar análise"
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
                      onClick={downloadAnalysis} 
                      title="Baixar análise"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {analyzeImageMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="bg-primary/10 rounded-full p-4 mb-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Analisando sua imagem...</h3>
                    <p className="text-muted-foreground mb-6">
                      Prof. Ana está interpretando o conteúdo visual com precisão.
                    </p>
                    <div className="w-full max-w-md">
                      <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className="bg-gray-50 p-4 rounded-md h-full overflow-auto whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 p-8 text-center">
                    <div className="bg-primary/10 rounded-full p-4">
                      <Image className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Aguardando uma imagem para analisar</h3>
                      <p className="text-muted-foreground max-w-md">
                        Selecione uma imagem na área à esquerda e clique em "Analisar Imagem" 
                        para receber uma análise detalhada do conteúdo visual pela Prof. Ana.
                      </p>
                    </div>
                    
                    <div className="text-center w-full max-w-md">
                      <Separator className="my-4" />
                      <h4 className="text-sm font-medium mb-2">O que você pode analisar:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-md border">
                          <BarChart className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Gráficos e Tabelas
                        </div>
                        <div className="p-2 rounded-md border">
                          <FileImage className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Diagramas
                        </div>
                        <div className="p-2 rounded-md border">
                          <Image className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Obras Artísticas
                        </div>
                        <div className="p-2 rounded-md border">
                          <BookOpen className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Documentos
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              {analysisResult && (
                <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Esta análise foi gerada por I.A. para fins de apoio pedagógico. 
                      Recomenda-se revisar o conteúdo para garantir precisão.
                    </p>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
        
        {/* Seção de dicas e exemplos */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dicas para Análise de Imagens</CardTitle>
              <CardDescription>
                Como obter os melhores resultados da Prof. Ana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Use imagens claras</span> - Imagens bem iluminadas e nítidas fornecem análises mais precisas
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Selecione o tipo correto</span> - Escolha o tipo de análise que melhor se adapta ao conteúdo visual
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Adicione instruções específicas</span> - Direcione a análise com prompts detalhados
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Evite texto pequeno</span> - A análise pode ter dificuldade com textos muito pequenos ou ilegíveis
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Dados complexos</span> - Para gráficos com muitas variáveis, forneça instruções claras
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-medium">Verifique resultados</span> - Sempre revise a análise da IA para garantir precisão
                    </p>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Exemplos de uso educacional:</h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Analisar gráficos de desempenho dos alunos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Interpretar diagramas científicos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Examinar mapas históricos ou geográficos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Avaliar trabalhos artísticos dos estudantes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}