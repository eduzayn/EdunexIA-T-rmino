import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Função para mesclar classes do tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar valores monetários
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Função para formatar datas
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Função para truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Exportar dados para arquivo CSV
 * @param data Array de objetos a serem exportados
 * @param filename Nome do arquivo a ser baixado
 * @param headers Cabeçalhos personalizados (opcional)
 */
export function exportToCSV(
  data: any[],
  filename: string,
  headers?: Record<string, string>
): void {
  if (!data || !data.length) {
    console.error('Nenhum dado para exportar');
    return;
  }
  
  try {
    // Determinar cabeçalhos e mapeamento de campos
    const fields = Object.keys(data[0]);
    const headerLabels = headers || Object.fromEntries(
      fields.map(field => [field, field])
    );
    
    // Criar linha de cabeçalho
    const csvHeader = fields
      .map(field => `"${headerLabels[field] || field}"`)
      .join(',');
    
    // Converter dados para linhas CSV
    const csvRows = data.map(row => {
      return fields
        .map(field => {
          let value = row[field];
          
          // Formatação especial para tipos específicos
          if (value instanceof Date) {
            value = formatDate(value);
          } else if (typeof value === 'number' && field.toLowerCase().includes('price')) {
            value = formatCurrency(value);
          } else if (value === null || value === undefined) {
            value = '';
          }
          
          // Escapar aspas duplas e envolver em aspas duplas
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    
    // Combinar cabeçalho e linhas
    const csvString = [csvHeader, ...csvRows].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    
    // Temporizar para garantir que o link seja clicado
    setTimeout(() => {
      link.click();
      // Limpar o URL criado
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Erro ao exportar para CSV:', error);
  }
}