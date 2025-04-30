import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { Plus, Filter, Search, FileDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal } from '@/hooks/use-portal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssessmentsTable from '@/components/assessments/assessments-table';
import { Skeleton } from '@/components/ui/skeleton';

export function AssessmentsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { currentPortal } = usePortal();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Buscar todas as avaliações
  const { 
    data: assessments = [], 
    isLoading: isLoadingAssessments, 
    error: assessmentsError
  } = useQuery({
    queryKey: ['/api/assessments'],
    refetchOnWindowFocus: false,
  });

  // Buscar todas as turmas para o filtro
  const { 
    data: classes = [], 
    isLoading: isLoadingClasses 
  } = useQuery({
    queryKey: ['/api/classes'],
    refetchOnWindowFocus: false,
  });

  // Filtrar avaliações com base nos filtros selecionados
  const filteredAssessments = assessments.filter((assessment: any) => {
    // Filtro por termo de busca
    const matchesSearch = searchTerm === "" || 
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por turma
    const matchesClass = selectedClass === "all" || 
      assessment.classId === parseInt(selectedClass);
    
    // Filtro por tipo
    const matchesType = selectedType === "all" || 
      assessment.type === selectedType;
    
    // Filtro por status
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" ? assessment.isActive : !assessment.isActive);
    
    return matchesSearch && matchesClass && matchesType && matchesStatus;
  });

  // Função para exportar dados
  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados serão exportados em um arquivo CSV.",
    });
    // Implementação real da exportação seria aqui
  };

  // Estatísticas básicas
  const totalAssessments = assessments.length;
  const activeAssessments = assessments.filter((a: any) => a.isActive).length;
  const completedAssessments = assessments.filter((a: any) => 
    new Date(a.dueDate) < new Date() && a.isActive
  ).length;

  if (isLoadingAssessments) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Avaliações</h1>
              <p className="text-gray-500">Gerenciamento centralizado de avaliações</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-40 mb-2" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (assessmentsError) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            <p>Erro ao carregar avaliações: {(assessmentsError as Error).message}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`${currentPortal.baseRoute}`)}
            >
              Voltar para Dashboard
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>Avaliações | Edunéxia</title>
      </Helmet>
      
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Avaliações</h1>
            <p className="text-gray-500">Gerenciamento centralizado de avaliações</p>
          </div>
          <Button asChild>
            <Link 
              to={`${currentPortal.baseRoute}/assessments/new`}
              href={`${currentPortal.baseRoute}/assessments/new`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Avaliação
            </Link>
          </Button>
        </div>
        
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Avaliações</p>
                  <h3 className="text-2xl font-bold">{totalAssessments}</h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avaliações Ativas</p>
                  <h3 className="text-2xl font-bold">{activeAssessments}</h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-6 w-6 text-green-600">✓</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avaliações Encerradas</p>
                  <h3 className="text-2xl font-bold">{completedAssessments}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-6 w-6 text-blue-600">✓</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Avaliações */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Avaliações</CardTitle>
                <CardDescription>Visualize e gerencie todas as avaliações do sistema</CardDescription>
              </div>
              <Button variant="outline" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Buscar avaliações..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="class-filter" className="sr-only">Filtrar por Turma</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger id="class-filter">
                        <SelectValue placeholder="Filtrar por Turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Turmas</SelectItem>
                        {classes.map((classItem: any) => (
                          <SelectItem key={classItem.id} value={classItem.id.toString()}>
                            {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="type-filter" className="sr-only">Filtrar por Tipo</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger id="type-filter">
                        <SelectValue placeholder="Filtrar por Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="exam">Prova</SelectItem>
                        <SelectItem value="assignment">Trabalho</SelectItem>
                        <SelectItem value="project">Projeto</SelectItem>
                        <SelectItem value="quiz">Questionário</SelectItem>
                        <SelectItem value="presentation">Apresentação</SelectItem>
                        <SelectItem value="participation">Participação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status-filter" className="sr-only">Filtrar por Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Filtrar por Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Tabs para diferentes visualizações */}
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                  <TabsTrigger value="past">Encerradas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <AssessmentsTable 
                    assessments={filteredAssessments} 
                    baseUrl={currentPortal.baseRoute}
                    classes={classes}
                  />
                </TabsContent>
                
                <TabsContent value="upcoming">
                  <AssessmentsTable 
                    assessments={filteredAssessments.filter((a: any) => 
                      a.dueDate && new Date(a.dueDate) >= new Date()
                    )} 
                    baseUrl={currentPortal.baseRoute}
                    classes={classes}
                  />
                </TabsContent>
                
                <TabsContent value="past">
                  <AssessmentsTable 
                    assessments={filteredAssessments.filter((a: any) => 
                      a.dueDate && new Date(a.dueDate) < new Date()
                    )} 
                    baseUrl={currentPortal.baseRoute}
                    classes={classes}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}