import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { 
  Search, 
  FileText, 
  Upload,
  Calendar,
  User,
  AlertCircle,
  Download,
  CheckCircle,
  Clock
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Esquema de validação para o formulário de upload
const uploadDocumentSchema = z.object({
  studentId: z.string().min(1, { message: 'Selecione um aluno' }),
  documentType: z.string().min(1, { message: 'Selecione o tipo de documento' }),
  comments: z.string().optional(),
  file: z.instanceof(File, { message: 'Selecione um arquivo para enviar' })
});

type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;

export default function PartnerStudentDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Configuração do formulário
  const form = useForm<UploadDocumentFormValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      studentId: '',
      documentType: '',
      comments: '',
    }
  });

  // Query para buscar documentos
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/partner/student-documents'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/student-documents');
      return response.data;
    }
  });

  // Query para buscar alunos vinculados ao parceiro
  const { data: students } = useQuery({
    queryKey: ['/api/partner/students'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/students');
      return response.data;
    }
  });

  // Mutation para enviar um novo documento
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('/api/partner/student-documents', {
        method: 'POST',
        body: formData,
        headers: {
          // Não incluir content-type, o navegador vai definir automaticamente para multipart/form-data
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partner/student-documents'] });
      setIsUploadDialogOpen(false);
      form.reset();
      setSelectedFile(null);
      toast({
        title: "Documento enviado com sucesso",
        description: "O documento foi enviado e está aguardando aprovação.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar documento",
        description: error.message || "Ocorreu um erro ao enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleUploadDocument = async (values: UploadDocumentFormValues) => {
    if (!selectedFile) {
      toast({
        title: "Arquivo não selecionado",
        description: "Selecione um arquivo para enviar.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('studentId', values.studentId);
    formData.append('documentType', values.documentType);
    
    if (values.comments) {
      formData.append('comments', values.comments);
    }
    
    formData.append('file', selectedFile);

    uploadDocumentMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePreviewDocument = (document: any) => {
    setSelectedDocument(document);
    setIsPreviewDialogOpen(true);
  };

  // Filtra os documentos com base na aba ativa e na busca
  const filteredDocuments = React.useMemo(() => {
    const documents = data || [];
    
    return documents.filter((doc: any) => {
      // Filtro por status
      if (activeTab !== 'all' && doc.status !== activeTab) {
        return false;
      }
      
      // Filtro por busca
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(query) ||
          doc.studentName.toLowerCase().includes(query) ||
          doc.documentType.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [data, activeTab, searchQuery]);

  // Formatação da data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Renderiza o status do documento com cores específicas
  const renderDocumentStatus = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            Recusado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Documentos dos Alunos | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos dos Alunos</h1>
            <p className="text-muted-foreground">
              Gerencie documentos e certificações de seus alunos
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
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Enviar Documento
            </Button>
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
                      <div className="h-5 w-2/5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex justify-between mt-3">
                        <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-1/5 bg-gray-200 rounded animate-pulse"></div>
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
                      Ocorreu um erro ao carregar os documentos. Tente novamente mais tarde.
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
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Documento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((document: any) => (
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
                          <p className="text-sm font-medium">Feedback recebido:</p>
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

      {/* Dialog para upload de documento */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>
              Envie documentos para seus alunos cadastrados. Documentos enviados serão analisados para certificação.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUploadDocument)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aluno</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="identity">Documento de Identidade (RG)</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="address">Comprovante de Endereço</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="transcript">Histórico Escolar</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione informações relevantes sobre o documento"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>Arquivo</FormLabel>
                    <FormControl>
                      <div className="border rounded-md p-3">
                        <input 
                          type="file" 
                          onChange={handleFileChange}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {selectedFile && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Arquivo selecionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadDocumentMutation.isPending}
                >
                  {uploadDocumentMutation.isPending ? "Enviando..." : "Enviar Documento"}
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
              Documento de {selectedDocument?.studentName} enviado em {selectedDocument ? formatDate(selectedDocument.uploadDate) : ''}
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