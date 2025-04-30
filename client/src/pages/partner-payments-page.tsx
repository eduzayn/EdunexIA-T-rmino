import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Search, AlertCircle, Wallet, DollarSign, Calendar, User, FileText } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { apiRequest } from '@/lib/query-client';

export default function PartnerPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Query para buscar pagamentos
  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['/api/partner/payments'],
    queryFn: async () => {
      const response = await apiRequest('/api/partner/payments');
      return response.data;
    }
  });

  // Filtra os pagamentos com base na aba ativa e na busca
  const filteredPayments = React.useMemo(() => {
    const allPayments = Array.isArray(payments) ? payments : [];
    
    return allPayments.filter((payment: any) => {
      // Filtro por status
      if (activeTab !== 'all' && payment.status !== activeTab) {
        return false;
      }
      
      // Filtro por busca
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          (payment.description?.toLowerCase() || '').includes(query) ||
          (payment.studentName?.toLowerCase() || '').includes(query) ||
          (payment.certificationType?.toLowerCase() || '').includes(query)
        );
      }
      
      return true;
    });
  }, [payments, activeTab, searchQuery]);

  // Formatação da data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderiza o status do pagamento com cores específicas
  const renderPaymentStatus = (status: 'pending' | 'paid' | 'overdue' | 'cancelled') => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <DollarSign className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <DollarSign className="mr-1 h-3 w-3" />
            Pago
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <DollarSign className="mr-1 h-3 w-3" />
            Vencido
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <DollarSign className="mr-1 h-3 w-3" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Pagamentos | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
            <p className="text-muted-foreground">
              Acompanhe os pagamentos das taxas de certificação
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar pagamentos..."
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
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="overdue">Vencidos</TabsTrigger>
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
                    <p className="text-destructive text-lg font-medium">Erro ao carregar pagamentos</p>
                    <p className="text-muted-foreground mt-1">
                      Ocorreu um erro ao carregar os pagamentos. Tente novamente mais tarde.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-lg font-medium">Nenhum pagamento encontrado</p>
                    <p className="text-muted-foreground mt-1 mb-4">
                      {searchQuery.trim() !== "" 
                        ? "Nenhum pagamento corresponde à sua busca." 
                        : `Não há pagamentos ${activeTab === "pending" ? "pendentes" : 
                           activeTab === "paid" ? "pagos" : 
                           activeTab === "overdue" ? "vencidos" : ""} no momento.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment: any) => (
                  <Card key={payment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-lg">{payment.description}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            <span>{payment.studentName}</span>
                          </CardDescription>
                        </div>
                        {renderPaymentStatus(payment.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          <span>Data: {formatDate(payment.date)}</span>
                          {payment.dueDate && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Vencimento: {formatDate(payment.dueDate)}</span>
                            </>
                          )}
                        </div>
                        <div className="text-lg font-medium">
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="text-sm bg-gray-50 px-3 py-1 rounded-full">
                          <span className="font-medium">Tipo:</span> {payment.certificationType}
                        </div>
                        
                        {payment.invoiceNumber && (
                          <div className="text-sm bg-gray-50 px-3 py-1 rounded-full">
                            <span className="font-medium">Fatura:</span> #{payment.invoiceNumber}
                          </div>
                        )}
                      </div>
                      
                      {payment.status === 'pending' && payment.paymentUrl && (
                        <div className="mt-4">
                          <Button asChild variant="outline" size="sm">
                            <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                              <Wallet className="mr-2 h-3.5 w-3.5" />
                              Pagar Agora
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {payment.status === 'paid' && payment.receiptUrl && (
                        <div className="mt-4">
                          <Button asChild variant="outline" size="sm">
                            <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="mr-2 h-3.5 w-3.5" />
                              Recibo
                            </a>
                          </Button>
                        </div>
                      )}
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