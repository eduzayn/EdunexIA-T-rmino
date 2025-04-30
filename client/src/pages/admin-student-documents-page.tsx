import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Download, 
  FileCheck, 
  FileText, 
  Search, 
  CheckCircle, 
  XCircle, 
  Filter,
  User
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Tipo para documento pessoal do aluno
interface StudentDocument {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  documentType: string;
  uploadDate: string;
  fileSize: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  downloadUrl: string;
}

// Schema de validação para feedback de documento recusado
const documentFeedbackSchema = z.object({
  comments: z.string({
    required_error: "O motivo da recusa é obrigatório",
  }).min(10, {
    message: "O feedback deve ter pelo menos 10 caracteres",
  }),
});

export default function AdminStudentDocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDocument, setSelectedDocument] = useState<StudentDocument | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Formulário para feedback de recusa
  const form = useForm<z.infer<typeof documentFeedbackSchema>>({
    resolver: zodResolver(documentFeedbackSchema),
    defaultValues: {
      comments: "",
    },
  });

  // Buscar documentos dos alunos
  const {
    data: studentDocuments = [],
    isLoading,
    error
  } = useQuery<StudentDocument[]>({
    queryKey: ['/api/admin/student-documents'],
    // Por ora, vamos usar dados simulados até implementarmos a API real
    queryFn: async () => {
      // Simulando dados para visualização
      return [
        {
          id: 1,
          studentId: 101,
          studentName: "João Silva",
          title: "RG",
          documentType: "rg",
          uploadDate: "2025-04-10T10:00:00Z",
          fileSize: "1.2 MB",
          status: "approved",
          downloadUrl: "#"
        },
        {
          id: 2,
          studentId: 101,
          studentName: "João Silva",
          title: "Comprovante de Endereço",
          documentType: "address_proof",
          uploadDate: "2025-04-15T14:30:00Z",
          fileSize: "3.5 MB",
          status: "pending",
          downloadUrl: "#"
        },
        {
          id: 3,
          studentId: 102,
          studentName: "Maria Oliveira",
          title: "Certificado de Conclusão do Ensino Médio",
          documentType: "high_school_certificate",
          uploadDate: "2025-04-18T09:15:00Z",
          fileSize: "2.8 MB",
          status: "rejected",
          comments: "Documento ilegível. Por favor, envie uma cópia mais clara.",
          downloadUrl: "#"
        },
        {
          id: 4,
          studentId: 103,
          studentName: "Carlos Mendes",
          title: "CPF",
          documentType: "cpf",
          uploadDate: "2025-04-20T11:25:00Z",
          fileSize: "980 KB",
          status: "pending",
          downloadUrl: "#"
        },
        {
          id: 5,
          studentId: 104,
          studentName: "Ana Beatriz",
          title: "Diploma de Graduação",
          documentType: "graduation_diploma",
          uploadDate: "2025-04-22T16:40:00Z",
          fileSize: "4.2 MB",
          status: "pending",
          downloadUrl: "#"
        }
      ] as StudentDocument[];
    },
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Mutação para aprovar documento
  const approveDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      // Na implementação real, isto seria uma chamada API
      // return apiRequest(`/api/admin/student-documents/${documentId}/approve`, 'POST');
      
      // Por ora, apenas simulamos o sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Documento aprovado com sucesso",
        description: "O aluno será notificado sobre a aprovação.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/student-documents'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar documento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação."
      });
    }
  });

  // Mutação para recusar documento
  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, comments }: { documentId: number, comments: string }) => {
      // Na implementação real, isto seria uma chamada API
      // return apiRequest(`/api/admin/student-documents/${documentId}/reject`, 'POST', { comments });
      
      // Por ora, apenas simulamos o sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Documento recusado",
        description: "O aluno será notificado sobre a recusa e receberá o feedback.",
      });
      setIsRejectDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/student-documents'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao recusar documento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação."
      });
    }
  });

  // Submissão do formulário de feedback
  const onSubmitFeedback = (data: z.infer<typeof documentFeedbackSchema>) => {
    if (selectedDocument) {
      rejectDocumentMutation.mutate({ 
        documentId: selectedDocument.id, 
        comments: data.comments 
      });
    }
  };

  // Filtrar documentos com base na aba ativa e busca
  const filteredDocuments = studentDocuments.filter(doc => {
    // Filtrar por status (aba)
    if (activeTab !== "all" && doc.status !== activeTab) {
      return false;
    }
    
    // Filtrar por texto de busca
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.studentName.toLowerCase().includes(query) ||
        doc.documentType.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Função para exibir o status do documento de forma amigável
  const renderDocumentStatus = (status: string) => {
    const statusConfig: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
      pending: { 
        label: "Pendente", 
        color: "bg-yellow-100 text-yellow-800 border-none", 
        icon: <Clock className="h-3.5 w-3.5 mr-1" />
      },
      approved: { 
        label: "Aprovado", 
        color: "bg-green-100 text-green-800 border-none", 
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
      },
      rejected: { 
        label: "Recusado", 
        color: "bg-red-100 text-red-800 border-none", 
        icon: <XCircle className="h-3.5 w-3.5 mr-1" />
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

  // Iniciar o processo de recusa de um documento
  const handleRejectDocument = (document: StudentDocument) => {
    setSelectedDocument(document);
    setIsRejectDialogOpen(true);
  };

  // Iniciar o processo de aprovação de um documento
  const handleApproveDocument = (documentId: number) => {
    approveDocumentMutation.mutate(documentId);
  };

  // Visualizar detalhes do documento
  const handlePreviewDocument = (document: StudentDocument) => {
    setSelectedDocument(document);
    setIsPreviewDialogOpen(true);
  };

  return (
    <AppShell>
      <Helmet>
        <title>Gestão de Documentos | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos dos Alunos</h1>
            <p className="text-muted-foreground">
              Gerencie documentos pessoais enviados pelos alunos
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar documentos..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs 
          defaultValue="pending" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Recusados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4 pt-4">
            {isLoading ? (
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
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-3" />
                    <p className="text-destructive text-lg font-medium">Erro ao carregar documentos</p>
                    <p className="text-muted-foreground mt-1">
                      Ocorreu um erro ao carregar os documentos dos alunos. Tente novamente mais tarde.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-lg font-medium">Nenhum documento encontrado</p>
                    <p className="text-muted-foreground mt-1 mb-4">
                      {searchQuery.trim() !== "" 
                        ? "Nenhum documento corresponde à sua busca." 
                        : `Não há documentos ${activeTab === "pending" ? "pendentes" : 
                           activeTab === "approved" ? "aprovados" : 
                           activeTab === "rejected" ? "recusados" : ""} no momento.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((document) => (
                  <Card key={document.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-lg">{document.title}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            <span>{document.studentName}</span>
                          </CardDescription>
                        </div>
                        {renderDocumentStatus(document.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        <span>Enviado em {formatDate(document.uploadDate)}</span>
                        <span className="mx-2">•</span>
                        <span>{document.fileSize}</span>
                      </div>
                      
                      {document.comments && (
                        <div className="mb-3 bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium">Feedback enviado:</p>
                          <p className="text-sm text-muted-foreground">{document.comments}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePreviewDocument(document)}
                        >
                          <Search className="mr-2 h-3.5 w-3.5" />
                          Visualizar
                        </Button>
                        
                        {document.status === "pending" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApproveDocument(document.id)}
                              disabled={approveDocumentMutation.isPending}
                            >
                              <FileCheck className="mr-2 h-3.5 w-3.5" />
                              Aprovar
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRejectDocument(document)}
                              disabled={rejectDocumentMutation.isPending}
                            >
                              <XCircle className="mr-2 h-3.5 w-3.5" />
                              Recusar
                            </Button>
                          </>
                        )}

                        <Button variant="outline" size="sm" asChild className="ml-auto">
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

      {/* Dialog para recusar documento */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recusar documento</DialogTitle>
            <DialogDescription>
              Forneça um feedback claro sobre o motivo da recusa do documento. O aluno receberá esta mensagem.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitFeedback)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da recusa</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explique por que o documento não pôde ser aceito e o que o aluno precisa fazer para corrigir o problema." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={rejectDocumentMutation.isPending}
                >
                  {rejectDocumentMutation.isPending ? "Enviando..." : "Recusar documento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar documento */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              Documento enviado por {selectedDocument?.studentName} em {selectedDocument ? formatDate(selectedDocument.uploadDate) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 rounded-md p-4 min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Visualização do documento não disponível. Por favor, faça o download para ver o documento completo.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {selectedDocument?.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => {
                    if (selectedDocument) {
                      handleApproveDocument(selectedDocument.id);
                      setIsPreviewDialogOpen(false);
                    }
                  }}
                  disabled={approveDocumentMutation.isPending}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
                
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setIsPreviewDialogOpen(false);
                    if (selectedDocument) {
                      handleRejectDocument(selectedDocument);
                    }
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Recusar
                </Button>
              </>
            )}
            <Button asChild>
              <a href={selectedDocument?.downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Baixar documento
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}