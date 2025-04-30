import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TeacherForm from "@/components/teachers/teacher-form";
import { AppShell } from "@/components/layout/app-shell";

export default function TeacherCreatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/teachers", data);
      const teacher = await response.json();
      
      toast({
        title: "Professor criado",
        description: "O professor foi criado com sucesso.",
      });
      
      // Redirecionar para a página de detalhes do professor
      navigate(`/admin/teachers/${teacher.id}`);
    } catch (error) {
      toast({
        title: "Erro ao criar professor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Criar Novo Professor</h1>
        <TeacherForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
        />
      </div>
    </AppShell>
  );
}