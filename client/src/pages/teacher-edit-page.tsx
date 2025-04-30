import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TeacherForm from "@/components/teachers/teacher-form";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherEditPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Extrair ID do professor da URL
  const pathSegments = window.location.pathname.split("/");
  const teacherId = parseInt(pathSegments[pathSegments.length - 2]); // O último segmento é "edit"

  // Obter detalhes do professor
  const { data: teacher, isLoading: isLoadingTeacher, error } = useQuery<User>({
    queryKey: ["/api/teachers", teacherId],
    enabled: !isNaN(teacherId),
  });

  // Redirecionar se houver erro ou ID inválido
  useEffect(() => {
    if (isNaN(teacherId) || error) {
      toast({
        title: "Erro ao carregar professor",
        description: "Professor não encontrado ou você não tem permissão para editá-lo.",
        variant: "destructive",
      });
      navigate("/admin/teachers");
    }
  }, [teacherId, error, navigate, toast]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/teachers/${teacherId}`, data);
      await response.json();
      
      // Invalidar cache para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId] });
      
      toast({
        title: "Professor atualizado",
        description: "As informações do professor foram atualizadas com sucesso.",
      });
      
      // Redirecionar para a página de detalhes
      navigate(`/admin/teachers/${teacherId}`);
    } catch (error) {
      toast({
        title: "Erro ao atualizar professor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isLoadingTeacher) {
    return (
      <AppShell>
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6">Editar Professor</h1>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!teacher) {
    return null; // O useEffect vai redirecionar
  }

  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Editar Professor: {teacher.fullName}</h1>
        <TeacherForm 
          initialData={teacher} 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
        />
      </div>
    </AppShell>
  );
}