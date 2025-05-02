import twilio from 'twilio';

/**
 * Serviço para envio de notificações SMS usando Twilio
 */
class NotificationService {
  private client: any;
  private twilioPhoneNumber: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o cliente Twilio
   */
  private initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

      if (!accountSid || !authToken || !this.twilioPhoneNumber) {
        console.error('Credenciais do Twilio não configuradas. Envio de SMS não estará disponível.');
        return;
      }

      this.client = twilio(accountSid, authToken);
      this.isInitialized = true;
      console.log('Serviço de notificação SMS inicializado com sucesso.');
    } catch (error) {
      console.error('Erro ao inicializar serviço de notificação SMS:', error);
    }
  }

  /**
   * Envia credenciais de acesso via SMS
   */
  async sendAccessCredentials(
    phoneNumber: string,
    studentName: string,
    username: string,
    password: string
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.error('Serviço de notificação SMS não inicializado. Credenciais não enviadas.');
        return false;
      }

      // Formatar número de telefone - remover caracteres não numéricos e adicionar código do país se necessário
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
      
      if (!formattedPhoneNumber) {
        console.error(`Número de telefone inválido: ${phoneNumber}`);
        return false;
      }

      // Preparar a mensagem
      const message = `Olá ${studentName}, bem-vindo(a) ao Edunéxia! Seus dados de acesso são:\nUsuário: ${username}\nSenha: ${password}\nAcesse: https://portal.edunexia.com`;

      // Enviar a mensagem
      const result = await this.client.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: formattedPhoneNumber
      });

      console.log(`SMS enviado para ${formattedPhoneNumber} com SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar SMS com credenciais:', error);
      return false;
    }
  }

  /**
   * Formata o número de telefone para padrão internacional
   * @param phoneNumber Número a ser formatado
   * @returns Número formatado ou null se inválido
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remover todos os caracteres não numéricos
    const digits = phoneNumber.replace(/\D/g, '');
    
    if (digits.length < 10) {
      return null; // Muito curto para ser válido
    }
    
    // Se já começar com +, assume que já está no formato internacional
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Se começar com 0, remover (prefixo local em alguns países)
    const withoutLeadingZero = digits.startsWith('0') ? digits.substring(1) : digits;
    
    // Se não tiver código do país (Brasil = 55), adicionar
    // Verifica se já tem código do país
    if (withoutLeadingZero.length <= 12 && !withoutLeadingZero.startsWith('55')) {
      return `+55${withoutLeadingZero}`;
    }
    
    // Se já estiver com o código do país, apenas adicionar o +
    return `+${withoutLeadingZero}`;
  }
}

export const notificationService = new NotificationService();