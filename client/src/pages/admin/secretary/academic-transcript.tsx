import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  FileText, 
  Search, 
  Check, 
  XCircle, 
  ClipboardList, 
  Calendar, 
  BookOpen, 
  User
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

// Tipos de Dados
interface StudentCourse {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  enrollmentDate: string;
  completionDate?: string;
  status: string;
  progress: number;
  finalGrade?: number;
}

interface Subject {
  id: number;
  name: string;
  workload: number;
  teacher: string;
  grade?: number;
  status: string;
}

interface StudentTranscript {
  studentId: number;
  studentName: string;
  studentCode: string;
  enrollmentId: number;
  courseId: number;
  courseName: string;
  subjects: Subject[];
  startDate: string;
  endDate?: string;
  status: string;
  finalGrade?: number;
}

export default function AcademicTranscriptPage() {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<StudentTranscript | null>(null);

  // Buscar dados de cursos com alunos (simulação por enquanto)
  const { data: coursesWithStudents = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/admin/secretary/courses-with-students'],
    queryFn: async () => {
      // Dados simulados para exibição - será substituído pela chamada real à API
      return [
        {
          id: 1,
          name: "Gestão Educacional",
          code: "GE-001",
          totalStudents: 24,
          activeStudents: 22,
          startDate: "2024-02-15"
        },
        {
          id: 2,
          name: "Psicopedagogia Clínica e Institucional",
          code: "PCI-002",
          totalStudents: 35,
          activeStudents: 33,
          startDate: "2024-03-01"
        },
        {
          id: 3,
          name: "Neurociência Aplicada à Educação",
          code: "NAE-003",
          totalStudents: 28,
          activeStudents: 26,
          startDate: "2024-02-10"
        }
      ];
    },
    staleTime: 60 * 1000, // 1 minuto
  });

  // Buscar alunos (serão filtrados por curso quando um curso for selecionado)
  const { data: students = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/admin/secretary/students', selectedCourse],
    queryFn: async () => {
      // Dados simulados para exibição - será substituído pela chamada real à API
      return [
        {
          id: 101,
          name: "Ana Carolina Silva",
          code: "2024001",
          email: "ana.silva@exemplo.com",
          enrollmentDate: "2024-02-15",
          courseId: 1,
          status: "active"
        },
        {
          id: 102,
          name: "Bruno Gomes Pereira",
          code: "2024002",
          email: "bruno.gomes@exemplo.com",
          enrollmentDate: "2024-02-15",
          courseId: 1,
          status: "active"
        },
        {
          id: 103,
          name: "Carla Mendes Santos",
          code: "2024003",
          email: "carla.mendes@exemplo.com",
          enrollmentDate: "2024-02-16",
          courseId: 1,
          status: "active"
        },
        {
          id: 104,
          name: "Diego Almeida Costa",
          code: "2024004",
          email: "diego.almeida@exemplo.com",
          enrollmentDate: "2024-03-01",
          courseId: 2,
          status: "active"
        },
        {
          id: 105,
          name: "Elena Rodrigues Lima",
          code: "2024005",
          email: "elena.rodrigues@exemplo.com",
          enrollmentDate: "2024-03-01",
          courseId: 2,
          status: "active"
        },
        {
          id: 106,
          name: "Fábio Martins Oliveira",
          code: "2024006",
          email: "fabio.martins@exemplo.com",
          enrollmentDate: "2024-02-10",
          courseId: 3,
          status: "active"
        }
      ].filter(student => !selectedCourse || student.courseId === selectedCourse);
    },
    staleTime: 60 * 1000, // 1 minuto
  });

  // Buscar histórico escolar de um aluno específico
  const { data: studentCourses = [], isLoading: isStudentCoursesLoading } = useQuery({
    queryKey: ['/api/admin/secretary/student-courses', selectedStudent],
    enabled: !!selectedStudent,
    queryFn: async () => {
      // Dados simulados para exibição - será substituído pela chamada real à API
      return [
        {
          id: 1001,
          courseId: 1,
          courseName: "Gestão Educacional",
          courseCode: "GE-001",
          enrollmentDate: "2024-02-15",
          status: "in_progress",
          progress: 65,
          finalGrade: null
        },
        {
          id: 1002,
          courseId: 4,
          courseName: "Metodologias Ativas de Aprendizagem",
          courseCode: "MAA-004",
          enrollmentDate: "2023-08-10",
          completionDate: "2023-12-20",
          status: "completed",
          progress: 100,
          finalGrade: 9.4
        }
      ].filter(course => selectedStudent === 101 || selectedStudent === 102 || selectedStudent === 103);
    },
    staleTime: 60 * 1000, // 1 minuto
  });

  // Função para visualizar o histórico escolar detalhado
  const handleViewTranscript = (courseId: number, studentId: number) => {
    // Em uma implementação real, buscaríamos esses dados do backend
    const transcriptData: StudentTranscript = {
      studentId: studentId,
      studentName: students.find(s => s.id === studentId)?.name || "Nome não encontrado",
      studentCode: students.find(s => s.id === studentId)?.code || "Código não encontrado",
      enrollmentId: 5001,
      courseId: courseId,
      courseName: studentCourses.find(c => c.courseId === courseId)?.courseName || "Curso não encontrado",
      subjects: [
        {
          id: 1,
          name: "Fundamentos da Gestão Educacional",
          workload: 60,
          teacher: "Prof. Dr. Roberto Alves",
          grade: 9.5,
          status: "completed"
        },
        {
          id: 2,
          name: "Políticas Públicas em Educação",
          workload: 45,
          teacher: "Profa. Dra. Maria Lima",
          grade: 8.7,
          status: "completed"
        },
        {
          id: 3,
          name: "Planejamento Estratégico Escolar",
          workload: 60,
          teacher: "Prof. Dr. Carlos Santos",
          grade: 9.2,
          status: "completed"
        },
        {
          id: 4,
          name: "Avaliação Institucional",
          workload: 45,
          teacher: "Profa. Dra. Juliana Costa",
          status: "in_progress"
        },
        {
          id: 5,
          name: "Gestão de Pessoas no Ambiente Educacional",
          workload: 60,
          teacher: "Prof. Dr. Marcos Oliveira",
          status: "not_started"
        }
      ],
      startDate: studentCourses.find(c => c.courseId === courseId)?.enrollmentDate || "Data não encontrada",
      endDate: studentCourses.find(c => c.courseId === courseId)?.completionDate,
      status: studentCourses.find(c => c.courseId === courseId)?.status || "status_unknown",
      finalGrade: studentCourses.find(c => c.courseId === courseId)?.finalGrade || undefined
    };

    setCurrentTranscript(transcriptData);
    setShowTranscriptDialog(true);
  };

  // Função para formatar o status
  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      "active": { label: "Ativo", color: "bg-green-100 text-green-800" },
      "inactive": { label: "Inativo", color: "bg-gray-100 text-gray-800" },
      "completed": { label: "Concluído", color: "bg-blue-100 text-blue-800" },
      "in_progress": { label: "Em Andamento", color: "bg-amber-100 text-amber-800" },
      "pending": { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      "cancelled": { label: "Cancelado", color: "bg-red-100 text-red-800" },
      "not_started": { label: "Não Iniciado", color: "bg-gray-100 text-gray-800" }
    };

    const config = statusMap[status] || { label: "Desconhecido", color: "bg-gray-100 text-gray-800" };

    return (
      <Badge variant="outline" className={`${config.color} border-none`}>
        {config.label}
      </Badge>
    );
  };

  // Filtrar alunos baseado no termo de busca
  const filteredStudents = students.filter(
    student => student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               student.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
               student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderizar a página
  return (
    <AppShell>
      <Helmet>
        <title>Histórico Escolar | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Histórico Escolar</h1>
            <p className="text-muted-foreground">
              Consulte e exporte o histórico escolar dos alunos.
            </p>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Buscar por Aluno</TabsTrigger>
            <TabsTrigger value="courses">Buscar por Curso</TabsTrigger>
          </TabsList>

          {/* Aba de busca por aluno */}
          <TabsContent value="search" className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome, código ou email..."
                className="max-w-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Nenhum aluno encontrado com os critérios de busca.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.code}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{formatStatus(student.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudent(student.id)}
                          >
                            <FileText className="h-4 w-4 mr-1.5" />
                            Ver Histórico
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Histórico do aluno selecionado */}
            {selectedStudent && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Histórico de {students.find(s => s.id === selectedStudent)?.name}
                  </h2>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data de Matrícula</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Nota Final</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentCourses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            Nenhum curso encontrado para este aluno.
                          </TableCell>
                        </TableRow>
                      ) : (
                        studentCourses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell>{course.courseCode}</TableCell>
                            <TableCell>{course.courseName}</TableCell>
                            <TableCell>{new Date(course.enrollmentDate).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{formatStatus(course.status)}</TableCell>
                            <TableCell>{course.progress}%</TableCell>
                            <TableCell>{course.finalGrade ? course.finalGrade.toFixed(1) : '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewTranscript(course.courseId, selectedStudent)}
                                >
                                  <FileText className="h-4 w-4 mr-1.5" />
                                  Detalhes
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4 mr-1.5" />
                                  Exportar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba de busca por curso */}
          <TabsContent value="courses" className="space-y-4 pt-4">
            <div className="flex gap-4 items-center">
              <Select 
                value={selectedCourse?.toString() || ""} 
                onValueChange={(value) => setSelectedCourse(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todos os cursos</SelectItem>
                  {coursesWithStudents.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coursesWithStudents
                .filter(course => !selectedCourse || course.id === selectedCourse)
                .map(course => (
                  <Card key={course.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle>{course.name}</CardTitle>
                      <CardDescription>Código: {course.code}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data de Início:</span>
                          <span>{new Date(course.startDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total de Alunos:</span>
                          <span>{course.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alunos Ativos:</span>
                          <span>{course.activeStudents}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => setSelectedCourse(course.id)}
                      >
                        <User className="h-4 w-4 mr-1.5" />
                        Ver Alunos
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>

            {selectedCourse && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Alunos de {coursesWithStudents.find(c => c.id === selectedCourse)?.name}
                  </h2>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Data de Matrícula</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            Nenhum aluno encontrado para este curso.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.code}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{new Date(student.enrollmentDate).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{formatStatus(student.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStudent(student.id);
                                    const courseEntry = studentCourses.find(c => c.courseId === selectedCourse);
                                    if (courseEntry) {
                                      handleViewTranscript(selectedCourse, student.id);
                                    }
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-1.5" />
                                  Histórico
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para exibir o histórico escolar completo */}
      <Dialog open={showTranscriptDialog} onOpenChange={setShowTranscriptDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Histórico Escolar Detalhado</DialogTitle>
            <DialogDescription>
              Informações completas do histórico acadêmico
            </DialogDescription>
          </DialogHeader>

          {currentTranscript && (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
              {/* Informações do aluno */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Informações do Aluno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/30">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Nome:</span>
                      <span>{currentTranscript.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Código:</span>
                      <span>{currentTranscript.studentCode}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Curso:</span>
                      <span>{currentTranscript.courseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span>{formatStatus(currentTranscript.status)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datas e informações gerais */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Informações do Curso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/30">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Data de Início</span>
                    <span>{new Date(currentTranscript.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Data de Conclusão</span>
                    <span>{currentTranscript.endDate ? new Date(currentTranscript.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Nota Final</span>
                    <span>{currentTranscript.finalGrade ? currentTranscript.finalGrade.toFixed(1) : 'Não concluído'}</span>
                  </div>
                </div>
              </div>

              {/* Disciplinas e notas */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Disciplinas e Notas
                </h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Carga Horária</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTranscript.subjects.map(subject => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.workload}h</TableCell>
                          <TableCell>{subject.teacher}</TableCell>
                          <TableCell>{subject.grade ? subject.grade.toFixed(1) : '-'}</TableCell>
                          <TableCell>{formatStatus(subject.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Resumo */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2 text-primary" />
                  Resumo Acadêmico
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/30">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total de Disciplinas</span>
                    <span>{currentTranscript.subjects.length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Disciplinas Concluídas</span>
                    <span>{currentTranscript.subjects.filter(s => s.status === 'completed').length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Carga Horária Total</span>
                    <span>{currentTranscript.subjects.reduce((total, sub) => total + sub.workload, 0)}h</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowTranscriptDialog(false)}>
              Fechar
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-1.5" />
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}