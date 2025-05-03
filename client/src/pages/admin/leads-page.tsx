import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlusCircle, 
  RefreshCw, 
  Check, 
  X, 
  PhoneCall,
  UserPlus,
  Search,
  UserCheck,
  Loader2,
  Pencil,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Schema para validação do formulário de lead
const formSchema = z.object({
  name: z.string().min(3, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "E-mail inválido" }),
  phone: z.string().optional(),
  courseInterest: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  tenantId: z.string(),
  assignedTo: z.string().optional(),
});

// Schema para edição de lead
const editFormSchema = z.object({
  id: z.number(),
  name: z.string().min(3, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "E-mail inválido" }),
  phone: z.string().optional(),
  courseInterest: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  assignedTo: z.string().optional(),
});

// Tipo de Lead
type Lead = {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  phone?: string;
  courseInterest?: number;
  courseName?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source?: string;
  notes?: string;
  assignedTo?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
};

// Componente principal da página de Leads
export default function LeadsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Consultas
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    retry: 1,
  });
  
  const { data: consultants = [], isLoading: isLoadingConsultants } = useQuery<any[]>({
    queryKey: ['/api/users/consultants'],
    retry: 1,
  });
  
  const { data: leads = [], isLoading: isLoadingLeads, refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ['/api/leads', user?.tenantId],
    enabled: !!user?.tenantId,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/leads?tenantId=${user?.tenantId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar leads');
        }
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar leads:', error);
        throw error;
      }
    }
  });
  
  // Filtrar leads por status
  const filteredLeads = selectedTab === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === selectedTab);
  
  // Mutação para criar lead
  const createLeadMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest('/api/leads', {
        method: 'POST',
        data: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Lead cadastrado com sucesso!",
        description: "O lead foi adicionado ao sistema.",
        variant: "default",
      });
      
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar lead",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar lead
  const updateLeadMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest(`/api/leads/${formData.id}`, {
        method: 'PUT',
        data: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Lead atualizado com sucesso!",
        description: "As informações foram atualizadas.",
        variant: "default",
      });
      
      setIsDialogOpen(false);
      setSelectedLead(null);
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para excluir lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/leads/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Lead excluído com sucesso!",
        description: "O lead foi removido do sistema.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir lead",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Formulário de criação de lead
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      courseInterest: "",
      source: "",
      notes: "",
      tenantId: user?.tenantId?.toString() || "",
      assignedTo: "",
    },
  });
  
  // Formulário de edição de lead
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      id: 0,
      name: "",
      email: "",
      phone: "",
      courseInterest: "",
      source: "",
      notes: "",
      status: "new",
      assignedTo: "",
    },
  });
  
  // Função para abrir o diálogo de edição de lead
  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditMode(true);
    setIsDialogOpen(true);
    
    editForm.reset({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      courseInterest: lead.courseInterest?.toString() || "",
      source: lead.source || "",
      notes: lead.notes || "",
      status: lead.status,
      assignedTo: lead.assignedTo?.toString() || "",
    });
  };
  
  // Manipulador de envio do formulário de criação
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formattedData = {
      ...values,
      tenantId: parseInt(values.tenantId),
      courseInterest: values.courseInterest ? parseInt(values.courseInterest) : undefined,
      assignedTo: values.assignedTo ? parseInt(values.assignedTo) : undefined,
    };
    
    createLeadMutation.mutate(formattedData);
  };
  
  // Manipulador de envio do formulário de edição
  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    const formattedData = {
      ...values,
      courseInterest: values.courseInterest ? parseInt(values.courseInterest) : undefined,
      assignedTo: values.assignedTo ? parseInt(values.assignedTo) : undefined,
    };
    
    updateLeadMutation.mutate(formattedData);
  };
  
  // Função para mapear status para badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-slate-100">Novo</Badge>;
      case 'contacted':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Contatado</Badge>;
      case 'qualified':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Qualificado</Badge>;
      case 'converted':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Convertido</Badge>;
      case 'lost':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Perdido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Formatador de telefone
  const formatPhone = (phone?: string) => {
    if (!phone) return "Não informado";
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    
    return phone;
  };
  
  return (
    <AppShell>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-muted-foreground">
              Gerencie potenciais interessados em seus cursos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchLeads()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                setIsEditMode(false);
                setSelectedLead(null);
                form.reset();
                setIsDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>
        
        {/* Tabs para filtrar leads por status */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="new">Novos</TabsTrigger>
            <TabsTrigger value="contacted">Contatados</TabsTrigger>
            <TabsTrigger value="qualified">Qualificados</TabsTrigger>
            <TabsTrigger value="converted">Convertidos</TabsTrigger>
            <TabsTrigger value="lost">Perdidos</TabsTrigger>
          </TabsList>
          
          {/* Tabela de leads */}
          <Card>
            <CardContent className="pt-6">
              {isLoadingLeads ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum lead encontrado. Adicione novos leads para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Curso de Interesse</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{formatPhone(lead.phone)}</TableCell>
                        <TableCell>{lead.courseName || "Não informado"}</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>{lead.assignedToName || "Não atribuído"}</TableCell>
                        <TableCell>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  if (window.confirm("Tem certeza que deseja excluir este lead?")) {
                                    deleteLeadMutation.mutate(lead.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Tabs>
        
        {/* Diálogo para adicionar/editar lead */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Lead" : "Adicionar Novo Lead"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Atualize as informações do lead e seu status no processo comercial." 
                  : "Preencha os dados do potencial cliente interessado no seu curso."}
              </DialogDescription>
            </DialogHeader>
            
            {isEditMode ? (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">Novo</SelectItem>
                              <SelectItem value="contacted">Contatado</SelectItem>
                              <SelectItem value="qualified">Qualificado</SelectItem>
                              <SelectItem value="converted">Convertido</SelectItem>
                              <SelectItem value="lost">Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="courseInterest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curso de Interesse</FormLabel>
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
                              {courses.map((course: any) => (
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
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atribuir Responsável</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {consultants.map((consultant: any) => (
                              <SelectItem key={consultant.id} value={consultant.id.toString()}>
                                {consultant.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Site, Indicação, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre o lead" 
                            {...field}
                            rows={3}
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
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateLeadMutation.isPending}
                    >
                      {updateLeadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="courseInterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Curso de Interesse</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um curso" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course: any) => (
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
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atribuir Responsável</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {consultants.map((consultant: any) => (
                              <SelectItem key={consultant.id} value={consultant.id.toString()}>
                                {consultant.fullName}
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
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Site, Indicação, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre o lead" 
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <input type="hidden" {...form.register("tenantId")} />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createLeadMutation.isPending}
                    >
                      {createLeadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar Lead
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}