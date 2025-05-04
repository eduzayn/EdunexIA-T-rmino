import React, { useState, useRef, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

// Icons
import {
  Send,
  MessageSquare,
  Info,
  Settings,
  Trash2,
  Upload,
  Image,
  Download,
  Eraser,
  RefreshCcw,
  FileText,
  Paperclip,
  Book,
  ChevronRight,
  Loader2,
  BrainCircuit,
} from "lucide-react";

// Tipos para mensagens
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Eu sou Prof. Ana, sua assistente educacional. Como posso ajudar você hoje com questões pedagógicas, elaboração de conteúdo ou dúvidas educacionais?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState('');
  const [activeConversation, setActiveConversation] = useState('new');

  // Mutação para enviar mensagem para a API
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Prepara o histórico para enviar para a API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          conversationHistory,
          contextData: contextData || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar sua mensagem');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Adiciona a resposta da IA ao chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    onError: (error: Error) => {
      // Exibe mensagem de erro
      toast({
        title: 'Erro ao processar mensagem',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      
      // Adiciona mensagem de erro ao chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  // Rola para o final da conversa quando novas mensagens são adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Adiciona a mensagem do usuário ao chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Envia a mensagem para a API
    sendMessageMutation.mutate(inputValue);
  };

  // Função para lidar com tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Função para limpar a conversa
  const handleClearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Olá! Eu sou Prof. Ana, sua assistente educacional. Como posso ajudar você hoje com questões pedagógicas, elaboração de conteúdo ou dúvidas educacionais?',
        timestamp: new Date()
      }
    ]);
  };

  // Função para abrir o seletor de arquivos
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Função para processar o arquivo selecionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Se for uma imagem, enviar para análise
    if (file.type.startsWith('image/')) {
      // Prepara o arquivo para envio
      const formData = new FormData();
      formData.append('image', file);
      formData.append('prompt', 'Analise esta imagem e descreva seu conteúdo educacional');
      
      try {
        setIsLoading(true);
        
        // Adiciona mensagem do usuário com a imagem
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `[Imagem enviada: ${file.name}]`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Envia a imagem para análise
        const response = await fetch('/api/ai/analyze-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Erro ao analisar imagem');
        }
        
        const data = await response.json();
        
        // Adiciona a resposta da análise
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error: any) {
        toast({
          title: 'Erro ao processar imagem',
          description: error.message || 'Ocorreu um erro ao analisar a imagem',
          variant: 'destructive',
        });
        
        // Adiciona mensagem de erro
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao analisar a imagem. Por favor, tente novamente.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        // Limpa o input de arquivo
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else {
      // Para outros tipos de arquivo, informar que não é suportado
      toast({
        title: 'Tipo de arquivo não suportado',
        description: 'Por favor, envie apenas imagens (JPG, PNG, etc.) para análise.',
        variant: 'destructive',
      });
      
      // Limpa o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Formatar data/hora
  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lista de conversas recentes (simulação)
  const recentConversations = [
    { id: 'new', title: 'Nova conversa', timestamp: new Date() },
    { id: 'conv1', title: 'Estratégias de ensino para matemática', timestamp: new Date(Date.now() - 3600000) },
    { id: 'conv2', title: 'Plano de aula sobre meio ambiente', timestamp: new Date(Date.now() - 86400000) },
    { id: 'conv3', title: 'Abordagens para inclusão educacional', timestamp: new Date(Date.now() - 172800000) },
  ];

  // Formatar data de conversas
  const formatConversationDate = (timestamp: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Ontem';
    } else {
      return timestamp.toLocaleDateString('pt-BR');
    }
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Barra lateral com conversas */}
        <div className="hidden md:flex w-80 flex-col border-r overflow-hidden">
          <div className="p-4 border-b">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setActiveConversation('new');
                handleClearConversation();
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Nova conversa
            </Button>
          </div>
          
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-medium text-muted-foreground">Conversas recentes</h3>
          </div>
          
          <div className="flex-1 overflow-auto">
            {recentConversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={`
                  px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors
                  ${activeConversation === conversation.id ? 'bg-gray-50' : ''}
                `}
                onClick={() => {
                  // Em uma implementação real, carregaria a conversa do servidor
                  setActiveConversation(conversation.id);
                  if (conversation.id === 'new') {
                    handleClearConversation();
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="text-sm font-medium truncate w-44">{conversation.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatConversationDate(conversation.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                // Em uma implementação real, excluiria todas as conversas
                toast({
                  title: "Histórico limpo",
                  description: "Todas as conversas foram removidas.",
                });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar histórico
            </Button>
          </div>
        </div>

        {/* Área principal de chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cabeçalho */}
          <header className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-9 w-9 mr-2">
                <AvatarImage src="/assets/prof-ana-avatar.png" alt="Prof. Ana" />
                <AvatarFallback className="bg-primary text-white">PA</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">Prof. Ana</h2>
                <p className="text-xs text-muted-foreground">Assistente Educacional IA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Sobre Prof. Ana</SheetTitle>
                    <SheetDescription>
                      Assistente educacional baseada em Inteligência Artificial
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <BrainCircuit className="h-10 w-10 text-primary" />
                      <div>
                        <h3 className="font-semibold">Claude-3-7-Sonnet</h3>
                        <p className="text-sm text-muted-foreground">Modelo de IA</p>
                      </div>
                    </div>
                    
                    <p className="text-sm">
                      Prof. Ana é uma assistente educacional baseada no modelo de IA Claude da Anthropic. 
                      Ela foi projetada para ajudar educadores, administradores e estudantes com diversas 
                      tarefas pedagógicas, incluindo:
                    </p>
                    
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Esclarecer dúvidas sobre conteúdo educacional</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Criar materiais didáticos, planos de aula e avaliações</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Analisar textos e fornecer feedback</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Sugerir estratégias pedagógicas e metodologias</span>
                      </li>
                    </ul>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">Melhores práticas</h3>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Seja específico com suas perguntas para obter respostas mais úteis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Forneça contexto sobre o nível educacional e objetivos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Use a opção "Adicionar Contexto" para personalizar as respostas</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" size="icon" onClick={handleClearConversation}>
                <Eraser className="h-4 w-4" />
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Configurações de Conversa</SheetTitle>
                    <SheetDescription>
                      Personalize o comportamento da assistente
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Adicionar Contexto</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        Informações adicionais para personalizar as respostas (ex: série escolar, disciplina)
                      </p>
                      <Textarea
                        placeholder="Ex: Estou trabalhando com alunos do 9º ano do ensino fundamental na disciplina de ciências."
                        value={contextData}
                        onChange={(e) => setContextData(e.target.value)}
                        className="min-h-24"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Tipo de Conteúdo</h3>
                      <Select defaultValue="balanced">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo de conteúdo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="creative">Criativo</SelectItem>
                          <SelectItem value="balanced">Equilibrado</SelectItem>
                          <SelectItem value="precise">Preciso</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Define o estilo de resposta da assistente
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Personalização</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Respostas detalhadas</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Exemplos práticos</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Referências pedagógicas</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Button className="w-full" onClick={() => {
                        // Em uma aplicação real, salvaria as configurações
                        toast({
                          title: "Configurações salvas",
                          description: "Suas preferências de conversa foram atualizadas.",
                        });
                      }}>
                        Salvar Configurações
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>

          {/* Área de mensagens */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-3xl rounded-lg p-4 
                    ${message.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-12' 
                      : 'bg-muted mr-12'
                    }
                  `}
                >
                  <div className="flex items-center mb-1 gap-2">
                    {message.role === 'assistant' && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="/assets/prof-ana-avatar.png" alt="Prof. Ana" />
                        <AvatarFallback className="text-xs">PA</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-xs opacity-70">
                      {message.role === 'user' ? 'Você' : 'Prof. Ana'} • {formatMessageTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted max-w-3xl rounded-lg p-4 mr-12">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/assets/prof-ana-avatar.png" alt="Prof. Ana" />
                      <AvatarFallback className="text-xs">PA</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Prof. Ana está escrevendo...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Área de input */}
          <div className="p-4 border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={handleFileButtonClick}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <div className="relative flex-1">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Envie uma mensagem para Prof. Ana..."
                  className="min-h-10 resize-none pr-10"
                  rows={1}
                  disabled={isLoading}
                />
                <Button 
                  type="submit"
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1 h-8 w-8"
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            
            <p className="text-xs text-center text-muted-foreground mt-2">
              Prof. Ana utiliza I.A. para gerar respostas. Sempre verifique informações críticas.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}