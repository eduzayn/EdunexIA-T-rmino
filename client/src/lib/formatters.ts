/**
 * Formatters úteis para formatação de valores no frontend.
 */

/**
 * Formata um valor numérico como moeda brasileira
 * @param value Valor em centavos ou em reais
 * @param inCents Se true, o valor está em centavos e deve ser dividido por 100
 */
export function formatCurrency(value: number, inCents: boolean = true): string {
  // Se o valor estiver em centavos, divide por 100
  const valueInReais = inCents ? value / 100 : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInReais);
}

/**
 * Formata uma data no padrão brasileiro
 * @param date Data a ser formatada
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formata um número com separadores de milhares
 * @param value Número a ser formatado
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata um CPF
 * @param cpf CPF a ser formatado (apenas dígitos)
 */
export function formatCpf(cpf: string): string {
  if (!cpf) return '';
  
  const onlyDigits = cpf.replace(/\D/g, '');
  
  if (onlyDigits.length !== 11) {
    return onlyDigits; // Retorna sem formatação se não tiver 11 dígitos
  }
  
  return onlyDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um telefone
 * @param phone Telefone a ser formatado (apenas dígitos)
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  const onlyDigits = phone.replace(/\D/g, '');
  
  if (onlyDigits.length < 10) {
    return onlyDigits; // Retorna sem formatação se não tiver pelo menos 10 dígitos
  }
  
  if (onlyDigits.length === 11) {
    // Celular com 9 dígitos
    return onlyDigits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  // Telefone fixo
  return onlyDigits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}