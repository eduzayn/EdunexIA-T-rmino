import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Edit, ArrowLeft, BookOpen } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Class } from "@shared/schema";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherDetailsPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");
  
  // Extrair ID do professor da URL
  const pathSegments = window.location.pathname.split("/");
  const teacherId = parseInt(pathSegments[pathSegments.length - 1]);

  // Obter detalhes do professor
  const { data: teacher, isLoading: isLoadingTeacher, error: teacherError } = useQuery<User>({
    queryKey: ["/api/teachers", teacherId],
    enabled: !isNaN(teacherId),
  });

  // Obter as turmas do professor
  const { data: teacherClasses, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ["/api/teachers", teacherId, "classes"],
    enabled: !isNaN(teacherId),
  });

  // Redirecionar se houver erro ou ID inválido
  useEffect(() => {
    if (isNaN(teacherId) || teacherError) {
      toast({
        title: "Erro ao carregar professor",
        description: "Professor não encontrado ou você não tem permissão para visualizá-lo.",
        variant: "destructive",
      });
      navigate("/admin/teachers");
    }
  }, [teacherId, teacherError, navigate, toast]);

  if (isLoadingTeacher) {
    return (
      <AppShell>
        <div className="container mx-auto py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!teacher) {
    return null; // O useEffect vai redirecionar
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/teachers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/admin/teachers/${teacher.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Professor
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <div className="mr-4">
                  <Avatar className="h-16 w-16">
                    {teacher.avatarUrl ? (
                      <AvatarImage src={teacher.avatarUrl} alt={teacher.fullName} />
                    ) : (
                      <AvatarFallback className="text-lg">{getInitials(teacher.fullName)}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div>
                  {teacher.fullName}
                  <div className="text-sm font-normal text-gray-500 mt-1">
                    Professor
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome de Usuário</h3>
                  <p className="mt-1">{teacher.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">E-mail</h3>
                  <p className="mt-1">{teacher.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    {teacher.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Cadastro</h3>
                  <p className="mt-1 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                    {format(new Date(teacher.createdAt), "PPP", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Turmas
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-lg font-bold">
                {isLoadingClasses ? (
                  <Skeleton className="h-8 w-8 mx-auto" />
                ) : (
                  teacherClasses?.length || 0
                )}
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {isLoadingClasses ? (
                    <Skeleton className="h-4 w-20 mx-auto" />
                  ) : (
                    `Turma${teacherClasses && teacherClasses.length !== 1 ? "s" : ""}`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="classes">Turmas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
                    <p className="mt-1 flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(teacher.updatedAt), "PPP", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Turmas Associadas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingClasses ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : teacherClasses && teacherClasses.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacherClasses.map((classItem) => (
                          <TableRow key={classItem.id}>
                            <TableCell className="font-medium">{classItem.code}</TableCell>
                            <TableCell>{classItem.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {classItem.status === 'scheduled' && 'Agendada'}
                                {classItem.status === 'in_progress' && 'Em Andamento'}
                                {classItem.status === 'completed' && 'Concluída'}
                                {classItem.status === 'cancelled' && 'Cancelada'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {classItem.startDate && classItem.endDate
                                ? `${format(new Date(classItem.startDate), "dd/MM/yyyy")} - ${format(new Date(classItem.endDate), "dd/MM/yyyy")}`
                                : "Período não definido"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link to={`/admin/classes/${classItem.id}`}>
                                  Detalhes
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Este professor ainda não está associado a nenhuma turma.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}