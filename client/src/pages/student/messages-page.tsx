import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MailIcon, PlusIcon, EyeIcon, ArchiveIcon, TrashIcon, RefreshCwIcon, SendIcon, SearchIcon, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StudentMessagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  // Buscar mensagens do aluno
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/student/messages'],
  });

  // Filtrar mensagens com base no termo de pesquisa
  const filteredReceived = data?.received?.filter(message => 
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredSent = data?.sent?.filter(message => 
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Formulário para nova mensagem
  const messageSchema = z.object({
    recipientId: z.number({
      required_error: "Destinatário é obrigatório",
    }),
    subject: z.string().min(1, "Assunto é obrigatório"),
    content: z.string().min(1, "Conteúdo da mensagem é obrigatório"),
    threadId: z.number().optional(),
  });

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientId: undefined,
      subject: "",
      content: "",
      threadId: undefined,
    },
  });

  // Mutação para enviar nova mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest('/api/student/messages', {
        method: 'POST', 
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/messages'] });
      form.reset();
      setNewMessageOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao enviar mensagem:", error);
    },
  });

  // Mutação para marcar mensagem como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      return await apiRequest(`/api/student/messages/${messageId}/read`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/messages'] });
    },
    onError: (error) => {
      console.error("Erro ao marcar mensagem como lida:", error);
    },
  });

  // Abrir mensagem selecionada
  const openMessage = (message) => {
    setSelectedMessage(message);
    
    // Se a mensagem não foi lida, marcar como lida
    if (message.status === 'unread') {
      markAsReadMutation.mutate(message.id);
    }
  };

  // Responder a uma mensagem
  const replyToMessage = (message) => {
    if (!message) return;
    
    // Verificar se é uma mensagem recebida
    const isReceived = data?.received?.some(m => m.id === message.id);
    
    // Configurar o formulário de resposta
    form.reset({
      recipientId: isReceived ? message.senderId : message.recipientId,
      subject: `Re: ${message.subject}`,
      content: "",
      threadId: message.threadId || message.id,
    });
    
    setNewMessageOpen(true);
  };

  // Enviar nova mensagem
  const onSubmit = (formData) => {
    sendMessageMutation.mutate(formData);
  };

  return (
    <AppShell>
      <Helmet>
        <title>Mensagens | Edunéxia</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Mensagens</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar mensagens..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" /> Nova Mensagem
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nova Mensagem</DialogTitle>
                  <DialogDescription>
                    Crie uma nova mensagem para enviar a um professor ou administrador.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recipientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destinatário</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ID do destinatário"
                              {...field}
                              type="number"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Assunto da mensagem" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Digite sua mensagem..." 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <input type="hidden" {...form.register("threadId")} />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setNewMessageOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={sendMessageMutation.isPending}>
                        {sendMessageMutation.isPending ? (
                          <>Enviando...</>
                        ) : (
                          <>
                            <SendIcon className="h-4 w-4 mr-2" /> Enviar
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Mensagens */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="received">
              <TabsList className="w-full">
                <TabsTrigger value="received" className="flex-1">Recebidas</TabsTrigger>
                <TabsTrigger value="sent" className="flex-1">Enviadas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="received" className="mt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                      <Card key={i} className="cursor-pointer">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/4" />
                        </CardHeader>
                        <CardContent className="pb-2">
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : isError ? (
                  <Card className="bg-destructive/10">
                    <CardContent className="p-4 text-center">
                      <p className="text-destructive font-semibold">
                        Erro ao carregar mensagens.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                        <RefreshIcon className="h-4 w-4 mr-2" /> Tentar novamente
                      </Button>
                    </CardContent>
                  </Card>
                ) : filteredReceived.length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-6 text-center">
                      <MailIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "Nenhuma mensagem corresponde à sua pesquisa." : "Você não tem mensagens recebidas."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredReceived.map((message) => (
                      <Card 
                        key={message.id} 
                        className={`cursor-pointer ${selectedMessage?.id === message.id ? 'border-primary' : ''} ${message.status === 'unread' ? 'bg-primary/5' : ''}`}
                        onClick={() => openMessage(message)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{message.subject}</CardTitle>
                            {message.status === 'unread' && (
                              <Badge variant="default" className="ml-2">Nova</Badge>
                            )}
                          </div>
                          <CardDescription>
                            De: {message.senderId || "Sistema"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {message.content}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0 pb-2 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.sentAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sent" className="mt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="cursor-pointer">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/4" />
                        </CardHeader>
                        <CardContent className="pb-2">
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : isError ? (
                  <Card className="bg-destructive/10">
                    <CardContent className="p-4 text-center">
                      <p className="text-destructive font-semibold">
                        Erro ao carregar mensagens.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                        <RefreshIcon className="h-4 w-4 mr-2" /> Tentar novamente
                      </Button>
                    </CardContent>
                  </Card>
                ) : filteredSent.length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-6 text-center">
                      <MailIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "Nenhuma mensagem corresponde à sua pesquisa." : "Você não enviou nenhuma mensagem."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredSent.map((message) => (
                      <Card 
                        key={message.id} 
                        className={`cursor-pointer ${selectedMessage?.id === message.id ? 'border-primary' : ''}`}
                        onClick={() => openMessage(message)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{message.subject}</CardTitle>
                          <CardDescription>
                            Para: {message.recipientId}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {message.content}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0 pb-2 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.sentAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Detalhes da Mensagem */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedMessage.subject}</CardTitle>
                      <CardDescription>
                        {data?.received?.some(m => m.id === selectedMessage.id) 
                          ? `De: ${selectedMessage.senderId || "Sistema"}`
                          : `Para: ${selectedMessage.recipientId}`}
                      </CardDescription>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(selectedMessage.sentAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                        {selectedMessage.readAt && ` • Lida em ${new Date(selectedMessage.readAt).toLocaleString('pt-BR')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {data?.received?.some(m => m.id === selectedMessage.id) && selectedMessage.status === 'read' && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckIcon className="h-3 w-3" /> Lida
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" title="Arquivar">
                        <ArchiveIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Excluir">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="py-4 flex-grow overflow-auto">
                  <div className="whitespace-pre-line">
                    {selectedMessage.content}
                  </div>
                  
                  {selectedMessage.attachmentUrl && (
                    <div className="mt-4 p-3 border rounded-md">
                      <p className="font-medium text-sm mb-2">Anexo:</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedMessage.attachmentUrl} target="_blank" rel="noopener noreferrer">
                          {selectedMessage.attachmentName || "Anexo"}
                          {selectedMessage.attachmentSize && ` (${(selectedMessage.attachmentSize / 1024).toFixed(1)} KB)`}
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
                <Separator />
                <CardFooter className="py-3">
                  <Button className="ml-auto" onClick={() => replyToMessage(selectedMessage)}>
                    <SendIcon className="h-4 w-4 mr-2" /> Responder
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center p-6">
                  <MailIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma mensagem selecionada</h3>
                  <p className="text-muted-foreground mb-4">
                    Selecione uma mensagem para visualizar seu conteúdo ou envie uma nova mensagem.
                  </p>
                  <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusIcon className="h-4 w-4 mr-2" /> Nova Mensagem
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}