import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { AreaChart, Calendar, CheckCircle, FileText, Users } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { PopularCourses } from '@/components/dashboard/popular-courses';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { apiRequest } from '@/lib/queryClient';

export default function PartnerDashboard() {
  // Consulta os dados do dashboard
  const { data: dashboardStats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/dashboard/stats');
      return response.data;
    }
  });

  return (
    <AppShell>
      <Helmet>
        <title>Dashboard do Parceiro | Edunéxia</title>
      </Helmet>

      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Parceiro</h1>
          <p className="text-muted-foreground">
            Gerencie certificações e documentos de seus alunos
          </p>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <DashboardCard 
            title="Alunos Cadastrados"
            value={dashboardStats?.studentsCount || "0"}
            icon="students"
            trend={{
              value: 8.2,
              isPositive: true,
              label: "este mês"
            }}
          />
          
          <DashboardCard 
            title="Documentos Pendentes"
            value={dashboardStats?.pendingDocumentsCount || "0"}
            icon="documents"
            trend={{
              value: 4.1,
              isPositive: false,
              label: "este mês"
            }}
          />
          
          <DashboardCard 
            title="Certificações Aprovadas"
            value={dashboardStats?.approvedCertificatesCount || "0"}
            icon="certificates"
            trend={{
              value: 12.5,
              isPositive: true,
              label: "este mês"
            }}
          />
          
          <DashboardCard 
            title="Taxa de Aprovação"
            value={`${dashboardStats?.approvalRate || 0}%`}
            icon="completion"
            trend={{
              value: 3.2,
              isPositive: true,
              label: "este mês"
            }}
          />
        </div>
        
        {/* Middle Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2">
            <ActivityFeed activities={dashboardStats?.recentActivity || []} />
          </div>
          
          <div>
            <PopularCourses 
              courses={
                (dashboardStats?.popularCourses || []).map((course: any, index: number) => {
                  // Determinar a categoria com verificações de segurança
                  const category = course?.category || "development";
                  // Garantir IDs únicos para cada curso
                  const courseId = course?.id || (index + 1) * 1000;
                  
                  return {
                    id: courseId,
                    title: course?.title || course?.courseTitle || "Curso sem título",
                    studentsCount: course?.studentsCount || 0,
                    price: course?.price || 0,
                    rating: course?.rating || "0.0",
                    category: category
                  };
                })
              } 
            />
          </div>
        </div>
        
        {/* Status de Certificações e Documentos */}
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Status de Certificações</h2>
            <button className="text-sm text-primary hover:underline flex items-center">
              Ver todos os registros
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Aluno</th>
                  <th className="text-left py-3 font-medium">Curso</th>
                  <th className="text-left py-3 font-medium">Valor</th>
                  <th className="text-left py-3 font-medium">Data</th>
                  <th className="text-left py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Carregando dados...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-destructive">
                      Erro ao carregar dados
                    </td>
                  </tr>
                ) : (dashboardStats?.recentCertifications || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Nenhuma certificação recente encontrada
                    </td>
                  </tr>
                ) : (
                  (dashboardStats?.recentCertifications || []).map((certification: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3">{certification.studentName}</td>
                      <td className="py-3">{certification.courseName}</td>
                      <td className="py-3">R$ {certification.value.toFixed(2)}</td>
                      <td className="py-3">{new Date(certification.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          certification.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : certification.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {certification.status === 'approved' 
                            ? 'Aprovado' 
                            : certification.status === 'pending' 
                            ? 'Pendente' 
                            : 'Rejeitado'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Widget IA */}
        <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Assistente IA EdunéxIA</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Seu assistente inteligente para ajudar com certificações e documentação
              </p>
              <div className="bg-card rounded-lg p-4 mb-3 shadow-sm">
                <p className="text-sm">
                  <span className="font-medium">Olá!</span> Sou o assistente da EdunéxIA. Como posso ajudar você hoje?
                </p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                  Como enviar documentos?
                </button>
                <button className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                  Solicitar certificação
                </button>
                <button className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                  Ver meus pagamentos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}