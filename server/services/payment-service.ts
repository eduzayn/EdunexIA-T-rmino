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
      // Formatação e validação do CPF/CNPJ
      // De acordo com a documentação do Asaas (https://docs.asaas.com/reference/criar-um-link-de-pagamentos),
      // o CPF/CNPJ deve ser enviado COM formatação (pontos, traços, barras)
      
      // Primeiro, remover qualquer formatação existente
      let cpfCnpjRaw = data.cpfCnpj.replace(/[^0-9]/g, '');
      
      // Validar quantidade de dígitos
      if (cpfCnpjRaw.length !== 11 && cpfCnpjRaw.length !== 14) {
        throw new Error('CPF/CNPJ com formato inválido. Deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
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
      
      // Mapear o método de pagamento para o formato aceito pela API
      let asaasBillingTypes = [];
      switch (data.paymentMethod) {
        case 'BOLETO':
          asaasBillingTypes = ['BOLETO'];
          break;
        case 'CREDIT_CARD':
          asaasBillingTypes = ['CREDIT_CARD'];
          break;
        case 'PIX':
          asaasBillingTypes = ['PIX'];
          break;
        default:
          // UNDEFINED - permite todos os métodos
          asaasBillingTypes = ['BOLETO', 'CREDIT_CARD', 'PIX'];
      }
      
      // Log para debug
      console.log(`Preparando link de pagamento com métodos de pagamento:`, asaasBillingTypes);
      console.log(`Cliente ID: ${customerId}, Valor: ${data.value}, Link: ${linkName}`);
      
      // Criar payload para o link de pagamento
      const paymentLinkData = {
        name: linkName,
        description: description,
        value: data.value,
        billingTypes: asaasBillingTypes,
        chargeTypes: ['DETACHED'],
        dueDateLimitDays: 30,
        maxInstallmentCount: data.installments || 1,
        notificationEnabled: true,
        endDate: null, // Link sem data de expiração
        externalReference: `matricula-${data.enrollmentId}`,
        // Lista de itens obrigatória para o link de pagamento
        items: [{
          name: `Matrícula no curso ${data.courseTitle}`,
          value: data.value,
          quantity: 1
        }]
      };
      
      // URL para criar o link de pagamento
      const paymentLinkUrl = `${this.apiUrl}/v3/paymentLinks`;
      console.log(`Criando link de pagamento em: ${paymentLinkUrl}`);
      console.log(`Dados do link de pagamento: ${JSON.stringify(paymentLinkData).substring(0, 300)}...`);
      
      const response = await axios.post(
        paymentLinkUrl,
        paymentLinkData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.apiKey
          },
          // Aceitar qualquer código de status para debug
          validateStatus: () => true
        }
      );
      
      // Log para debug
      console.log(`Status da resposta do link: ${response.status}`);
      console.log(`Resposta do link: ${JSON.stringify(response.data).substring(0, 300)}...`);
      
      return {
        paymentUrl: response.data.url,
        paymentId: response.data.id
      };
    } catch (error: any) {
      console.error('Erro ao criar link de pagamento no Asaas:', error.response?.data || error.message);
      
      // Se a resposta tiver detalhes de erro, exibi-los
      if (error.response?.data?.errors) {
        console.error('Detalhes do erro Asaas:', JSON.stringify(error.response.data.errors));
      }
      
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar link de pagamento');
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