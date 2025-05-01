import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Filter, Loader2, FileText, AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes UI
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function AdminPartnerPaymentsPage() {
  const [_, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Buscar todos os pagamentos de todos os parceiros
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/admin/partner-payments'],
    refetchOnWindowFocus: false,
  });

  // Função para aplicar filtros aos pagamentos
  const getFilteredPayments = () => {
    if (!payments) return [];
    
    return payments.filter((payment: any) => {
      // Filtrar por status
      const statusMatch = statusFilter === 'all' || payment.status === statusFilter;
      
      // Filtrar por termo de busca (nome do aluno, parceiro ou curso)
      const searchMatch = searchTerm === '' || 
        payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && searchMatch;
    });
  };

  // Função para voltar à página anterior
  const handleGoBack = () => {
    navigate('/admin/dashboard');
  };

  // Função para renderizar ícones de status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'paid':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Função para retornar texto de status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Função para retornar cor do badge de status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning' as const;
      case 'paid':
        return 'success' as const;
      case 'overdue':
        return 'destructive' as const;
      case 'cancelled':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Mock para calcular o total recebido
  const calculateTotalReceived = () => {
    if (!payments) return 0;
    
    return payments
      .filter((payment: any) => payment.status === 'paid')
      .reduce((sum: number, payment: any) => sum + payment.amount, 0);
  };

  // Mock para calcular o total pendente
  const calculateTotalPending = () => {
    if (!payments) return 0;
    
    return payments
      .filter((payment: any) => payment.status === 'pending')
      .reduce((sum: number, payment: any) => sum + payment.amount, 0);
  };

  // Função para baixar relatório (apenas simulação)
  const handleDownloadReport = () => {
    alert('Esta funcionalidade está em desenvolvimento. O relatório seria baixado aqui.');
  };

  const filteredPayments = getFilteredPayments();

  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <h1 className="text-3xl font-bold">Administração de Pagamentos</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownloadReport}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar Relatório
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Recebido</CardTitle>
              <CardDescription>Valor total de pagamentos confirmados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {calculateTotalReceived().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Pendente</CardTitle>
              <CardDescription>Valor total de pagamentos aguardando confirmação</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {calculateTotalPending().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total de Certificações</CardTitle>
              <CardDescription>Número total de certificações pagas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {payments && payments.filter((p: any) => p.status === 'paid').length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pagamentos de Certificações</CardTitle>
            <CardDescription>
              Gerencie e acompanhe todos os pagamentos de certificações realizados pelos parceiros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
              <div className="flex flex-1 flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Buscar por aluno, parceiro ou curso..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingPayments ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Parceiro</TableHead>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {getStatusText(payment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>{payment.partnerName}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell>{payment.courseName}</TableCell>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {(payment.status === 'pending' || payment.status === 'overdue') && (
                                <DropdownMenuItem className="cursor-pointer">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  <span>Ver Boleto</span>
                                </DropdownMenuItem>
                              )}
                              {payment.status === 'paid' && (
                                <DropdownMenuItem className="cursor-pointer">
                                  <Download className="mr-2 h-4 w-4" />
                                  <span>Baixar Comprovante</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Detalhes</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Nenhum pagamento encontrado com os filtros selecionados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}