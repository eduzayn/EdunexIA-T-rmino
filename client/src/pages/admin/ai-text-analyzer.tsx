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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  PenTool,
  FileText,
  Send,
  Book,
  ArrowRight,
  Download,
  Copy,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
} from "lucide-react";

export default function AITextAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [text, setText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Mutation para analisar texto
  const analyzeTextMutation = useMutation({
    mutationFn: async () => {
      // Personaliza a instrução com base no tipo de análise
      let finalInstruction = instruction;
      
      if (!finalInstruction) {
        // Instruções padrão baseadas no tipo de análise
        switch (analysisType) {
          case 'general':
            finalInstruction = 'Analise este texto e forneça insights sobre seu conteúdo educacional.';
            break;
          case 'essay':
            finalInstruction = 'Avalie esta redação considerando coerência, coesão, argumentação, adequação à norma culta da língua portuguesa e proposta de intervenção.';
            break;
          case 'assignment':
            finalInstruction = 'Analise este trabalho acadêmico verificando clareza, organização, fundamentação teórica e bibliografia.';
            break;
          case 'summary':
            finalInstruction = 'Avalie este resumo considerando a síntese das ideias principais, clareza e concisão.';
            break;
          case 'objectives':
            finalInstruction = 'Analise estes objetivos de aprendizagem em termos de clareza, mensurabilidade e adequação taxonômica.';
            break;
          default:
            finalInstruction = 'Analise este texto e forneça insights sobre seu conteúdo educacional.';
        }
      }
      
      const response = await fetch('/api/ai/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          instruction: finalInstruction,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao analisar texto');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.content);
      
      toast({
        title: 'Análise concluída',
        description: 'O texto foi analisado com sucesso.',
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
  
  // Função para copiar texto para a área de transferência
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
  
  // Função para baixar a análise como arquivo de texto
  const downloadAnalysis = () => {
    if (analysisResult) {
      const element = document.createElement('a');
      const file = new Blob([analysisResult], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `analise-prof-ana-${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: 'Download iniciado',
        description: 'A análise está sendo baixada como arquivo de texto.',
      });
    }
  };
  
  // Função para limpar o formulário
  const clearForm = () => {
    setText('');
    setInstruction('');
    setAnalysisResult(null);
    
    toast({
      title: 'Formulário limpo',
      description: 'Todos os campos foram limpos.',
    });
  };
  
  // Exemplos de instruções de análise para cada tipo
  const getInstructionExamples = (type: string) => {
    switch (type) {
      case 'general':
        return [
          'Identifique os principais conceitos apresentados neste texto.',
          'Analise a clareza e organização deste conteúdo.',
          'Avalie a adequação pedagógica deste texto para alunos do ensino médio.'
        ];
      case 'essay':
        return [
          'Avalie esta redação segundo os critérios do ENEM.',
          'Analise a argumentação e as propostas de intervenção desta redação.',
          'Identifique problemas de coesão e coerência neste texto dissertativo.'
        ];
      case 'assignment':
        return [
          'Avalie a qualidade da fundamentação teórica deste trabalho.',
          'Analise a estrutura e organização deste trabalho acadêmico.',
          'Verifique a consistência metodológica desta pesquisa.'
        ];
      case 'summary':
        return [
          'Avalie se este resumo captura as ideias principais do texto original.',
          'Verifique a concisão e precisão deste resumo.',
          'Analise a coerência e completude deste resumo.'
        ];
      case 'objectives':
        return [
          'Avalie se estes objetivos de aprendizagem são mensuráveis.',
          'Analise a taxonomia de Bloom utilizada nestes objetivos.',
          'Verifique a clareza e especificidade destes objetivos de aprendizagem.'
        ];
      default:
        return [];
    }
  };
  
  // Mapeia tipos de análise para títulos mais amigáveis
  const analysisTypeLabels: Record<string, string> = {
    'general': 'Análise Geral',
    'essay': 'Análise de Redação',
    'assignment': 'Análise de Trabalho Acadêmico',
    'summary': 'Análise de Resumo',
    'objectives': 'Análise de Objetivos de Aprendizagem'
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analisador de Textos</h1>
            <p className="text-muted-foreground">
              Utilize a inteligência da Prof. Ana para analisar textos educacionais
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={clearForm}
              disabled={analyzeTextMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna de entrada */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Texto para Análise</CardTitle>
                <CardDescription>
                  Cole ou digite o texto que deseja analisar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Cole ou digite aqui o texto que deseja analisar... (redações, trabalhos, resumos, etc.)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[300px] resize-none"
                  disabled={analyzeTextMutation.isPending}
                />
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {text ? `${text.length} caracteres` : 'Aguardando texto para análise'}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Análise</CardTitle>
                <CardDescription>
                  Personalize como a Prof. Ana deve analisar seu texto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="analysis-type">Tipo de Análise</Label>
                  <Select
                    value={analysisType}
                    onValueChange={setAnalysisType}
                    disabled={analyzeTextMutation.isPending}
                  >
                    <SelectTrigger id="analysis-type">
                      <SelectValue placeholder="Selecione o tipo de análise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Análise Geral</SelectItem>
                      <SelectItem value="essay">Análise de Redação</SelectItem>
                      <SelectItem value="assignment">Análise de Trabalho Acadêmico</SelectItem>
                      <SelectItem value="summary">Análise de Resumo</SelectItem>
                      <SelectItem value="objectives">Análise de Objetivos de Aprendizagem</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione o tipo de análise que melhor se adapta ao seu texto
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="instruction">Instruções Específicas (opcional)</Label>
                  <Textarea
                    id="instruction"
                    placeholder="Forneça instruções específicas para a análise (opcional)"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    className="resize-none"
                    disabled={analyzeTextMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Instruções personalizadas para orientar a análise da Prof. Ana
                  </p>
                </div>
                
                {/* Exemplos de instruções */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="examples">
                    <AccordionTrigger className="text-sm">
                      Exemplos de instruções
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 space-y-2">
                        {getInstructionExamples(analysisType).map((example, index) => (
                          <div 
                            key={index}
                            className="text-sm p-2 rounded-md border cursor-pointer hover:bg-gray-50"
                            onClick={() => setInstruction(example)}
                          >
                            "{example}"
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => analyzeTextMutation.mutate()}
                  disabled={!text.trim() || analyzeTextMutation.isPending}
                >
                  {analyzeTextMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <PenTool className="mr-2 h-4 w-4" />
                      Analisar Texto
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
                    {analysisResult ? analysisTypeLabels[analysisType] : 'Aguardando análise do texto'}
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
                {analyzeTextMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="bg-primary/10 rounded-full p-4 mb-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Analisando seu texto...</h3>
                    <p className="text-muted-foreground mb-6">
                      Prof. Ana está avaliando o conteúdo com precisão.
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
                      <PenTool className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Aguardando um texto para analisar</h3>
                      <p className="text-muted-foreground max-w-md">
                        Digite ou cole um texto na área à esquerda e clique em "Analisar Texto" 
                        para receber uma análise detalhada da Prof. Ana.
                      </p>
                    </div>
                    
                    <div className="text-center w-full max-w-md">
                      <Separator className="my-4" />
                      <h4 className="text-sm font-medium mb-2">O que você pode analisar:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-md border">
                          <FileText className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Redações
                        </div>
                        <div className="p-2 rounded-md border">
                          <Book className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Trabalhos Acadêmicos
                        </div>
                        <div className="p-2 rounded-md border">
                          <FileText className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Resumos
                        </div>
                        <div className="p-2 rounded-md border">
                          <CheckCircle className="h-4 w-4 mb-1 mx-auto text-primary" />
                          Objetivos de Aprendizagem
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
                      Recomenda-se revisar o conteúdo antes de utilizá-lo formalmente.
                    </p>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}