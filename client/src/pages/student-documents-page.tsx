import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Clock, Download, File, FileCheck, FilePlus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Tipo para solicitação de documento
interface DocumentRequest {
  id: number;
  title: string;
  documentType: string;
  requestDate: string;
  status: "pending" | "processing" | "completed" | "rejected";
  justification?: string;
  responseMessage?: string;
  documentUrl?: string;
}

// Tipo para documento da biblioteca
interface LibraryDocument {
  id: number;
  title: string;
  type: string;
  description: string;
  uploadDate: string;
  downloadUrl: string;
  fileSize: string;
}

// Schema de validação para nova solicitação de documento
const documentRequestSchema = z.object({
  documentType: z.string({
    required_error: "Selecione o tipo de documento",
  }),
  justification: z.string().optional(),
});

export default function StudentDocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  // Formulário para solicitação de documento
  const form = useForm<z.infer<typeof documentRequestSchema>>({
    resolver: zodResolver(documentRequestSchema),
    defaultValues: {
      documentType: "",
      justification: "",
    },
  });

  // Buscar solicitações de documentos do aluno
  const {
    data: documentRequests = [],
    isLoading: isRequestsLoading,
    error: requestsError
  } = useQuery<DocumentRequest[]>({
    queryKey: ['/api/student/document-requests'],
    // Por ora, vamos usar dados simulados até implementarmos a API real
    queryFn: async () => {
      // Simulando dados para visualização
      return [
        {
          id: 1,
          title: "Certidão de Matrícula",
          documentType: "enrollment_certificate",
          requestDate: "2025-04-20T10:00:00Z",
          status: "completed",
          documentUrl: "#" 
        },
        {
          id: 2,
          title: "Histórico Escolar",
          documentType: "transcript",
          requestDate: "2025-04-25T14:30:00Z",
          status: "pending"
        },
        {
          id: 3,
          title: "Declaração de Vínculo",
          documentType: "enrollment_declaration",
          requestDate: "2025-04-28T09:15:00Z",
          status: "processing"
        }
      ] as DocumentRequest[];
    },
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Buscar documentos da biblioteca
  const {
    data: libraryDocuments = [],
    isLoading: isLibraryLoading,
    error: libraryError
  } = useQuery<LibraryDocument[]>({
    queryKey: ['/api/student/library-documents'],
    // Por ora, vamos usar dados simulados até implementarmos a API real
    queryFn: async () => {
      // Simulando dados para visualização
      return [
        {
          id: 1,
          title: "Manual do Aluno",
          type: "pdf",
          description: "Guia completo com informações sobre a instituição, regras e procedimentos acadêmicos",
          uploadDate: "2025-03-15T10:00:00Z",
          downloadUrl: "#",
          fileSize: "2.4 MB"
        },
        {
          id: 2,
          title: "Calendário Acadêmico 2025",
          type: "pdf",
          description: "Calendário com todas as datas importantes do ano letivo",
          uploadDate: "2025-01-05T14:30:00Z",
          downloadUrl: "#",
          fileSize: "845 KB"
        },
        {
          id: 3,
          title: "Regimento Interno",
          type: "pdf",
          description: "Documento com as normas e regulamentos da instituição",
          uploadDate: "2024-12-10T09:15:00Z",
          downloadUrl: "#",
          fileSize: "1.7 MB"
        }
      ] as LibraryDocument[];
    },
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Mutação para solicitar um novo documento
  const requestDocumentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof documentRequestSchema>) => {
      // Na implementação real, isto seria uma chamada API
      // return apiRequest('/api/student/document-requests', 'POST', data);
      
      // Por ora, apenas simulamos o sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, id: Math.floor(Math.random() * 1000) + 10 };
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada com sucesso",
        description: "Você será notificado quando o documento estiver disponível.",
      });
      setIsRequestOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/student/document-requests'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao solicitar documento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação."
      });
    }
  });

  // Submissão do formulário
  const onSubmit = (data: z.infer<typeof documentRequestSchema>) => {
    requestDocumentMutation.mutate(data);
  };

  // Função para exibir o status da solicitação de forma amigável
  const renderRequestStatus = (status: string) => {
    const statusConfig: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
      pending: { 
        label: "Pendente", 
        color: "bg-yellow-100 text-yellow-800 border-none", 
        icon: <Clock className="h-3.5 w-3.5 mr-1" />
      },
      processing: { 
        label: "Em processamento", 
        color: "bg-blue-100 text-blue-800 border-none", 
        icon: <FileText className="h-3.5 w-3.5 mr-1" />
      },
      completed: { 
        label: "Concluído", 
        color: "bg-green-100 text-green-800 border-none", 
        icon: <FileCheck className="h-3.5 w-3.5 mr-1" />
      },
      rejected: { 
        label: "Recusado", 
        color: "bg-red-100 text-red-800 border-none", 
        icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant="outline" className={config.color}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Mapeamento dos tipos de documentos
  const documentTypes = {
    enrollment_certificate: "Certidão de Matrícula",
    transcript: "Histórico Escolar",
    enrollment_declaration: "Declaração de Vínculo",
    course_completion: "Certificado de Conclusão",
    course_content: "Conteúdo Programático",
    other: "Outro (especificar na justificativa)"
  };

  return (
    <AppShell>
      <Helmet>
        <title>Documentos | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Acesse documentos acadêmicos e solicite novos documentos
            </p>
          </div>
          
          <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
            <DialogTrigger asChild>
              <Button>
                <FilePlus className="mr-2 h-4 w-4" />
                Solicitar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Solicitar documento acadêmico</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para solicitar um novo documento. Você será notificado quando o documento estiver disponível.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de documento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de documento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(documentTypes).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justificativa ou observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Insira qualquer informação adicional relevante para a solicitação" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Se escolheu "Outro", especifique qual documento deseja.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={requestDocumentMutation.isPending}
                    >
                      {requestDocumentMutation.isPending ? "Enviando..." : "Enviar solicitação"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Minhas Solicitações</TabsTrigger>
            <TabsTrigger value="uploads">Meus Documentos</TabsTrigger>
            <TabsTrigger value="library">Biblioteca de Documentos</TabsTrigger>
          </TabsList>
          
          {/* Aba de Solicitações */}
          <TabsContent value="requests" className="space-y-4 pt-4">
            {isRequestsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-2/5" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex justify-between mt-3">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-6 w-1/5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : requestsError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-3" />
                    <p className="text-destructive text-lg font-medium">Erro ao carregar solicitações</p>
                    <p className="text-muted-foreground mt-1">
                      Ocorreu um erro ao carregar suas solicitações de documentos. Tente novamente mais tarde.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : documentRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <File className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-lg font-medium">Nenhuma solicitação encontrada</p>
                    <p className="text-muted-foreground mt-1 mb-4">
                      Você ainda não solicitou nenhum documento acadêmico.
                    </p>
                    <Button onClick={() => setIsRequestOpen(true)}>
                      <FilePlus className="mr-2 h-4 w-4" />
                      Solicitar documento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {documentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        {renderRequestStatus(request.status)}
                      </div>
                      <CardDescription>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          <span>Solicitado em {formatDate(request.requestDate)}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {request.justification && (
                        <>
                          <p className="text-sm font-medium">Justificativa:</p>
                          <p className="text-sm text-muted-foreground mb-3">{request.justification}</p>
                        </>
                      )}
                      {request.responseMessage && (
                        <>
                          <p className="text-sm font-medium">Resposta da instituição:</p>
                          <p className="text-sm text-muted-foreground mb-3">{request.responseMessage}</p>
                        </>
                      )}
                      {request.status === 'completed' && request.documentUrl && (
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <a href={request.documentUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Baixar documento
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Aba da Biblioteca */}
          <TabsContent value="library" className="space-y-4 pt-4">
            {isLibraryLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-2/5" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : libraryError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-3" />
                    <p className="text-destructive text-lg font-medium">Erro ao carregar documentos</p>
                    <p className="text-muted-foreground mt-1">
                      Ocorreu um erro ao carregar a biblioteca de documentos. Tente novamente mais tarde.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : libraryDocuments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-lg font-medium">Biblioteca vazia</p>
                    <p className="text-muted-foreground mt-1">
                      Não há documentos disponíveis na biblioteca.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {libraryDocuments.map((document) => (
                  <Card key={document.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{document.title}</CardTitle>
                        <Badge variant="outline" className="bg-slate-100">
                          {document.type.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          <span>Disponível desde {formatDate(document.uploadDate)}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{document.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{document.fileSize}</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={document.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Baixar
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}