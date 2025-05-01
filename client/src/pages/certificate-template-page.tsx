import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PostgradCertificate } from '@/components/certificates/postgrad-certificate';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2, Printer } from 'lucide-react';

/**
 * Página de Visualização de Certificado
 * Exibe um certificado com base no tipo de curso e ID do aluno/curso
 */
export const CertificateTemplatePage: React.FC = () => {
  const { studentId, courseId } = useParams<{ studentId: string, courseId: string }>();
  
  // Simulação de dados de certificado - Em produção viriam da API
  const certificateData = {
    studentName: "João Silva",
    courseName: "Psicanálise",
    courseHours: 800,
    startDate: "2023-03-01",
    endDate: "2024-12-15",
    institutionName: "Faculdade Edunéxia",
    directorName: "Ana Lúcia Moreira Gonçalves",
    directorTitle: "Diretora Adjunta",
    registrationNumber: "123456",
    certificateId: `${studentId}-${courseId}`,
    disciplines: [
      {
        name: "Fundamentos da Psicanálise",
        teacherName: "Dr. Ricardo Prado",
        teacherTitle: "Doutor em Psicologia",
        hours: 120,
        grade: "A"
      },
      {
        name: "Teoria e Prática Clínica",
        teacherName: "Dra. Mariana Costa",
        teacherTitle: "Doutora em Psicanálise",
        hours: 160,
        grade: "A"
      },
      {
        name: "Psicopatologia",
        teacherName: "Dr. Paulo Mendes",
        teacherTitle: "Doutor em Medicina",
        hours: 100,
        grade: "B"
      },
      {
        name: "Técnicas de Interpretação",
        teacherName: "Dra. Carla Santos",
        teacherTitle: "Doutora em Psicologia",
        hours: 120,
        grade: "A"
      },
      {
        name: "Psicanálise Aplicada",
        teacherName: "Dr. André Lima",
        teacherTitle: "Doutor em Psicologia",
        hours: 140,
        grade: "B"
      },
      {
        name: "Estudos de Caso",
        teacherName: "Dra. Silvia Rocha",
        teacherTitle: "Doutora em Psicanálise",
        hours: 160,
        grade: "A"
      }
    ]
  };

  // Buscar dados reais da API
  const { isLoading, error, data } = useQuery({
    queryKey: ['/api/certificates', studentId, courseId],
    // Usando os dados reais da API ao invés dos dados simulados
    enabled: !!studentId && !!courseId
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Certificado de Conclusão</h1>
          <Button 
            onClick={handlePrint} 
            className="print:hidden"
            variant="outline"
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir Certificado
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Carregando certificado...</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <p>Erro ao carregar o certificado. Por favor, tente novamente.</p>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="bg-white shadow-lg rounded-lg print:shadow-none">
            {/* Certificado usando o modelo adequado baseado no tipo de curso */}
            <PostgradCertificate {...data} />
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p>Dados do certificado não disponíveis. Verifique se o ID do estudante e do curso estão corretos.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default CertificateTemplatePage;