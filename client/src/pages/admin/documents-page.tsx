import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AppShell } from '@/components/layout/app-shell';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Check,
  X,
  FileText,
  Edit,
  Trash,
  DownloadCloud,
  Search,
  Plus,
  FileQuestion,
  AlertCircle
} from 'lucide-react';

// Interface para as propriedades do componente de status
interface StatusBadgeProps {
  status: string;
}

// Componente para exibir o status com cores diferentes
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
  
  switch (status) {
    case 'approved':
      variant = 'default';
      break;
    case 'rejected':
      variant = 'destructive';
      break;
    case 'pending':
      variant = 'secondary';
      break;
    default:
      variant = 'outline';
  }
  
  // Mapeamento de status para exibição em português
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'processing': 'Em Processamento',
    'completed': 'Concluído',
  };
  
  return (
    <Badge variant={variant}>{statusMap[status] || status}</Badge>
  );
};

// Interface para os dados do documento
interface DocumentType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  category: string;
  isRequired: boolean;
  isActive: boolean;
}

interface StudentDocument {
  id: number;
  studentId: number;
  studentName?: string;
  title: string;
  documentTypeId: number | null;
  documentTypeName?: string;
  uploadDate: string;
  fileSize: number | string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
}

interface DocumentRequest {
  id: number;
  studentId: number;
  studentName?: string;
  documentTypeId: number | null;
  documentTypeName?: string;
  requestDate: string;
  status: string;
  justification: string | null;
  comments: string | null;
  generatedDocumentId: number | null;
}

// Componente principal da página
export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar documentos dos alunos
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/admin/student-documents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/student-documents');
      return response.json();
    }
  });
  
  // Buscar solicitações de documentos
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/admin/document-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/document-requests');
      return response.json();
    }
  });
  
  // Buscar tipos de documentos
  const { data: documentTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/admin/document-types'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/document-types');
      return response.json();
    }
  });
  
  // Mutação para aprovar documento
  const approveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, comments }: { documentId: number, comments: string }) => {
      const response = await apiRequest('POST', `/api/admin/student-documents/${documentId}/approve`, { 
        comments 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Documento aprovado',
        description: 'O documento foi aprovado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/student-documents'] });
      setSelectedDocumentId(null);
      setReviewComments('');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aprovar documento',
        description: 'Ocorreu um erro ao aprovar o documento. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Erro ao aprovar documento:', error);
    }
  });
  
  // Mutação para rejeitar documento
  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, comments }: { documentId: number, comments: string }) => {
      const response = await apiRequest('POST', `/api/admin/student-documents/${documentId}/reject`, { 
        comments 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Documento rejeitado',
        description: 'O documento foi rejeitado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/student-documents'] });
      setSelectedDocumentId(null);
      setReviewComments('');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao rejeitar documento',
        description: 'Ocorreu um erro ao rejeitar o documento. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Erro ao rejeitar documento:', error);
    }
  });
  
  // Mutação para processar solicitação
  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: number, comments: string }) => {
      const response = await apiRequest('POST', `/api/admin/document-requests/${requestId}/process`, { 
        comments 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação processada',
        description: 'A solicitação foi marcada como em processamento.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/document-requests'] });
      setSelectedDocumentId(null);
      setReviewComments('');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao processar solicitação',
        description: 'Ocorreu um erro ao processar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Erro ao processar solicitação:', error);
    }
  });
  
  // Mutação para concluir solicitação
  const completeRequestMutation = useMutation({
    mutationFn: async ({ requestId, documentId, comments }: { requestId: number, documentId: number, comments: string }) => {
      const response = await apiRequest('POST', `/api/admin/document-requests/${requestId}/complete`, { 
        documentId,
        comments 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação concluída',
        description: 'A solicitação foi marcada como concluída e o documento foi vinculado.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/document-requests'] });
      setSelectedDocumentId(null);
      setReviewComments('');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao concluir solicitação',
        description: 'Ocorreu um erro ao concluir a solicitação. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Erro ao concluir solicitação:', error);
    }
  });
  
  // Filtrar documentos com base no termo de pesquisa
  const filteredDocuments = documents ? documents.filter((doc: StudentDocument) => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.studentName && doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];
  
  // Filtrar solicitações com base no termo de pesquisa
  const filteredRequests = requests ? requests.filter((req: DocumentRequest) => 
    (req.documentTypeName && req.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (req.studentName && req.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];
  
  // Filtrar tipos de documentos com base no termo de pesquisa
  const filteredTypes = documentTypes ? documentTypes.filter((type: DocumentType) => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];
  
  // Função para aprovar um documento
  const handleApproveDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
  };
  
  // Função para rejeitar um documento
  const handleRejectDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
  };
  
  // Função para confirmar a aprovação
  const confirmApproval = () => {
    if (selectedDocumentId) {
      approveDocumentMutation.mutate({ 
        documentId: selectedDocumentId, 
        comments: reviewComments 
      });
    }
  };
  
  // Função para confirmar a rejeição
  const confirmRejection = () => {
    if (selectedDocumentId) {
      rejectDocumentMutation.mutate({ 
        documentId: selectedDocumentId, 
        comments: reviewComments 
      });
    }
  };
  
  // Função para processar uma solicitação
  const handleProcessRequest = (requestId: number) => {
    processRequestMutation.mutate({ 
      requestId, 
      comments: '' 
    });
  };
  
  // Função para concluir uma solicitação
  const handleCompleteRequest = (requestId: number, documentId: number) => {
    completeRequestMutation.mutate({ 
      requestId, 
      documentId,
      comments: '' 
    });
  };
  
  // Renderização do conteúdo
  return (
    <AppShell>
      <Helmet>
        <title>Gerenciamento de Documentos | Edunexia</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestão de Documentos</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
              <Input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[250px]"
              />
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">Documentos Enviados</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="types">Tipos de Documentos</TabsTrigger>
          </TabsList>
          
          {/* Tab de Documentos Enviados */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Enviados pelos Alunos</CardTitle>
                <CardDescription>
                  Verifique e aprove os documentos enviados pelos alunos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredDocuments.length > 0 ? (
                  <Table>
                    <TableCaption>Lista de documentos enviados</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Data de Upload</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc: StudentDocument) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.id}</TableCell>
                          <TableCell>{doc.title}</TableCell>
                          <TableCell>{doc.studentName || `Aluno #${doc.studentId}`}</TableCell>
                          <TableCell>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{typeof doc.fileSize === 'string' ? doc.fileSize : `${Math.round(doc.fileSize / 1024)} KB`}</TableCell>
                          <TableCell><StatusBadge status={doc.status} /></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(`/api/admin/student-documents/${doc.id}/download`, '_blank')}
                            >
                              <DownloadCloud className="h-4 w-4 mr-1" />
                              Baixar
                            </Button>
                            
                            {doc.status === 'pending' && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      onClick={() => handleApproveDocument(doc.id)}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Aprovar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Aprovar documento</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja aprovar este documento?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium mb-1">
                                        Comentários (opcional):
                                      </label>
                                      <Textarea 
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        placeholder="Adicione comentários sobre o documento..."
                                      />
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={confirmApproval}>Aprovar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      onClick={() => handleRejectDocument(doc.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Rejeitar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Rejeitar documento</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Informe o motivo da rejeição do documento.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium mb-1">
                                        Motivo da rejeição:
                                      </label>
                                      <Textarea 
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        placeholder="Informe o motivo da rejeição..."
                                        required
                                      />
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={confirmRejection}>Rejeitar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">Nenhum documento encontrado</h3>
                    <p className="mt-1 text-gray-500">
                      {searchTerm ? 'Tente ajustar sua pesquisa.' : 'Não há documentos enviados pelos alunos.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab de Solicitações de Documentos */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Documentos</CardTitle>
                <CardDescription>
                  Gerencie as solicitações de documentos feitas pelos alunos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredRequests.length > 0 ? (
                  <Table>
                    <TableCaption>Lista de solicitações de documentos</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>Tipo de Documento</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Data da Solicitação</TableHead>
                        <TableHead>Justificativa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((req: DocumentRequest) => (
                        <TableRow key={req.id}>
                          <TableCell>{req.id}</TableCell>
                          <TableCell>{req.documentTypeName || `Tipo #${req.documentTypeId}`}</TableCell>
                          <TableCell>{req.studentName || `Aluno #${req.studentId}`}</TableCell>
                          <TableCell>{new Date(req.requestDate).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{req.justification || '-'}</TableCell>
                          <TableCell><StatusBadge status={req.status} /></TableCell>
                          <TableCell className="text-right space-x-2">
                            {req.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleProcessRequest(req.id)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Processar
                              </Button>
                            )}
                            
                            {req.status === 'processing' && documents && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Concluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Concluir solicitação</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Selecione o documento gerado para esta solicitação.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">
                                      Documento gerado:
                                    </label>
                                    <Select onValueChange={(value) => setSelectedDocumentId(Number(value))}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione um documento..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {documents
                                          .filter((doc: StudentDocument) => doc.status === 'approved')
                                          .map((doc: StudentDocument) => (
                                            <SelectItem key={doc.id} value={String(doc.id)}>
                                              {doc.title} - {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">
                                      Comentários (opcional):
                                    </label>
                                    <Textarea 
                                      value={reviewComments}
                                      onChange={(e) => setReviewComments(e.target.value)}
                                      placeholder="Adicione comentários sobre a solicitação..."
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => selectedDocumentId && handleCompleteRequest(req.id, selectedDocumentId)}
                                      disabled={!selectedDocumentId}
                                    >
                                      Concluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            {req.status === 'completed' && req.generatedDocumentId && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(`/api/admin/student-documents/${req.generatedDocumentId}/download`, '_blank')}
                              >
                                <DownloadCloud className="h-4 w-4 mr-1" />
                                Documento
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">Nenhuma solicitação encontrada</h3>
                    <p className="mt-1 text-gray-500">
                      {searchTerm ? 'Tente ajustar sua pesquisa.' : 'Não há solicitações de documentos.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab de Tipos de Documentos */}
          <TabsContent value="types">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tipos de Documentos</CardTitle>
                  <CardDescription>
                    Gerencie os tipos de documentos disponíveis no sistema.
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Tipo
                </Button>
              </CardHeader>
              <CardContent>
                {typesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredTypes.length > 0 ? (
                  <Table>
                    <TableCaption>Lista de tipos de documentos</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Obrigatório</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTypes.map((type: DocumentType) => (
                        <TableRow key={type.id}>
                          <TableCell>{type.id}</TableCell>
                          <TableCell>{type.name}</TableCell>
                          <TableCell>{type.code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {type.category === 'personal' ? 'Pessoal' : 
                               type.category === 'academic' ? 'Acadêmico' : type.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {type.isRequired ? (
                              <Badge variant="default">Sim</Badge>
                            ) : (
                              <Badge variant="outline">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {type.isActive ? (
                              <Badge variant="default">Ativo</Badge>
                            ) : (
                              <Badge variant="destructive">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            {!type.isActive && (
                              <Button variant="destructive" size="sm">
                                <Trash className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">Nenhum tipo de documento encontrado</h3>
                    <p className="mt-1 text-gray-500">
                      {searchTerm ? 'Tente ajustar sua pesquisa.' : 'Nenhum tipo de documento cadastrado.'}
                    </p>
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