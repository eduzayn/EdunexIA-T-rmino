import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  Clock,
  Calendar,
  LineChart,
  BarChart,
  UserCircle,
  Users,
  BookOpen,
  ClipboardList,
  TimerIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Filter,
  Download
} from "lucide-react";

export default function TimeAnalysisPage() {
  const { user } = useAuth();
  const [periodFilter, setPeriodFilter] = useState('month');
  const [userFilter, setUserFilter] = useState('all');

  // Dados simulados - serão substituídos por dados reais da API
  const timeDistributionData = [
    { category: 'Aulas Síncronas', percentage: 35, color: 'bg-blue-500' },
    { category: 'Preparação de Material', percentage: 25, color: 'bg-green-500' },
    { category: 'Correção de Atividades', percentage: 20, color: 'bg-purple-500' },
    { category: 'Atendimento a Alunos', percentage: 15, color: 'bg-amber-500' },
    { category: 'Reuniões Pedagógicas', percentage: 5, color: 'bg-red-500' }
  ];

  const dailyEfficiencyData = [
    { day: 'Segunda', efficiency: 85 },
    { day: 'Terça', efficiency: 92 },
    { day: 'Quarta', efficiency: 78 },
    { day: 'Quinta', efficiency: 80 },
    { day: 'Sexta', efficiency: 75 }
  ];

  const getEfficiencyColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 75) return 'text-blue-600';
    if (value >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getEfficiencyIcon = (value: number) => {
    if (value >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (value >= 75) return <Clock className="h-5 w-5 text-blue-600" />;
    if (value >= 60) return <AlertCircle className="h-5 w-5 text-amber-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const userList = [
    { id: 1, name: 'Gisele Santos', role: 'Professora', avatar: '/assets/avatars/user1.png' },
    { id: 2, name: 'Carlos Martins', role: 'Professor', avatar: '/assets/avatars/user2.png' },
    { id: 3, name: 'Beatriz Lima', role: 'Coordenadora', avatar: '/assets/avatars/user3.png' },
    { id: 4, name: 'Roberto Alves', role: 'Professor', avatar: '/assets/avatars/user4.png' }
  ];

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análise de Tempo</h1>
            <p className="text-muted-foreground">
              Visualize e otimize o uso do tempo em atividades educacionais
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {userList.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Mais filtros
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Cartão de Horas Totais */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Horas Registradas</CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">164h</div>
              <div className="text-sm text-muted-foreground">
                No período de {periodFilter === 'week' ? 'uma semana' :
                              periodFilter === 'month' ? 'um mês' :
                              periodFilter === 'quarter' ? 'um trimestre' : 'um ano'}
              </div>
              <div className="flex items-center mt-3 text-sm">
                <span className="text-green-600 font-medium flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  12% a mais que o período anterior
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cartão de Eficiência Média */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Eficiência Média</CardTitle>
                <BarChart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">82%</div>
              <div className="flex items-center mb-3">
                <Progress value={82} className="h-2 flex-1" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex flex-col items-center p-2 bg-green-50 rounded-md">
                  <span className="text-green-600 font-medium">90%+</span>
                  <span className="text-xs text-muted-foreground">Excelente</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-blue-50 rounded-md">
                  <span className="text-blue-600 font-medium">75-90%</span>
                  <span className="text-xs text-muted-foreground">Bom</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-amber-50 rounded-md">
                  <span className="text-amber-600 font-medium">&lt;75%</span>
                  <span className="text-xs text-muted-foreground">Regular</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cartão de Tarefas Concluídas */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tarefas</CardTitle>
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">37/42</div>
              <div className="flex items-center mb-3">
                <Progress value={88} className="h-2 flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Concluídas</div>
                    <div className="text-xs text-muted-foreground">37 tarefas</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <div>
                    <div className="font-medium">Pendentes</div>
                    <div className="text-xs text-muted-foreground">5 tarefas</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Gráfico de Distribuição de Tempo */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Distribuição de Tempo por Categoria</CardTitle>
              <CardDescription>
                Como o tempo está sendo distribuído entre diferentes atividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeDistributionData.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full`} 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 mt-6 pt-4">
                <Button variant="outline" size="sm">
                  <PieChart className="h-4 w-4 mr-2" />
                  Ver como gráfico de pizza
                </Button>
                <div className="text-sm text-muted-foreground">
                  Total: 164 horas
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eficiência Diária */}
          <Card>
            <CardHeader>
              <CardTitle>Eficiência Diária</CardTitle>
              <CardDescription>
                Média de eficiência por dia da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyEfficiencyData.map((day, index) => (
                  <div key={index} className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    {getEfficiencyIcon(day.efficiency)}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{day.day}</span>
                        <span className={`font-medium ${getEfficiencyColor(day.efficiency)}`}>
                          {day.efficiency}%
                        </span>
                      </div>
                      <Progress value={day.efficiency} className="h-1 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuários mais ativos</CardTitle>
                <CardDescription>
                  Ranking de atividade no período selecionado
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userList.map((user, index) => (
                <div key={user.id} className="flex items-center gap-4">
                  <div className="font-bold text-lg text-muted-foreground">{index + 1}</div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.role}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="font-medium">42h</div>
                    <div className="text-xs text-green-600 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3 h-3 mr-1"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      8% acima da média
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}