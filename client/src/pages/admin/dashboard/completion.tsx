import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts';
import {
  ArrowLeft, Download, Filter, Award, Clock, Layers,
  ArrowUpRight, ArrowDownRight, Book, Users, UserSquare, BookOpen
} from "lucide-react";

// Interface para tipagem dos dados
interface CompletionData {
  courses: {
    id: number;
    title: string;
    category: string;
    totalStudents: number;
    completionRate: number;
    averageCompletionTime: number; // em dias
    status: "active" | "inactive" | "completed";
    enrollmentPeriod: string;
    modules: number;
    instructor: string;
  }[];
  students: {
    id: number;
    name: string;
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageCompletionRate: number;
    fastestCompletion: number; // em dias
    lastActive: string;
  }[];
  stats: {
    overallCompletionRate: number;
    previousPeriodRate: number;
    growthPercentage: number;
    averageCompletionTime: number; // em dias
    totalActiveCourses: number;
    coursesWithHighCompletion: number;
    coursesWithLowCompletion: number;
    studentsWithFullCompletion: number;
  };
  chartData: {
    byCategory: { category: string; completionRate: number }[];
    byMonth: { month: string; completionRate: number }[];
    byEnrollmentSize: { size: string; completionRate: number }[];
    byModuleCount: { modules: string; completionRate: number }[];
    completionDistribution: { range: string; count: number }[];
  };
}

// Cores para gráficos
const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#0d9488', '#0369a1'];

export default function DashboardCompletionPage() {
  const [period, setPeriod] = useState<string>("month");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);

  // Consulta para obter dados de conclusão de cursos
  const { data: completionData, isLoading } = useQuery<CompletionData>({
    queryKey: ["/api/dashboard/completion", period],
    // Dados simulados para desenvolvimento
    placeholderData: {
      courses: Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        title: `Curso ${i + 1}`,
        category: ["Desenvolvimento", "Design", "Marketing", "Negócios", "TI"][Math.floor(Math.random() * 5)],
        totalStudents: Math.floor(Math.random() * 100) + 20,
        completionRate: Math.floor(Math.random() * 100),
        averageCompletionTime: Math.floor(Math.random() * 90) + 15, // 15 a 105 dias
        status: ["active", "inactive", "completed"][Math.floor(Math.random() * 3)] as any,
        enrollmentPeriod: `${["Jan", "Fev", "Mar", "Abr", "Mai"][Math.floor(Math.random() * 5)]} - ${["Jun", "Jul", "Ago", "Set", "Out"][Math.floor(Math.random() * 5)]} 2025`,
        modules: Math.floor(Math.random() * 12) + 3,
        instructor: ["Ana Silva", "Carlos Oliveira", "Patricia Santos", "Roberto Lima"][Math.floor(Math.random() * 4)]
      })),
      students: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Aluno ${i + 1}`,
        totalCourses: Math.floor(Math.random() * 8) + 1,
        completedCourses: Math.floor(Math.random() * 5),
        inProgressCourses: Math.floor(Math.random() * 3) + 1,
        averageCompletionRate: Math.floor(Math.random() * 100),
        fastestCompletion: Math.floor(Math.random() * 60) + 10, // 10 a 70 dias
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      })),
      stats: {
        overallCompletionRate: 78,
        previousPeriodRate: 72,
        growthPercentage: 8.3,
        averageCompletionTime: 65, // 65 dias
        totalActiveCourses: 42,
        coursesWithHighCompletion: 18,
        coursesWithLowCompletion: 7,
        studentsWithFullCompletion: 125
      },
      chartData: {
        byCategory: [
          { category: "Desenvolvimento", completionRate: 82 },
          { category: "Design", completionRate: 76 },
          { category: "Marketing", completionRate: 68 },
          { category: "Negócios", completionRate: 71 },
          { category: "TI", completionRate: 85 }
        ],
        byMonth: [
          { month: "Jan", completionRate: 62 },
          { month: "Fev", completionRate: 65 },
          { month: "Mar", completionRate: 68 },
          { month: "Abr", completionRate: 72 },
          { month: "Mai", completionRate: 78 }
        ],
        byEnrollmentSize: [
          { size: "Pequeno (< 20)", completionRate: 85 },
          { size: "Médio (20-50)", completionRate: 76 },
          { size: "Grande (51-100)", completionRate: 68 },
          { size: "Muito Grande (> 100)", completionRate: 62 }
        ],
        byModuleCount: [
          { modules: "Poucos (1-4)", completionRate: 82 },
          { modules: "Médio (5-8)", completionRate: 76 },
          { modules: "Muitos (9-12)", completionRate: 68 },
          { modules: "Extensivo (> 12)", completionRate: 58 }
        ],
        completionDistribution: [
          { range: "0-25%", count: 85 },
          { range: "26-50%", count: 145 },
          { range: "51-75%", count: 268 },
          { range: "76-100%", count: 375 }
        ]
      }
    }
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Renderizar esqueletos de carregamento
  if (isLoading) {
    return (
      <AppShell>
        <Helmet>
          <title>Taxa de Conclusão | Dashboard | Edunéxia</title>
        </Helmet>
        <div className="w-full px-2 sm:px-4 lg:px-6 max-w-[100rem] mx-auto">
          <div className="py-4">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          
          <Skeleton className="h-96 w-full mb-6" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>Taxa de Conclusão | Dashboard | Edunéxia</title>
      </Helmet>
      <div className="w-full px-2 sm:px-4 lg:px-6 max-w-[100rem] mx-auto">
        {/* Cabeçalho da página */}
        <div className="pt-2 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Button variant="ghost" className="mb-2 pl-0" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o Dashboard
              </Button>
              <h1 className="text-2xl font-semibold">Taxa de Conclusão</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Análise detalhada das taxas de conclusão dos cursos
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </div>
        
        {/* Cards com métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Taxa geral de conclusão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Taxa Geral de Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-primary/10 rounded-full p-3 mr-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{completionData?.stats.overallCompletionRate}%</div>
                  <div className="flex items-center text-sm mt-1">
                    <div className={completionData?.stats.growthPercentage && completionData.stats.growthPercentage > 0 
                      ? "text-green-600 flex items-center" 
                      : "text-red-600 flex items-center"
                    }>
                      {completionData?.stats.growthPercentage && completionData.stats.growthPercentage > 0 
                        ? <ArrowUpRight className="h-4 w-4 mr-1" /> 
                        : <ArrowDownRight className="h-4 w-4 mr-1" />
                      }
                      {Math.abs(completionData?.stats.growthPercentage || 0)}%
                    </div>
                    <span className="text-muted-foreground ml-1">vs. período anterior</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Progress 
                  value={completionData?.stats.overallCompletionRate} 
                  className="h-2"
                />
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Período anterior</span>
                  <span className="font-medium">{completionData?.stats.previousPeriodRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tempo médio de conclusão</span>
                  <span className="font-medium">{completionData?.stats.averageCompletionTime} dias</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cursos ativos</span>
                  <span className="font-medium">{completionData?.stats.totalActiveCourses}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Distribuição por categoria de curso */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Tendência de Conclusão por Mês</CardTitle>
              <CardDescription>Evolução da taxa média de conclusão ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={completionData?.chartData.byMonth}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Gráficos de análise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de radar por categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conclusão por Categoria</CardTitle>
              <CardDescription>Comparação das taxas de conclusão em diferentes categorias de cursos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={completionData?.chartData.byCategory}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Radar 
                      name="Taxa de Conclusão" 
                      dataKey="completionRate" 
                      stroke="#4f46e5" 
                      fill="#4f46e5" 
                      fillOpacity={0.5} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de distribuição por faixa de conclusão */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Alunos por Faixa de Conclusão</CardTitle>
              <CardDescription>Número de alunos em cada faixa de taxa de conclusão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={completionData?.chartData.completionDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                      {completionData?.chartData.completionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Fatores que influenciam a conclusão */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fatores que Influenciam as Taxas de Conclusão</CardTitle>
              <CardDescription>Análise de diferentes fatores e seu impacto nas taxas de conclusão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Por tamanho da turma */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    Por Tamanho da Turma
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={completionData?.chartData.byEnrollmentSize}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="size" width={150} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="completionRate" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Por quantidade de módulos */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                    Por Quantidade de Módulos
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={completionData?.chartData.byModuleCount}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="modules" width={150} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="completionRate" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabela de cursos com melhores taxas de conclusão */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cursos com Maiores Taxas de Conclusão</CardTitle>
            <CardDescription>
              Os cursos com as melhores taxas de conclusão entre os alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Instrutor</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead>Tempo Médio</TableHead>
                    <TableHead>Taxa de Conclusão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completionData?.courses
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .slice(0, 10)
                    .map(course => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="font-medium">{course.title}</div>
                        </TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
                        <TableCell>{course.totalStudents}</TableCell>
                        <TableCell>{course.modules}</TableCell>
                        <TableCell>{course.averageCompletionTime} dias</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={course.completionRate} className="h-2 w-16" />
                            <span className="font-medium">{course.completionRate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Todos os Cursos
            </Button>
          </CardFooter>
        </Card>
        
        {/* Tabela de alunos com melhores taxas de conclusão */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Alunos Destaques em Conclusão</CardTitle>
            <CardDescription>
              Alunos com as melhores taxas de conclusão nos cursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Cursos Totais</TableHead>
                    <TableHead>Cursos Concluídos</TableHead>
                    <TableHead>Em Andamento</TableHead>
                    <TableHead>Tempo Mais Rápido</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Taxa Média</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completionData?.students
                    .sort((a, b) => b.averageCompletionRate - a.averageCompletionRate)
                    .slice(0, 10)
                    .map(student => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="font-medium">{student.name}</div>
                        </TableCell>
                        <TableCell>{student.totalCourses}</TableCell>
                        <TableCell>
                          <Badge variant="default">{student.completedCourses}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.inProgressCourses}</Badge>
                        </TableCell>
                        <TableCell>{student.fastestCompletion} dias</TableCell>
                        <TableCell>{student.lastActive}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={student.averageCompletionRate} className="h-2 w-16" />
                            <span className="font-medium">{student.averageCompletionRate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <UserSquare className="h-4 w-4 mr-2" />
              Ver Todos os Alunos
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}