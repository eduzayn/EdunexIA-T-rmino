import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { 
  Search, 
  AlertCircle, 
  FileCheck, 
  XCircle, 
  Clock, 
  CheckCircle, 
  Calendar, 
  User, 
  Download
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Esquema de validação para o formulário de feedback
const feedbackSchema = z.object({
  comments: z.string().min(1, { message: 'Forneça um feedback para o parceiro' })
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function AdminPartnerCertificationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const { toast } = useToast();

  // Configuração do formulário
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      comments: ''
    }
  });

  // Query para buscar solicitações de certificação
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/partner-certifications'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/partner-certifications');
      return response.data;
    }
  });

  // Mutation para aprovar uma solicitação
  const approveCertificationMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest(`/api/admin/partner-certifications/${requestId}/approve`, {
        method: 'POST'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partner-certifications'] });
      setIsDetailDialogOpen(false);
      toast({
        title: "Certificação aprovada",
        description: "A solicitação de certificação foi aprovada com sucesso.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar certificação",
        description: error.message || "Ocorreu um erro ao aprovar a certificação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation para rejeitar uma solicitação
  const rejectCertificationMutation = useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: number, comments: string }) => {
      const response = await apiRequest(`/api/admin/partner-certifications/${requestId}/reject`, {
        method: 'POST',
        data: { comments }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partner-certifications'] });
      setIsRejectDialogOpen(false);
      form.reset();
      toast({
        title: "Certificação rejeitada",
        description: "A solicitação de certificação foi rejeitada e o feedback foi enviado ao parceiro.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar certificação",
        description: error.message || "Ocorreu um erro ao rejeitar a certificação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleApproveCertification = (requestId: number) => {
    approveCertificationMutation.mutate(requestId);
  };

  const handleRejectCertification = (request: any) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  const onSubmitFeedback = (values: FeedbackFormValues) => {
    if (selectedRequest) {
      rejectCertificationMutation.mutate({
        requestId: selectedRequest.id,
        comments: values.comments
      });
    }
  };

  // Filtra as solicitações com base na aba ativa e na busca
  const filteredRequests = React.useMemo(() => {
    const requests = data || [];
    
    return requests.filter((req: any) => {
      // Filtro por status
      if (activeTab !== 'all' && req.status !== activeTab) {
        return false;
      }
      
      // Filtro por busca
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          req.studentName.toLowerCase().includes(query) ||
          req.partnerName.toLowerCase().includes(query) ||
          req.courseName.toLowerCase().includes(query)
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
  const renderRequestStatus = (status: 'pending' | 'approved' | 'rejected') => {
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
            <XCircle className="mr-1 h-3 w-3" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Certificações de Parceiros | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificações de Parceiros</h1>
            <p className="text-muted-foreground">
              Gerencie solicitações de certificação dos parceiros
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar solicitações..."
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
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
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
                    <p className="text-destructive text-lg font-medium">Erro ao carregar solicitações</p>
                    <p className="text-muted-foreground mt-1">
                      Ocorreu um erro ao carregar as solicitações de certificação. Tente novamente mais tarde.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-lg font-medium">Nenhuma solicitação encontrada</p>
                    <p className="text-muted-foreground mt-1 mb-4">
                      {searchQuery.trim() !== "" 
                        ? "Nenhuma solicitação corresponde à sua busca." 
                        : `Não há solicitações ${activeTab === "pending" ? "pendentes" : 
                           activeTab === "approved" ? "aprovadas" : 
                           activeTab === "rejected" ? "rejeitadas" : ""} no momento.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request: any) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.courseName}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            <span>{request.studentName}</span>
                            <span className="mx-2">•</span>
                            <span>Parceiro: {request.partnerName}</span>
                          </CardDescription>
                        </div>
                        {renderRequestStatus(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        <span>Solicitado em {formatDate(request.requestDate)}</span>
                      </div>
                      
                      {request.comments && (
                        <div className="mb-3 bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium">Feedback enviado:</p>
                          <p className="text-sm text-muted-foreground">{request.comments}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                        >
                          <Search className="mr-2 h-3.5 w-3.5" />
                          Detalhes
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApproveCertification(request.id)}
                              disabled={approveCertificationMutation.isPending}
                            >
                              <FileCheck className="mr-2 h-3.5 w-3.5" />
                              Aprovar
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRejectCertification(request)}
                              disabled={rejectCertificationMutation.isPending}
                            >
                              <XCircle className="mr-2 h-3.5 w-3.5" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        
                        {request.status === 'approved' && request.certificateUrl && (
                          <Button variant="outline" size="sm" asChild className="ml-auto">
                            <a href={request.certificateUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-3.5 w-3.5" />
                              Certificado
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para rejeitar certificação */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rejeitar Certificação</DialogTitle>
            <DialogDescription>
              Forneça um feedback claro sobre o motivo da rejeição. O parceiro receberá esta mensagem.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitFeedback)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da rejeição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explique por que a solicitação não pôde ser aprovada e o que o parceiro precisa fazer para corrigir o problema." 
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
                  disabled={rejectCertificationMutation.isPending}
                >
                  {rejectCertificationMutation.isPending ? "Enviando..." : "Rejeitar solicitação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para detalhes da solicitação */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a solicitação de certificação
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Curso</p>
                  <p className="text-base">{selectedRequest.courseName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data da Solicitação</p>
                  <p className="text-base">{formatDate(selectedRequest.requestDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aluno</p>
                  <p className="text-base">{selectedRequest.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Parceiro</p>
                  <p className="text-base">{selectedRequest.partnerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{renderRequestStatus(selectedRequest.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID da Solicitação</p>
                  <p className="text-base">{selectedRequest.id}</p>
                </div>
              </div>
              
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Documentos do Aluno</p>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">Documento</th>
                          <th className="text-left py-2 px-3 font-medium">Data</th>
                          <th className="text-left py-2 px-3 font-medium">Status</th>
                          <th className="text-left py-2 px-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequest.documents.map((doc: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                            <td className="py-2 px-3">{doc.title}</td>
                            <td className="py-2 px-3">{formatDate(doc.uploadDate)}</td>
                            <td className="py-2 px-3">
                              {renderRequestStatus(doc.status)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Button variant="ghost" size="sm" asChild className="h-8">
                                <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {selectedRequest.comments && (
                <div className="bg-muted/20 p-3 rounded-md">
                  <p className="text-sm font-medium">Observações:</p>
                  <p className="text-sm">{selectedRequest.comments}</p>
                </div>
              )}
              
              {selectedRequest.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleApproveCertification(selectedRequest.id)}
                    disabled={approveCertificationMutation.isPending}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleRejectCertification(selectedRequest);
                    }}
                    disabled={rejectCertificationMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}