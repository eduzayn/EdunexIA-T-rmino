import React from 'react';
import { formatDate } from '@/lib/utils';

interface PostgradCertificateProps {
  studentName: string;
  courseName: string;
  courseHours: number;
  startDate: string;
  endDate: string;
  institutionName: string;
  directorName: string;
  directorTitle: string;
  registrationNumber: string;
  certificateId: string;
  disciplines?: Array<{
    name: string;
    teacherName: string;
    teacherTitle: string;
    hours: number;
    grade: string;
  }>;
}

/**
 * Componente de Certificado de Pós-Graduação
 * Segue o padrão exigido pelo MEC conforme Portaria Nº 1484 de 20 de Dezembro de 2016
 */
export const PostgradCertificate: React.FC<PostgradCertificateProps> = ({
  studentName,
  courseName,
  courseHours,
  startDate,
  endDate,
  institutionName,
  directorName,
  directorTitle,
  registrationNumber,
  certificateId,
  disciplines = []
}) => {
  // Gerar código QR para autenticação
  const qrCodeUrl = `https://edunexia.com/verify-certificate/${certificateId}`;
  
  return (
    <div className="w-full h-full flex flex-col print:p-0">
      {/* Primeira página - Certificado */}
      <div className="w-full bg-white flex flex-col relative print:h-[297mm] print:w-[210mm] p-8 page-break-after-always">
        {/* Cabeçalho com logo e faixa dourada */}
        <div className="w-full flex items-center justify-between bg-gradient-to-r from-amber-100 to-amber-300 p-4 rounded-t-lg">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                E
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500"></div>
            </div>
            <div className="ml-4 text-blue-900">Edunéxia</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm text-blue-900">{institutionName}</div>
            <div className="w-24 h-24">
              <div className="border border-gray-300 w-full h-full flex items-center justify-center text-xs text-gray-500">
                QR Code
              </div>
            </div>
          </div>
        </div>
        
        {/* Corpo do certificado */}
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center border-l border-r border-amber-200 px-12 py-8 bg-white">
          <h1 className="text-3xl font-serif text-blue-900 mb-2">{institutionName}</h1>
          <h2 className="text-2xl font-serif text-blue-900 mb-8">CERTIFICADO</h2>
          
          <p className="mb-8 text-lg text-blue-900">Este certificado é orgulhosamente apresentado a:</p>
          
          <h2 className="text-4xl font-serif text-blue-900 mb-8 border-b border-amber-200 pb-2 px-12">{studentName}</h2>
          
          <p className="mb-8 text-lg text-blue-900 max-w-3xl">
            O Diretor Geral da <span className="font-bold">{institutionName}</span>, no uso de suas 
            atribuições e tendo em vista a conclusão do <span className="font-bold">Especialização em {courseName}</span> com duração de {courseHours} 
            horas, outorga-lhe o presente Certificado, a fim de que possa gozar de todos os direitos e prerrogativas 
            legais.
          </p>
          
          <div className="w-full flex justify-between mt-12 pt-8">
            <div className="flex flex-col items-center">
              <div className="border-t border-gray-400 w-48 mb-2"></div>
              <p className="font-bold">{studentName}</p>
              <p className="text-sm">Profissional</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="border-t border-gray-400 w-48 mb-2"></div>
              <p className="font-bold">{directorName}</p>
              <p className="text-sm">{directorTitle}</p>
            </div>
          </div>
        </div>
        
        {/* Rodapé com bordas douradas */}
        <div className="w-full bg-gradient-to-r from-amber-100 to-amber-300 p-4 rounded-b-lg flex justify-between text-xs text-blue-900">
          <div>Certificado: {certificateId}</div>
          <div>Emitido em: {formatDate(new Date())}</div>
        </div>
      </div>
      
      {/* Segunda página - Histórico Escolar */}
      <div className="w-full bg-white flex flex-col print:h-[297mm] print:w-[210mm] p-8">
        <h2 className="text-xl font-bold text-center mb-4">{institutionName}</h2>
        
        <p className="text-sm text-center mb-6">
          Credenciada no MEC através da Portaria Nº 1484 de 20 de Dezembro de 2016, Publicado D.O.U. 21/12/2016 e Portaria Nº 
          949 de 7 de Dezembro de 2022.
        </p>
        
        <h3 className="text-center text-lg font-bold my-4">HISTÓRICO ESCOLAR</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-300 p-2">
            <p><strong>Curso:</strong> Especialização em {courseName}</p>
            <p><strong>Nome:</strong> {studentName}</p>
            <p><strong>Total de Horas:</strong> {courseHours}</p>
          </div>
          <div className="border border-gray-300 p-2">
            <p><strong>Área de Conhecimento:</strong> Educação</p>
            <p><strong>Nascimento:</strong> </p>
            <p><strong>Período do Curso:</strong> {formatDate(startDate)} a {formatDate(endDate)}</p>
          </div>
        </div>
        
        <table className="w-full border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-sm">DISCIPLINAS</th>
              <th className="border border-gray-300 p-2 text-sm">CORPO DOCENTE</th>
              <th className="border border-gray-300 p-2 text-sm">TITULAÇÃO</th>
              <th className="border border-gray-300 p-2 text-sm">CARGA HORÁRIA</th>
              <th className="border border-gray-300 p-2 text-sm">FREQUÊNCIA</th>
              <th className="border border-gray-300 p-2 text-sm">APROVEITAMENTO</th>
            </tr>
          </thead>
          <tbody>
            {disciplines.length > 0 ? (
              disciplines.map((discipline, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2 text-sm">{discipline.name}</td>
                  <td className="border border-gray-300 p-2 text-sm">{discipline.teacherName}</td>
                  <td className="border border-gray-300 p-2 text-sm">{discipline.teacherTitle}</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">{discipline.hours}</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">100%</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">{discipline.grade}</td>
                </tr>
              ))
            ) : (
              Array.from({ length: 7 }).map((_, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                  <td className="border border-gray-300 p-2">&nbsp;</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div className="border border-gray-300 p-4 mb-6">
          <h4 className="font-bold mb-2">REGIME E CRITÉRIOS ADOTADOS:</h4>
          <ul className="text-sm list-disc pl-5">
            <li>Avaliação formativa e somativa, por disciplina, aferida através de trabalhos, provas e exercícios.</li>
            <li>Aproveitamento mínimo de 70% (Setenta por cento).</li>
            <li>Frequência de pelo menos 75% (Setenta e cinco por cento), da carga horária por disciplina.</li>
            <li>Aprovação de Monografia Final.</li>
            <li>O presente curso cumpriu todas as disposições da Resolução CNE/CES nº 1, de 06 de abril de 2018.</li>
          </ul>
        </div>
        
        <div className="w-full flex justify-between mt-8">
          <div className="flex items-end">
            <div className="w-24 h-24 border border-gray-300 flex items-center justify-center text-xs text-gray-500">
              QR Code
            </div>
            <div className="ml-4">
              <img src="/logo.png" alt="Logo" className="w-16 h-16" />
              <p className="text-sm">{institutionName}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="border-t border-gray-400 w-48 mb-2"></div>
            <p className="font-bold">{directorName}</p>
            <p className="text-sm">{directorTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostgradCertificate;