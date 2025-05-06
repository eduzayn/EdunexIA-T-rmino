import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Calendar, 
  User,
  FilePlus,
  X
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { queryClient, apiRequest } from '@/lib/query-client';
import { Badge } from '@/components/ui/badge';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Esquema de validação para o formulário de certificação
const certificationRequestSchema = z.object({
  courseId: z.string().min(1, { message: 'Selecione um curso' }),
  studentIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos um aluno' }),
  comments: z.string().optional()
});

type CertificationRequestFormValues = z.infer<typeof certificationRequestSchema>;

export default function PartnerCertificationRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { toast } = useToast();

  // Configuração do formulário
  const form = useForm<CertificationRequestFormValues>({
    resolver: zodResolver(certificationRequestSchema),
    defaultValues: {
      courseId: '',
      studentIds: [],
      comments: ''
    }
  });

  // Query para buscar solicitações existentes
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['/api/partner/certification-requests'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/certification-requests');
      return response.data;
    }
  });

  // Query para buscar cursos disponíveis
  const { data: courses } = useQuery({
    queryKey: ['/api/partner/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/courses');
      return response.data;
    }
  });

  // Query para buscar alunos elegíveis
  const { data: eligibleStudents } = useQuery({
    queryKey: ['/api/partner/eligible-students'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/eligible-students');
      return response.data;
    }
  });

  // Mutation para enviar uma nova solicitação de certificação
  const requestCertificationMutation = useMutation({
    mutationFn: async (values: CertificationRequestFormValues) => {
      const response = await apiRequest('/api/partner/certification-requests', {
        method: 'POST',
        data: values
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partner/certification-requests'] });
      setIsRequestDialogOpen(false);
      form.reset();
      toast({
        title: "Solicitação enviada com sucesso",
        description: "A solicitação de certificação foi enviada e está aguardando aprovação.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Ocorreu um erro ao enviar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleRequestCertification = (values: CertificationRequestFormValues) => {
    requestCertificationMutation.mutate(values);
  };

  // Filtra as solicitações com base na busca
  const filteredRequests = React.useMemo(() => {
    const certRequests = requests || [];
    
    if (searchQuery.trim() === '') {
      return certRequests;
    }
    
    const query = searchQuery.toLowerCase();
    return certRequests.filter((req: any) => {
      return (
        req.courseName.toLowerCase().includes(query) ||
        req.studentName.toLowerCase().includes(query) ||
        req.requestDate.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  // Formatação da data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Renderiza o status da solicitação com cores específicas
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
            <X className="mr-1 h-3 w-3" />
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
        <title>Solicitações de Certificação | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solicitações de Certificação</h1>
            <p className="text-muted-foreground">
              Solicite certificações para alunos com documentação completa
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
            <Button onClick={() => setIsRequestDialogOpen(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </div>
        </div>

        <div className="space-y-4">
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
                  <FilePlus className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">Nenhuma solicitação encontrada</p>
                  <p className="text-muted-foreground mt-1 mb-4">
                    {searchQuery.trim() !== "" 
                      ? "Nenhuma solicitação corresponde à sua busca." 
                      : "Você ainda não tem solicitações de certificação."}
                  </p>
                  <Button onClick={() => setIsRequestDialogOpen(true)}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Nova Solicitação
                  </Button>
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
                        <p className="text-sm font-medium">Feedback:</p>
                        <p className="text-sm text-muted-foreground">{request.comments}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      {request.status === 'approved' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <a href={request.certificateUrl} target="_blank" rel="noopener noreferrer">
                            <FilePlus className="mr-2 h-3.5 w-3.5" />
                            Ver Certificado
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog para solicitar certificação */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Solicitar Certificação</DialogTitle>
            <DialogDescription>
              Selecione um curso e os alunos para solicitar certificação. Os alunos precisam ter toda a documentação aprovada.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRequestCertification)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curso</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um curso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(courses || []).map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
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
                name="studentIds"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Alunos Elegíveis</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Selecione os alunos que deseja certificar neste curso
                      </p>
                    </div>
                    
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      {(eligibleStudents || []).length === 0 ? (
                        <div className="py-3 text-center text-muted-foreground">
                          <p>Nenhum aluno elegível encontrado.</p>
                          <p className="text-xs mt-1">Os alunos precisam ter toda documentação aprovada.</p>
                        </div>
                      ) : (
                        (eligibleStudents || []).map((student: any) => (
                          <FormField
                            key={student.id}
                            control={form.control}
                            name="studentIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={student.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 py-2 border-b"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(student.id.toString())}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, student.id.toString()])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== student.id.toString()
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                      {student.fullName}
                                    </FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      {student.email}
                                    </p>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))
                      )}
                    </ScrollArea>
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
                        placeholder="Adicione informações relevantes sobre esta solicitação"
                        className="min-h-[80px]"
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
                  onClick={() => setIsRequestDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={requestCertificationMutation.isPending}
                >
                  {requestCertificationMutation.isPending ? "Enviando..." : "Solicitar Certificação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}