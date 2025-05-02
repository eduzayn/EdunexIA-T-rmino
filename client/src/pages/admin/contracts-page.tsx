import { useState, useEffect } from "react";
import { AppShell } from "../../components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, FileText, Check, XCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Componente para mostrar status do contrato com cores
const ContractStatus = ({ status }: { status: string }) => {
  let color = "";
  let label = "";

  switch (status) {
    case "pending":
      color = "bg-yellow-100 text-yellow-800 border-yellow-200";
      label = "Pendente";
      break;
    case "signed":
      color = "bg-green-100 text-green-800 border-green-200";
      label = "Assinado";
      break;
    case "expired":
      color = "bg-red-100 text-red-800 border-red-200";
      label = "Expirado";
      break;
    case "cancelled":
      color = "bg-gray-100 text-gray-800 border-gray-200";
      label = "Cancelado";
      break;
    default:
      color = "bg-blue-100 text-blue-800 border-blue-200";
      label = status;
  }

  return <Badge className={color}>{label}</Badge>;
};

// Componente para visualizar o texto do contrato
const ContractView = ({ contract }: { contract: any }) => {
  return (
    <div className="whitespace-pre-wrap bg-white p-6 rounded-lg shadow-sm border max-h-[70vh] overflow-y-auto font-serif">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-center">CONTRATO EDUCACIONAL</h2>
        <p className="text-sm text-center text-gray-500">Número: {contract.contractNumber}</p>
      </div>
      {contract.contractText}
    </div>
  );
};

export default function ContractsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Buscar contratos
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/contracts');
      if (!response.ok) {
        throw new Error('Erro ao buscar contratos');
      }
      return response.json();
    }
  });

  // Atualizar status do contrato
  const updateContractStatus = async (contractId: number, status: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/contracts/${contractId}/status`, { status });
      if (!response.ok) {
        throw new Error('Erro ao atualizar status do contrato');
      }
      
      // Atualizar dados locais
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      
      toast({
        title: "Status atualizado",
        description: `O contrato foi marcado como ${status === 'signed' ? 'assinado' : status}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do contrato",
        variant: "destructive",
      });
    }
  };

  // Abrir visualização do contrato
  const viewContract = (contract: any) => {
    setSelectedContract(contract);
    setIsViewOpen(true);
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Formatação de valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Contratos Educacionais</h1>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="signed">Assinados</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Contratos</CardTitle>
                <CardDescription>
                  Listagem de todos os contratos educacionais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : contracts && contracts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts.map((contract: any) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                            <TableCell>{contract.courseId}</TableCell>
                            <TableCell>{contract.studentId}</TableCell>
                            <TableCell>{formatDate(contract.createdAt)}</TableCell>
                            <TableCell>{formatCurrency(contract.totalValue)}</TableCell>
                            <TableCell>
                              <ContractStatus status={contract.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewContract(contract)}
                                >
                                  <Eye className="h-4 w-4 mr-1" /> Ver
                                </Button>
                                {contract.status === 'pending' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => updateContractStatus(contract.id, 'signed')}
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Assinar
                                  </Button>
                                )}
                                {contract.status === 'pending' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => updateContractStatus(contract.id, 'cancelled')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Cancelar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum contrato encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Contratos Pendentes</CardTitle>
                <CardDescription>
                  Contratos que aguardam assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : contracts && contracts.filter((c: any) => c.status === 'pending').length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts.filter((c: any) => c.status === 'pending').map((contract: any) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                            <TableCell>{contract.courseId}</TableCell>
                            <TableCell>{contract.studentId}</TableCell>
                            <TableCell>{formatDate(contract.createdAt)}</TableCell>
                            <TableCell>{formatCurrency(contract.totalValue)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewContract(contract)}
                                >
                                  <Eye className="h-4 w-4 mr-1" /> Ver
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateContractStatus(contract.id, 'signed')}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Assinar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => updateContractStatus(contract.id, 'cancelled')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Cancelar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Não há contratos pendentes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signed">
            <Card>
              <CardHeader>
                <CardTitle>Contratos Assinados</CardTitle>
                <CardDescription>
                  Contratos que já foram assinados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : contracts && contracts.filter((c: any) => c.status === 'signed').length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Data Assinatura</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts.filter((c: any) => c.status === 'signed').map((contract: any) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                            <TableCell>{contract.courseId}</TableCell>
                            <TableCell>{contract.studentId}</TableCell>
                            <TableCell>{formatDate(contract.signedAt)}</TableCell>
                            <TableCell>{formatCurrency(contract.totalValue)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewContract(contract)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Check className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Não há contratos assinados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal para visualização do contrato */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Contrato Educacional</DialogTitle>
              <DialogDescription>
                {selectedContract && 
                  `${selectedContract.contractNumber} • Gerado em ${formatDate(selectedContract.createdAt)}`
                }
              </DialogDescription>
            </DialogHeader>
            
            {selectedContract && (
              <>
                <div className="mb-2">
                  <ContractStatus status={selectedContract.status} />
                </div>
                <ContractView contract={selectedContract} />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}