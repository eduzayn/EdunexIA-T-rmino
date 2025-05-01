import axios from 'axios';

// Configurações do Asaas
const ASAAS_API_URL = 'https://api.asaas.com'; // URL de produção oficial
// Usar a chave de produção do Asaas
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY || '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAw';

// Interfaces para tipagem
interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  dueDate: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  description?: string;
  externalReference?: string;
  invoiceNumber: string;
}

interface CreateCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

interface CreatePaymentPayload {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
  installmentCount?: number;
}

interface CreateCheckoutPayload {
  customer: string;
  billingType?: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  maxInstallmentCount?: number;
  notificationEnabled?: boolean;
  creditCardEnabled?: boolean;
  creditCardBrandList?: string[];
  creditCardMaxInstallmentCount?: number;
  creditCardStaticFirstInstallmentValue?: number;
  boletos?: {
    chargeType: 'DETACHED';
    interest?: {
      value: number;
    };
    fine?: {
      value: number;
    };
  };
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
}

/**
 * Serviço para gerenciar pagamentos e integração com o Asaas
 */
class PaymentService {
  private apiUrl: string;
  private apiKey: string;
  
  constructor() {
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_ZAYN_KEY não está configurado no ambiente');
    }
    
    // Usar sempre a URL de produção conforme solicitado
    this.apiUrl = ASAAS_API_URL;
    // Garantir que a chave não tenha espaços extras
    this.apiKey = ASAAS_API_KEY.trim();
    
    // Log de inicialização
    console.log('Serviço de pagamento do Asaas inicializado no ambiente de PRODUÇÃO');
    
    // Log para debug - mostrar os primeiros 10 caracteres da chave para verificação
    const keyStart = this.apiKey.substring(0, 10);
    console.log(`Chave API iniciando com: ${keyStart}...`);
    
    // Log da URL base para verificação
    console.log(`URL base da API: ${this.apiUrl}`);
  }
  
  /**
   * Cria ou recupera um cliente no Asaas
   */
  // Verifica se um CPF é válido (implementação do algoritmo de validação)
  private isValidCPF(cpf: string): boolean {
    const rawCPF = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem o tamanho correto e se não é uma sequência de dígitos iguais
    if (rawCPF.length !== 11 || /^(\d)\1{10}$/.test(rawCPF)) {
      return false;
    }
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(rawCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(rawCPF.charAt(9))) {
      return false;
    }
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(rawCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(rawCPF.charAt(10));
  }
  
  // Verifica se um CNPJ é válido (implementação do algoritmo de validação)
  private isValidCNPJ(cnpj: string): boolean {
    const rawCNPJ = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem o tamanho correto e se não é uma sequência de dígitos iguais
    if (rawCNPJ.length !== 14 || /^(\d)\1{13}$/.test(rawCNPJ)) {
      return false;
    }
    
    // Validação dos dígitos verificadores
    let size = rawCNPJ.length - 2;
    let numbers = rawCNPJ.substring(0, size);
    const digits = rawCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    // Primeiro dígito
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) {
      return false;
    }
    
    // Segundo dígito
    size = size + 1;
    numbers = rawCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return result === parseInt(digits.charAt(1));
  }
  
  async getOrCreateCustomer(data: CreateCustomerPayload): Promise<AsaasCustomer> {
    try {
      // Formatação e validação do CPF/CNPJ
      // De acordo com a documentação do Asaas (https://docs.asaas.com/reference/criar-um-link-de-pagamentos),
      // o CPF/CNPJ deve ser enviado COM formatação (pontos, traços, barras)
      
      // Remover qualquer formatação existente para validação
      const cpfCnpjRaw = data.cpfCnpj.replace(/[^\d]/g, '');
      
      // Validar quantidade de dígitos
      if (cpfCnpjRaw.length !== 11 && cpfCnpjRaw.length !== 14) {
        throw new Error('CPF/CNPJ com formato inválido. Deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
      }
      
      // Validar CPF/CNPJ usando os algoritmos
      let isValid = false;
      if (cpfCnpjRaw.length === 11) {
        isValid = this.isValidCPF(cpfCnpjRaw);
        if (!isValid) {
          throw new Error('CPF inválido. Verifique se os dígitos estão corretos.');
        }
      } else {
        isValid = this.isValidCNPJ(cpfCnpjRaw);
        if (!isValid) {
          throw new Error('CNPJ inválido. Verifique se os dígitos estão corretos.');
        }
      }
      
      // Formatar o CPF/CNPJ de acordo com o tamanho
      let formattedCpfCnpj;
      if (cpfCnpjRaw.length === 11) {
        // Formato CPF: 000.000.000-00
        formattedCpfCnpj = cpfCnpjRaw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      } else {
        // Formato CNPJ: 00.000.000/0000-00
        formattedCpfCnpj = cpfCnpjRaw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      }
      
      console.log(`CPF/CNPJ formatado para o Asaas: ${formattedCpfCnpj}`);
      
      // Log para debug - mostrar a URL completa
      const url = `${this.apiUrl}/v3/customers?cpfCnpj=${formattedCpfCnpj}`;
      console.log(`Fazendo requisição para: ${url}`);
      console.log(`Com header auth: ${this.apiKey.substring(0, 10)}...`);
      
      // Verificar se o cliente já existe pelo CPF/CNPJ
      const searchResponse = await axios.get(
        url,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          },
          // Aceitar qualquer código de status para debug
          validateStatus: () => true
        }
      );
      
      // Se o cliente já existe, retorná-lo
      // Log de resposta para debug
      console.log(`Status da resposta: ${searchResponse.status}`);
      console.log(`Resposta Asaas:`, JSON.stringify(searchResponse.data).substring(0, 300));
      
      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        return searchResponse.data.data[0];
      }
      
      // Se não existe, criar novo cliente
      const createUrl = `${this.apiUrl}/v3/customers`;
      console.log(`Criando cliente em: ${createUrl}`);
      
      // Preparando dados do cliente com CPF formatado
      const customerData = {
        ...data,
        cpfCnpj: formattedCpfCnpj,
        mobilePhone: data.mobilePhone ? data.mobilePhone.replace(/[^0-9]/g, '') : undefined
      };
      
      console.log(`Dados do cliente a ser criado:`, JSON.stringify(customerData));
      
      const createResponse = await axios.post(
        createUrl,
        customerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          },
          // Aceitar qualquer código de status para debug
          validateStatus: () => true
        }
      );
      
      // Log de resposta para debug
      console.log(`Status da criação: ${createResponse.status}`);
      console.log(`Resposta da criação:`, JSON.stringify(createResponse.data).substring(0, 300));
      
      if (createResponse.status >= 400) {
        throw new Error(createResponse.data.errors?.[0]?.description || `Erro ao criar cliente: ${createResponse.status}`);
      }
      
      return createResponse.data;
    } catch (error: any) {
      console.error('Erro ao criar/buscar cliente no Asaas:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao processar cliente');
    }
  }
  
  /**
   * Cria um boleto de pagamento para certificação
   */
  async createCertificationPayment(data: {
    customer: AsaasCustomer | string,
    certificationId: number,
    courseTitle: string,
    studentName: string,
    value: number,
    dueDate?: string // formato YYYY-MM-DD
  }): Promise<AsaasPayment> {
    try {
      // Gerar data de vencimento (10 dias a partir de hoje caso não seja fornecida)
      const dueDate = data.dueDate || this.generateDueDate(10);
      
      // Preparar cliente
      const customerId = typeof data.customer === 'string' 
        ? data.customer 
        : data.customer.id;
      
      // Descrição do pagamento
      const description = `Certificação: ${data.courseTitle} - Aluno: ${data.studentName}`;
      
      // Criar pagamento
      const paymentData: CreatePaymentPayload = {
        customer: customerId,
        billingType: 'BOLETO',
        value: data.value,
        dueDate: dueDate,
        description: description,
        externalReference: `certification-${data.certificationId}`
      };
      
      const response = await axios.post(
        `${this.apiUrl}/v3/payments`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar pagamento no Asaas:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar pagamento');
    }
  }
  
  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v3/payments/${paymentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          }
        }
      );
      
      return response.data.status;
    } catch (error: any) {
      console.error('Erro ao consultar pagamento no Asaas:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao consultar pagamento');
    }
  }
  
  /**
   * Cria um link de pagamento para matrícula simplificada
   */
  async createMatriculaCheckout(data: {
    customer: AsaasCustomer | string,
    enrollmentId: number,
    courseTitle: string,
    studentName: string,
    value: number,
    installments?: number,
    paymentMethod?: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX',
    dueDate?: string // formato YYYY-MM-DD
  }): Promise<{ paymentUrl: string, paymentId: string }> {
    try {
      // Gerar data de vencimento (30 dias a partir de hoje caso não seja fornecida)
      const dueDate = data.dueDate || this.generateDueDate(30);
      
      // Preparar cliente
      const customerId = typeof data.customer === 'string' 
        ? data.customer 
        : data.customer.id;
      
      // Descrição do pagamento
      const description = `Matrícula no curso: ${data.courseTitle}`;
      
      // Nome para o link de pagamento
      const linkName = `Matrícula #${data.enrollmentId} - ${data.studentName}`;
      
      // Variáveis para armazenar resultado
      let paymentUrl: string = '';
      let paymentId: string = '';
      
      // Tentativa 1: Criar uma cobrança direta padrão
      console.log('Tentando criar cobrança direta no Asaas...');
      
      try {
        // Se não for especificado, use BOLETO por ser compatível com todos os clientes
        const billingType = data.paymentMethod && data.paymentMethod !== 'UNDEFINED' 
          ? data.paymentMethod 
          : 'BOLETO';
        
        // Dados da cobrança seguindo a documentação do Asaas
        const paymentData = {
          customer: customerId,
          billingType: billingType,
          value: data.value,
          dueDate: dueDate,
          description: description,
          externalReference: `matricula-${data.enrollmentId}`,
          postalService: false
        };
        
        console.log(`Dados da cobrança: ${JSON.stringify(paymentData)}`);
        
        // Fazer a chamada da API
        const paymentResponse = await axios.post(
          `${this.apiUrl}/v3/payments`,
          paymentData,
          {
            headers: {
              'Content-Type': 'application/json',
              'access_token': this.apiKey
            },
            validateStatus: () => true
          }
        );
        
        console.log(`Status da resposta de cobrança: ${paymentResponse.status}`);
        console.log(`Resposta da cobrança: ${JSON.stringify(paymentResponse.data).substring(0, 300)}...`);
        
        // Verificar se a cobrança foi criada com sucesso
        if (paymentResponse.status >= 200 && paymentResponse.status < 300 && paymentResponse.data.invoiceUrl) {
          paymentUrl = paymentResponse.data.invoiceUrl;
          paymentId = paymentResponse.data.id;
          console.log(`Cobrança criada com sucesso. ID: ${paymentId}, URL: ${paymentUrl}`);
          
          return {
            paymentUrl,
            paymentId
          };
        } else {
          console.log('Cobrança criada, mas sem URL de pagamento. Tentando outro método...');
        }
      } catch (paymentError) {
        console.error('Erro ao criar cobrança:', paymentError);
      }
      
      // Tentativa 2: Criar um checkout (mais moderno)
      console.log('Tentando criar checkout no Asaas...');
      
      try {
        // Payload conforme a documentação do Asaas
        const checkoutData = {
          customer: customerId,
          billingType: data.paymentMethod !== 'UNDEFINED' ? data.paymentMethod : undefined,
          value: data.value,
          dueDate: dueDate,
          description: description,
          externalReference: `matricula-${data.enrollmentId}`
        };
        
        console.log(`Dados do checkout: ${JSON.stringify(checkoutData)}`);
        
        // Fazer a chamada da API
        const checkoutResponse = await axios.post(
          `${this.apiUrl}/v3/checkouts`,
          checkoutData,
          {
            headers: {
              'Content-Type': 'application/json',
              'access_token': this.apiKey
            },
            validateStatus: () => true
          }
        );
        
        console.log(`Status da resposta de checkout: ${checkoutResponse.status}`);
        console.log(`Resposta do checkout: ${JSON.stringify(checkoutResponse.data).substring(0, 300)}...`);
        
        // Verificar se o checkout foi criado com sucesso
        if (checkoutResponse.status >= 200 && checkoutResponse.status < 300 && checkoutResponse.data.url) {
          paymentUrl = checkoutResponse.data.url;
          paymentId = checkoutResponse.data.id;
          console.log(`Checkout criado com sucesso. ID: ${paymentId}, URL: ${paymentUrl}`);
          
          return {
            paymentUrl,
            paymentId
          };
        }
      } catch (checkoutError) {
        console.error('Erro ao criar checkout:', checkoutError);
      }
      
      // Tentativa final: Se chegamos aqui, tente criar uma cobrança com método BOLETO garantido
      console.log('Tentando criar cobrança de BOLETO como fallback...');
      
      try {
        // Dados da cobrança de fallback
        const fallbackData = {
          customer: customerId,
          billingType: 'BOLETO',  // BOLETO funciona para qualquer cliente
          value: data.value,
          dueDate: dueDate,
          description: `${description} (Boleto)`,
          externalReference: `matricula-${data.enrollmentId}`,
          postalService: false
        };
        
        console.log(`Dados do boleto de fallback: ${JSON.stringify(fallbackData)}`);
        
        // Fazer a chamada de API
        const boletoResponse = await axios.post(
          `${this.apiUrl}/v3/payments`,
          fallbackData,
          {
            headers: {
              'Content-Type': 'application/json',
              'access_token': this.apiKey
            },
            validateStatus: () => true
          }
        );
        
        console.log(`Status da resposta do boleto: ${boletoResponse.status}`);
        console.log(`Resposta do boleto: ${JSON.stringify(boletoResponse.data).substring(0, 300)}...`);
        
        // Verificar se o boleto foi criado com sucesso
        if (boletoResponse.status >= 200 && boletoResponse.status < 300 && boletoResponse.data.invoiceUrl) {
          paymentUrl = boletoResponse.data.invoiceUrl;
          paymentId = boletoResponse.data.id;
          console.log(`Boleto criado com sucesso. ID: ${paymentId}, URL: ${paymentUrl}`);
          
          return {
            paymentUrl,
            paymentId
          };
        } else {
          throw new Error(`Erro ao criar boleto: ${boletoResponse.data.errors?.[0]?.description || 'Falha na geração do boleto'}`);
        }
      } catch (boletoError) {
        console.error('Erro ao criar boleto fallback:', boletoError);
        throw boletoError;
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento no Asaas:', error.response?.data || error.message);
      
      // Se a resposta tiver detalhes de erro, exibi-los
      if (error.response?.data?.errors) {
        console.error('Detalhes do erro Asaas:', JSON.stringify(error.response.data.errors));
      }
      
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar pagamento');
    }
  }

  /**
   * Gera data de vencimento X dias à frente
   */
  private generateDueDate(daysAhead: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0]; // formato YYYY-MM-DD
  }
}

// Exporta instância singleton do serviço
export const paymentService = new PaymentService();