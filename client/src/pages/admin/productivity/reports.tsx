import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  FileText,
  BarChart,
  Clock,
  Calendar,
  Download,
  Printer,
  Mail,
  Share2,
  Search,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  FileDown,
  Eye,
  BarChart2,
  Check,
  X,
  CalendarDays,
  UserCircle,
  BookOpen,
  Users,
  School,
  MoreHorizontal,
  Star,
  Target
} from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('month');
  
  // Dados simulados - serão substituídos por dados reais da API
  const reports = [
    {
      id: 1,
      title: 'Relatório de Desempenho Acadêmico',
      description: 'Análise detalhada do desempenho dos alunos por disciplina e turma',
      category: 'acadêmico',
      type: 'chart',
      created: '2025-05-02T14:30:00Z',
      author: 'Sistema',
      status: 'atualizado',
      icon: <BarChart2 className="h-5 w-5 text-blue-600" />
    },
    {
      id: 2,
      title: 'Relatório de Produtividade Docente',
      description: 'Métricas de tempo e eficiência nas atividades dos professores',
      category: 'produtividade',
      type: 'table',
      created: '2025-05-01T10:15:00Z',
      author: 'Carlos Martins',
      status: 'atualizado',
      icon: <Clock className="h-5 w-5 text-green-600" />
    },
    {
      id: 3,
      title: 'Relatório de Metas Institucionais',
      description: 'Acompanhamento do progresso das metas pedagógicas e administrativas',
      category: 'institucional',
      type: 'progress',
      created: '2025-04-30T16:45:00Z',
      author: 'Beatriz Lima',
      status: 'desatualizado',
      icon: <Target className="h-5 w-5 text-purple-600" />
    },
    {
      id: 4,
      title: 'Relatório de Frequência Estudantil',
      description: 'Análise da presença dos estudantes nas aulas e atividades',
      category: 'acadêmico',
      type: 'chart',
      created: '2025-04-28T09:20:00Z',
      author: 'Sistema',
      status: 'atualizado',
      icon: <Users className="h-5 w-5 text-amber-600" />
    },
    {
      id: 5,
      title: 'Relatório de Distribuição de Carga Horária',
      description: 'Visualização da distribuição de carga horária por professor e disciplina',
      category: 'administrativo',
      type: 'chart',
      created: '2025-04-25T11:30:00Z',
      author: 'Roberto Alves',
      status: 'atualizado',
      icon: <BarChart3 className="h-5 w-5 text-red-600" />
    },
    {
      id: 6,
      title: 'Relatório de Avaliação de Qualidade',
      description: 'Resumo das avaliações de qualidade do ensino pelos alunos',
      category: 'institucional',
      type: 'survey',
      created: '2025-04-20T14:15:00Z',
      author: 'Gisele Santos',
      status: 'desatualizado',
      icon: <Star className="h-5 w-5 text-yellow-600" />
    }
  ];
  
  // Templates de relatórios
  const reportTemplates = [
    {
      id: 1,
      title: 'Análise de Desempenho Acadêmico',
      category: 'acadêmico',
      description: 'Relatório padrão com métricas de notas e progresso dos alunos',
      icon: <BarChart className="h-10 w-10 text-blue-600" />
    },
    {
      id: 2,
      title: 'Análise de Produtividade',
      category: 'produtividade',
      description: 'Relatório com métricas de tempo e eficiência',
      icon: <Clock className="h-10 w-10 text-green-600" />
    },
    {
      id: 3,
      title: 'Progresso de Metas',
      category: 'institucional',
      description: 'Visualização do progresso das metas definidas',
      icon: <Target className="h-10 w-10 text-purple-600" />
    },
    {
      id: 4,
      title: 'Distribuição de Recursos',
      category: 'administrativo',
      description: 'Relatório de como os recursos estão distribuídos',
      icon: <PieChart className="h-10 w-10 text-red-600" />
    }
  ];
  
  // Filtragem dos relatórios
  const filteredReports = reports.filter(report => {
    if (activeTab !== 'all' && report.category !== activeTab) {
      return false;
    }
    
    return true;
  });
  
  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Visualize dados e gere relatórios para análise e tomada de decisões
            </p>
          </div>
          <div className="flex gap-3">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Novo Relatório
            </Button>
          </div>
        </div>
        
        {/* Tabs para filtragem */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="acadêmico">Acadêmicos</TabsTrigger>
              <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
              <TabsTrigger value="institucional">Institucionais</TabsTrigger>
              <TabsTrigger value="administrativo">Administrativos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Filtros e busca */}
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar relatórios..." className="pl-8" />
                </div>
                
                <div className="flex gap-2">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos períodos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mês</SelectItem>
                      <SelectItem value="quarter">Este trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Mais filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de relatórios</span>
                  <span className="font-medium">{reports.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Gerados este mês</span>
                  <span className="font-medium">4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Relatórios atualizados</span>
                  <span className="font-medium text-green-600">
                    {reports.filter(r => r.status === 'atualizado').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Desatualizados</span>
                  <span className="font-medium text-amber-600">
                    {reports.filter(r => r.status === 'desatualizado').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de relatórios recentes */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Relatórios Recentes</CardTitle>
                <CardDescription>
                  Relatórios criados ou atualizados recentemente
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Relatório</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{report.icon}</div>
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{report.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {report.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(report.created)}</TableCell>
                    <TableCell>{report.author}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        report.status === 'atualizado' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {report.status === 'atualizado' ? 
                          <Check className="h-3 w-3" /> : 
                          <Clock className="h-3 w-3" />
                        }
                        <span className="capitalize">{report.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Baixar">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Mais opções">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Templates de Relatórios */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Templates de Relatórios</h2>
            <Button variant="link" size="sm">
              Ver todos os templates
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="bg-slate-50 p-6 flex justify-center">
                  {template.icon}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription>
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="border-t bg-slate-50 p-3">
                  <Button variant="secondary" size="sm" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}