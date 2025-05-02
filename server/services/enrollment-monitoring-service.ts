import { storage } from '../database-storage';
import { paymentService } from './payment-service';
import { simplifiedEnrollmentStatusEnum } from '@shared/schema';

/**
 * Serviço responsável por monitorar as matrículas e aplicar regras de negócio 
 * relacionadas a pagamentos e status
 */
class EnrollmentMonitoringService {
  // Flag para evitar múltiplas execuções simultâneas
  private isRunning = false;
  
  /**
   * Inicializa o serviço de monitoramento
   */
  initialize() {
    console.log('Inicializando serviço de monitoramento de matrículas');
    // Executar a cada 24 horas (86400000 ms)
    setInterval(() => this.processEnrollments(), 86400000);
    
    // Executar uma vez na inicialização (após 5 minutos)
    setTimeout(() => this.processEnrollments(), 300000);
  }
  
  /**
   * Processa todas as matrículas e aplica regras de negócio
   */
  async processEnrollments() {
    if (this.isRunning) {
      console.log('Processamento de matrículas já está em execução');
      return;
    }
    
    try {
      this.isRunning = true;
      console.log('Iniciando processamento de matrículas:', new Date());
      
      // 1. Verifica matrículas com primeira parcela não paga após 10 dias
      await this.suspendEnrollmentsWithoutFirstPayment();
      
      // 2. Verifica matrículas suspensas há mais de 30 dias (40 dias sem pagamento)
      await this.cancelSuspendedEnrollments();
      
      // 3. Verifica matrículas com pagamentos em atraso por mais de 30 dias
      await this.suspendEnrollmentsWithOverduePayments();
      
      // 4. Verifica matrículas com pagamentos em atraso por mais de 90 dias
      await this.cancelEnrollmentsWithLongOverduePayments();
      
      console.log('Processamento de matrículas concluído:', new Date());
    } catch (error) {
      console.error('Erro no processamento de matrículas:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Suspende matrículas que não receberam o primeiro pagamento após 10 dias
   */
  private async suspendEnrollmentsWithoutFirstPayment() {
    try {
      // Buscar todas as matrículas com status 'pending' ou 'waiting_payment'
      const allTenants = await storage.getAllTenants();
      
      for (const tenant of allTenants) {
        const pendingEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
          tenant.id, 
          ['pending', 'waiting_payment']
        );
        
        console.log(`Verificando ${pendingEnrollments.length} matrículas pendentes para o tenant ${tenant.id}`);
        
        for (const enrollment of pendingEnrollments) {
          // Verificar se passaram 10 dias desde a criação
          const enrollmentDate = new Date(enrollment.createdAt);
          const daysSinceEnrollment = this.getDaysBetweenDates(enrollmentDate, new Date());
          
          if (daysSinceEnrollment >= 10) {
            console.log(`Matrícula ${enrollment.id} sem pagamento após 10 dias. Suspendendo...`);
            
            // Atualizar status para 'suspended'
            await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'suspended');
            
            // Se houver um ID de aluno, atualizar status da matrícula formal para 'suspended'
            if (enrollment.studentId) {
              const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
                enrollment.studentId, 
                enrollment.courseId
              );
              
              for (const formalEnrollment of formalEnrollments) {
                await storage.updateEnrollmentStatus(formalEnrollment.id, 'suspended');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao suspender matrículas sem primeiro pagamento:', error);
    }
  }
  
  /**
   * Cancela matrículas suspensas há mais de 30 dias
   */
  private async cancelSuspendedEnrollments() {
    try {
      const allTenants = await storage.getAllTenants();
      
      for (const tenant of allTenants) {
        const suspendedEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
          tenant.id, 
          ['suspended']
        );
        
        console.log(`Verificando ${suspendedEnrollments.length} matrículas suspensas para o tenant ${tenant.id}`);
        
        for (const enrollment of suspendedEnrollments) {
          // Verificar a data da última atualização (quando foi suspensa)
          const suspensionDate = new Date(enrollment.updatedAt);
          const daysSinceSuspension = this.getDaysBetweenDates(suspensionDate, new Date());
          
          // Se a matrícula está suspensa há mais de 30 dias
          if (daysSinceSuspension >= 30) {
            console.log(`Matrícula ${enrollment.id} suspensa há mais de 30 dias. Cancelando...`);
            
            // Cancelar cobranças no Asaas
            if (enrollment.asaasPaymentId) {
              try {
                await paymentService.cancelPayment(enrollment.asaasPaymentId);
                console.log(`Cobrança ${enrollment.asaasPaymentId} cancelada com sucesso`);
              } catch (paymentError) {
                console.error(`Erro ao cancelar cobrança ${enrollment.asaasPaymentId}:`, paymentError);
              }
            }
            
            // Atualizar status para 'cancelled'
            await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'cancelled');
            
            // Se houver um ID de aluno, atualizar status da matrícula formal para 'cancelled'
            if (enrollment.studentId) {
              const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
                enrollment.studentId, 
                enrollment.courseId
              );
              
              for (const formalEnrollment of formalEnrollments) {
                await storage.updateEnrollmentStatus(formalEnrollment.id, 'cancelled');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao cancelar matrículas suspensas:', error);
    }
  }
  
  /**
   * Suspende matrículas com pagamentos em atraso por mais de 30 dias
   * (para alunos que já pagaram a primeira parcela)
   */
  private async suspendEnrollmentsWithOverduePayments() {
    try {
      const allTenants = await storage.getAllTenants();
      
      for (const tenant of allTenants) {
        // Matrículas com status 'payment_confirmed' ou 'completed' (já pagaram pelo menos a primeira parcela)
        const activeEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
          tenant.id, 
          ['payment_confirmed', 'completed']
        );
        
        console.log(`Verificando ${activeEnrollments.length} matrículas ativas para o tenant ${tenant.id}`);
        
        for (const enrollment of activeEnrollments) {
          if (!enrollment.asaasCustomerId) continue;
          
          // Verificar pagamentos em atraso no Asaas
          try {
            const overduePayments = await paymentService.getOverduePaymentsByCustomer(enrollment.asaasCustomerId);
            
            if (overduePayments && overduePayments.length > 0) {
              // Encontrar o pagamento com atraso mais antigo
              const oldestOverduePayment = overduePayments.reduce((oldest, current) => {
                const oldestDate = new Date(oldest.dueDate);
                const currentDate = new Date(current.dueDate);
                return currentDate < oldestDate ? current : oldest;
              });
              
              const dueDate = new Date(oldestOverduePayment.dueDate);
              const daysOverdue = this.getDaysBetweenDates(dueDate, new Date());
              
              // Se estiver em atraso há mais de 30 dias, suspender
              if (daysOverdue >= 30) {
                console.log(`Matrícula ${enrollment.id} com pagamento em atraso há ${daysOverdue} dias. Suspendendo...`);
                
                // Atualizar status para 'suspended'
                await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'suspended');
                
                // Se houver um ID de aluno, atualizar status da matrícula formal para 'suspended'
                if (enrollment.studentId) {
                  const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
                    enrollment.studentId, 
                    enrollment.courseId
                  );
                  
                  for (const formalEnrollment of formalEnrollments) {
                    await storage.updateEnrollmentStatus(formalEnrollment.id, 'suspended');
                  }
                }
              }
            }
          } catch (paymentError) {
            console.error(`Erro ao verificar pagamentos em atraso para cliente ${enrollment.asaasCustomerId}:`, paymentError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao suspender matrículas com pagamentos em atraso:', error);
    }
  }
  
  /**
   * Cancela matrículas com pagamentos em atraso por mais de 90 dias
   * (para alunos que já pagaram a primeira parcela)
   */
  private async cancelEnrollmentsWithLongOverduePayments() {
    try {
      const allTenants = await storage.getAllTenants();
      
      for (const tenant of allTenants) {
        // Matrículas com status 'suspended' (que já foram suspensas por atraso)
        const suspendedEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
          tenant.id, 
          ['suspended']
        );
        
        console.log(`Verificando ${suspendedEnrollments.length} matrículas suspensas para o tenant ${tenant.id}`);
        
        for (const enrollment of suspendedEnrollments) {
          if (!enrollment.asaasCustomerId) continue;
          
          // Verificar pagamentos em atraso no Asaas
          try {
            const overduePayments = await paymentService.getOverduePaymentsByCustomer(enrollment.asaasCustomerId);
            
            if (overduePayments && overduePayments.length > 0) {
              // Encontrar o pagamento com atraso mais antigo
              const oldestOverduePayment = overduePayments.reduce((oldest, current) => {
                const oldestDate = new Date(oldest.dueDate);
                const currentDate = new Date(current.dueDate);
                return currentDate < oldestDate ? current : oldest;
              });
              
              const dueDate = new Date(oldestOverduePayment.dueDate);
              const daysOverdue = this.getDaysBetweenDates(dueDate, new Date());
              
              // Se estiver em atraso há mais de 90 dias, cancelar
              if (daysOverdue >= 90) {
                console.log(`Matrícula ${enrollment.id} com pagamento em atraso há ${daysOverdue} dias. Cancelando...`);
                
                // Cancelar cobranças a vencer no Asaas
                if (enrollment.asaasPaymentId) {
                  try {
                    await paymentService.cancelFuturePayments(enrollment.asaasCustomerId);
                    console.log(`Cobranças futuras para cliente ${enrollment.asaasCustomerId} canceladas com sucesso`);
                  } catch (paymentError) {
                    console.error(`Erro ao cancelar cobranças futuras para cliente ${enrollment.asaasCustomerId}:`, paymentError);
                  }
                }
                
                // Atualizar status para 'cancelled'
                await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'cancelled');
                
                // Se houver um ID de aluno, atualizar status da matrícula formal para 'cancelled'
                if (enrollment.studentId) {
                  const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
                    enrollment.studentId, 
                    enrollment.courseId
                  );
                  
                  for (const formalEnrollment of formalEnrollments) {
                    await storage.updateEnrollmentStatus(formalEnrollment.id, 'cancelled');
                  }
                }
              }
            }
          } catch (paymentError) {
            console.error(`Erro ao verificar pagamentos em atraso para cliente ${enrollment.asaasCustomerId}:`, paymentError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao cancelar matrículas com pagamentos em atraso:', error);
    }
  }
  
  /**
   * Calcula o número de dias entre duas datas
   */
  private getDaysBetweenDates(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Exportar instância para uso em toda a aplicação
export const enrollmentMonitoringService = new EnrollmentMonitoringService();