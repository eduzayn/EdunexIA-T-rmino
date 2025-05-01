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
  async getOrCreateCustomer(data: CreateCustomerPayload): Promise<AsaasCustomer> {
    try {
      // Verificar se o cliente já existe pelo CPF/CNPJ
      const searchResponse = await axios.get(
        `${this.apiUrl}/v3/customers?cpfCnpj=${data.cpfCnpj}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          }
        }
      );
      
      // Se o cliente já existe, retorná-lo
      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        return searchResponse.data.data[0];
      }
      
      // Se não existe, criar novo cliente
      const createResponse = await axios.post(
        `${this.apiUrl}/v3/customers`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          }
        }
      );
      
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
   * Cria um checkout para matrícula simplificada
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
      // Gerar data de vencimento (10 dias a partir de hoje caso não seja fornecida)
      const dueDate = data.dueDate || this.generateDueDate(10);
      
      // Preparar cliente
      const customerId = typeof data.customer === 'string' 
        ? data.customer 
        : data.customer.id;
      
      // Descrição do pagamento
      const description = `Matrícula: ${data.courseTitle} - Aluno: ${data.studentName}`;
      
      // Referência externa para rastreamento
      const externalReference = `matricula-${data.enrollmentId}`;
      
      // Configurar máximo de parcelas (até 12)
      const maxInstallmentCount = Math.min(data.installments || 1, 12);
      
      // Verificar o método de pagamento selecionado
      const selectedPaymentMethod = data.paymentMethod || 'UNDEFINED';
      
      // Criar configuração base do checkout
      const checkoutData: CreateCheckoutPayload = {
        customer: customerId,
        value: data.value,
        dueDate: dueDate,
        description: description,
        externalReference: externalReference,
        maxInstallmentCount: maxInstallmentCount,
        installmentCount: data.installments,
        notificationEnabled: true,
        // Definir o método de pagamento específico ou permitir que o cliente escolha
        billingType: selectedPaymentMethod as 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX',
        // Configurações para cartão (aplicável apenas se billingType for UNDEFINED ou CREDIT_CARD)
        creditCardEnabled: selectedPaymentMethod === 'UNDEFINED' || selectedPaymentMethod === 'CREDIT_CARD',
        creditCardBrandList: ['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD'],
        creditCardMaxInstallmentCount: maxInstallmentCount,
        // Juros e multa para boleto (aplicável apenas se billingType for UNDEFINED ou BOLETO)
        boletos: {
          chargeType: 'DETACHED',
          interest: {
            value: 1 // 1% ao mês
          },
          fine: {
            value: 2 // 2% sobre o valor
          }
        }
      };
      
      const response = await axios.post(
        `${this.apiUrl}/v3/checkouts`,
        checkoutData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          }
        }
      );
      
      return {
        paymentUrl: response.data.invoiceUrl,
        paymentId: response.data.id
      };
    } catch (error: any) {
      console.error('Erro ao criar checkout no Asaas:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar checkout');
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