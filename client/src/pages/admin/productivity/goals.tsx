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
import { Progress } from "@/components/ui/progress";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Icons
import {
  Goal,
  Target,
  Clock,
  Calendar,
  BarChart,
  Filter,
  PlusCircle,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Clock3,
  AlertTriangle,
  XCircle,
  MoreHorizontal,
  Download,
  Users,
  UserCircle
} from "lucide-react";

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  
  // Form state for new goal
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'Acadêmico',
    target: '',
    dueDate: '',
    description: '',
    responsibleId: ''
  });
  
  // Status das metas
  const statusColors = {
    'concluída': 'text-green-600 bg-green-50',
    'em progresso': 'text-blue-600 bg-blue-50',
    'em risco': 'text-amber-600 bg-amber-50',
    'atrasada': 'text-red-600 bg-red-50',
    'não iniciada': 'text-gray-600 bg-gray-50'
  };
  
  const statusIcons = {
    'concluída': <CheckCircle className="h-4 w-4" />,
    'em progresso': <Clock3 className="h-4 w-4" />,
    'em risco': <AlertTriangle className="h-4 w-4" />,
    'atrasada': <XCircle className="h-4 w-4" />,
    'não iniciada': <Clock className="h-4 w-4" />
  };
  
  // Dados simulados - serão substituídos por dados reais da API
  const goalsData = [
    {
      id: 1,
      title: 'Aumentar nota média da turma de Matemática',
      category: 'Acadêmico',
      target: 'Média 8.0',
      current: 'Média 7.2',
      progress: 80,
      status: 'em progresso',
      dueDate: '2025-05-30',
      ownerName: 'Carlos Martins',
      ownerAvatar: '/assets/avatars/user2.png'
    },
    {
      id: 2,
      title: 'Reduzir taxa de evasão escolar',
      category: 'Institucional',
      target: 'Menos de 5%',
      current: 'Atual: 7%',
      progress: 60,
      status: 'em risco',
      dueDate: '2025-06-15',
      ownerName: 'Beatriz Lima',
      ownerAvatar: '/assets/avatars/user3.png'
    },
    {
      id: 3,
      title: 'Concluir treinamento pedagógico da equipe',
      category: 'Capacitação',
      target: '100% dos professores',
      current: '75% concluído',
      progress: 75,
      status: 'em progresso',
      dueDate: '2025-05-20',
      ownerName: 'Gisele Santos',
      ownerAvatar: '/assets/avatars/user1.png'
    },
    {
      id: 4,
      title: 'Implementar novas práticas de avaliação',
      category: 'Pedagógico',
      target: '5 métodos novos',
      current: '5 implementados',
      progress: 100,
      status: 'concluída',
      dueDate: '2025-04-30',
      ownerName: 'Roberto Alves',
      ownerAvatar: '/assets/avatars/user4.png'
    },
    {
      id: 5,
      title: 'Atualizar material didático de Ciências',
      category: 'Conteúdo',
      target: '3 módulos',
      current: '0 módulos',
      progress: 0,
      status: 'não iniciada',
      dueDate: '2025-07-10',
      ownerName: 'Carlos Martins',
      ownerAvatar: '/assets/avatars/user2.png'
    },
    {
      id: 6,
      title: 'Completar feedback semestral dos alunos',
      category: 'Administrativo',
      target: '100% dos alunos',
      current: '30% realizado',
      progress: 30,
      status: 'atrasada',
      dueDate: '2025-05-01',
      ownerName: 'Beatriz Lima',
      ownerAvatar: '/assets/avatars/user3.png'
    }
  ];
  
  // Filtragem das metas com base nos filtros selecionados
  const filteredGoals = goalsData.filter(goal => {
    if (activeTab !== 'all' && goal.category.toLowerCase() !== activeTab) {
      return false;
    }
    
    if (statusFilter !== 'all' && goal.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
  
  // Estatísticas gerais
  const stats = {
    total: goalsData.length,
    completed: goalsData.filter(g => g.status === 'concluída').length,
    inProgress: goalsData.filter(g => g.status === 'em progresso').length,
    atRisk: goalsData.filter(g => g.status === 'em risco').length,
    overdue: goalsData.filter(g => g.status === 'atrasada').length
  };
  
  // Lista de usuários para atribuição de responsabilidade (simulado)
  const users = [
    { id: 1, name: 'Carlos Martins', role: 'Professor' },
    { id: 2, name: 'Beatriz Lima', role: 'Coordenadora' },
    { id: 3, name: 'Gisele Santos', role: 'Professora' },
    { id: 4, name: 'Roberto Alves', role: 'Professor' }
  ];
  
  // Função para criar nova meta
  const handleCreateGoal = () => {
    // Validar campos obrigatórios
    if (!newGoal.title || !newGoal.target || !newGoal.dueDate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }
    
    // Aqui seria feita a chamada à API para criar a meta
    // Simulação:
    toast({
      title: 'Meta criada com sucesso',
      description: `A meta "${newGoal.title}" foi criada.`,
      variant: 'default'
    });
    
    // Resetar formulário e fechar modal
    setNewGoal({
      title: '',
      category: 'Acadêmico',
      target: '',
      dueDate: '',
      description: '',
      responsibleId: ''
    });
    setIsNewGoalModalOpen(false);
  };
  
  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Metas</h1>
            <p className="text-muted-foreground">
              Defina, acompanhe e alcance objetivos educacionais
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsNewGoalModalOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>
        </div>
        
        {/* Modal de criação de nova meta */}
        <Dialog open={isNewGoalModalOpen} onOpenChange={setIsNewGoalModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                Defina os detalhes da meta, incluindo objetivo, categoria e data limite.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-5 py-4">
              <div className="grid gap-3">
                <Label htmlFor="title" className="font-medium">
                  Título da Meta <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Aumentar média dos alunos em Matemática" 
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="grid gap-3">
                  <Label htmlFor="category" className="font-medium">
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={newGoal.category} 
                    onValueChange={(value) => setNewGoal({...newGoal, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Acadêmico">Acadêmico</SelectItem>
                      <SelectItem value="Institucional">Institucional</SelectItem>
                      <SelectItem value="Pedagógico">Pedagógico</SelectItem>
                      <SelectItem value="Administrativo">Administrativo</SelectItem>
                      <SelectItem value="Capacitação">Capacitação</SelectItem>
                      <SelectItem value="Conteúdo">Conteúdo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="dueDate" className="font-medium">
                    Data Limite <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    value={newGoal.dueDate}
                    onChange={(e) => setNewGoal({...newGoal, dueDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="target" className="font-medium">
                  Objetivo <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="target" 
                  placeholder="Ex: Média 8.0 / 100% de participação / 5 novas práticas" 
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                />
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="responsible" className="font-medium">
                  Responsável
                </Label>
                <Select 
                  value={newGoal.responsibleId} 
                  onValueChange={(value) => setNewGoal({...newGoal, responsibleId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="description" className="font-medium">
                  Descrição
                </Label>
                <Textarea 
                  id="description" 
                  placeholder="Descreva a meta em detalhes, incluindo como será mensurada..." 
                  rows={3}
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewGoalModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateGoal}>
                Criar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full p-2 bg-gray-100 mb-2">
                <Target className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground text-center">Total de Metas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full p-2 bg-green-50 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-muted-foreground text-center">Concluídas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full p-2 bg-blue-50 mb-2">
                <Clock3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground text-center">Em Progresso</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full p-2 bg-amber-50 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold">{stats.atRisk}</div>
              <div className="text-sm text-muted-foreground text-center">Em Risco</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full p-2 bg-red-50 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground text-center">Atrasadas</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros e Pesquisa */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-5">
                      <TabsTrigger value="all">Todas</TabsTrigger>
                      <TabsTrigger value="acadêmico">Acadêmicas</TabsTrigger>
                      <TabsTrigger value="institucional">Institucionais</TabsTrigger>
                      <TabsTrigger value="pedagógico">Pedagógicas</TabsTrigger>
                      <TabsTrigger value="administrativo">Administrativas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos status</SelectItem>
                      <SelectItem value="concluída">Concluídas</SelectItem>
                      <SelectItem value="em progresso">Em progresso</SelectItem>
                      <SelectItem value="em risco">Em risco</SelectItem>
                      <SelectItem value="atrasada">Atrasadas</SelectItem>
                      <SelectItem value="não iniciada">Não iniciadas</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="relative flex-1 md:min-w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar meta..." className="pl-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de Metas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Metas ({filteredGoals.length})</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meta</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Limite</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGoals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">
                      <div>
                        {goal.title}
                        <div className="text-xs text-muted-foreground mt-1">
                          Alvo: {goal.target} • Atual: {goal.current}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{goal.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
                        {statusIcons[goal.status]}
                        <span className="ml-1 capitalize">{goal.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(goal.dueDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {goal.ownerAvatar ? (
                            <img src={goal.ownerAvatar} alt={goal.ownerName} className="w-6 h-6 object-cover" />
                          ) : (
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{goal.ownerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredGoals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma meta encontrada com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}