import { useState } from "react";
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
import { Eye, FileText, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

export default function StudentContractsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Obtém o ID do usuário atual (estudante)
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do usuário');
      }
      return response.json();
    }
  });

  // Buscar contratos do estudante
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['/api/contracts/student', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      
      const response = await apiRequest('GET', `/api/contracts/student/${userData.id}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar contratos');
      }
      return response.json();
    },
    enabled: !!userData?.id
  });

  // Assinar contrato
  const signContract = async (contractId: number) => {
    try {
      const response = await apiRequest('PATCH', `/api/contracts/${contractId}/status`, { 
        status: 'signed' 
      });
      
      if (!response.ok) {
        throw new Error('Erro ao assinar contrato');
      }
      
      // Atualizar dados locais
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/student', userData?.id] });
      
      toast({
        title: "Contrato assinado",
        description: "Seu contrato foi assinado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      toast({
        title: "Erro ao assinar",
        description: "Não foi possível assinar o contrato. Tente novamente.",
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
          <h1 className="text-2xl font-bold">Meus Contratos</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contratos Educacionais</CardTitle>
            <CardDescription>
              Seus contratos de matrícula em cursos
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
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract: any) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                        <TableCell>{contract.courseId}</TableCell>
                        <TableCell>{formatDate(contract.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(contract.totalValue)}</TableCell>
                        <TableCell>{contract.installments}x de {formatCurrency(contract.installmentValue)}</TableCell>
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
                                onClick={() => signContract(contract.id)}
                              >
                                <Check className="h-4 w-4 mr-1" /> Assinar
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
                <p>Você não possui nenhum contrato no momento</p>
              </div>
            )}
          </CardContent>
        </Card>

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
            
            {selectedContract && selectedContract.status === 'pending' && (
              <div className="flex justify-end mt-4">
                <Button onClick={() => signContract(selectedContract.id)}>
                  <Check className="h-4 w-4 mr-2" /> Assinar este contrato
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}