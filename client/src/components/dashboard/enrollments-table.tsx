import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Enrollment {
  id: number;
  student: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string;
  };
  course: {
    id: number;
    title: string;
    type: string;
  };
  amount: number;
  status: "active" | "pending" | "completed" | "cancelled";
  date: string;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  courseInterest: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  source: string;
  date: string;
}

interface EnrollmentsTableProps {
  enrollments: Enrollment[];
  leads?: Lead[];
}

export function EnrollmentsTable({ enrollments, leads = [] }: EnrollmentsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Ativo</Badge>;
      case "pending":
        return <Badge variant="warning">Pendente</Badge>;
      case "completed":
        return <Badge variant="info">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "new":
        return <Badge variant="secondary">Novo</Badge>;
      case "contacted":
        return <Badge variant="info">Contactado</Badge>;
      case "qualified":
        return <Badge variant="success">Qualificado</Badge>;
      case "converted":
        return <Badge variant="purple">Convertido</Badge>;
      case "lost":
        return <Badge variant="destructive">Perdido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="text-xs text-green-600 dark:text-green-400">Pagamento confirmado</span>;
      case "pending":
        return <span className="text-xs text-yellow-600 dark:text-yellow-400">Aguardando pagamento</span>;
      case "failed":
        return <span className="text-xs text-red-600 dark:text-red-400">Pagamento falhou</span>;
      case "refunded":
        return <span className="text-xs text-purple-600 dark:text-purple-400">Reembolsado</span>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <Tabs defaultValue="enrollments">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="enrollments">Matrículas Recentes</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>
          <TabsContent value="enrollments" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage 
                              src={enrollment.student.avatarUrl} 
                              alt={enrollment.student.name} 
                            />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {enrollment.student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{enrollment.student.name}</div>
                            <div className="text-sm text-muted-foreground">{enrollment.student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{enrollment.course.title}</div>
                        <div className="text-sm text-muted-foreground">{enrollment.course.type}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(enrollment.amount)}</div>
                        {getPaymentStatusText(enrollment.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{enrollment.date}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(enrollment.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="leads" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Interesse</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length > 0 ? (
                    leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.date}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{lead.email}</div>
                          <div className="text-sm text-muted-foreground">{lead.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{lead.courseInterest}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{lead.source}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(lead.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Nenhum lead disponível no momento
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
      <CardContent className="bg-muted/30 py-4 border-t text-center">
        <a href="#" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
          Ver todos os registros <ArrowRight className="ml-1 h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  );
}
