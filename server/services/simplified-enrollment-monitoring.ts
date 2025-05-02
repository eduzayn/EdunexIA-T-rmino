import { storage } from '../database-storage';
import { paymentService } from './payment-service';
import { type SimplifiedEnrollment } from '../../shared/schema';

/**
 * Serviço para o monitoramento das matrículas simplificadas.
 * Este serviço executa job para verificar o status das matrículas e aplicar regras de negócio.
 */
export class SimplifiedEnrollmentMonitoring {
  private running = false;
  
  /**
   * Inicializa o serviço e agenda execuções periódicas
   */
  initialize() {
    console.log('Inicializando serviço de monitoramento de matrículas simplificadas');
    
    // Executar imediatamente (após 5 minutos para permitir que o sistema inicialize)
    setTimeout(() => this.runMonitoring(), 5 * 60 * 1000);
    
    // Executar diariamente (a cada 24 horas)
    setInterval(() => this.runMonitoring(), 24 * 60 * 60 * 1000);
  }
  
  /**
   * Executa o monitoramento das matrículas
   */
  async runMonitoring() {
    if (this.running) {
      console.log('Job de monitoramento já está em execução');
      return;
    }
    
    try {
      this.running = true;
      console.log('Iniciando job de monitoramento de matrículas:', new Date().toISOString());
      
      // Buscar todos os tenants
      const tenants = await storage.getAllTenants();
      console.log(`Analisando ${tenants.length} tenants`);
      
      for (const tenant of tenants) {
        await this.processMatriculasByTenant(tenant.id);
      }
      
      console.log('Job de monitoramento concluído:', new Date().toISOString());
    } catch (error) {
      console.error('Erro durante execução do job de monitoramento:', error);
    } finally {
      this.running = false;
    }
  }
  
  /**
   * Processa todas as matrículas de um tenant
   */
  private async processMatriculasByTenant(tenantId: number) {
    console.log(`Processando matrículas do tenant ${tenantId}`);
    
    try {
      // 1. Verificar matrículas pendentes há mais de 10 dias (sem primeiro pagamento)
      await this.suspendPendingEnrollments(tenantId);
      
      // 2. Verificar matrículas suspensas há mais de 30 dias
      await this.cancelLongSuspendedEnrollments(tenantId);
      
      // 3. Verificar matrículas com pagamentos em atraso por mais de 30 dias
      await this.suspendEnrollmentsWithOverduePayments(tenantId);
      
      // 4. Verificar matrículas com pagamentos em atraso por mais de 90 dias
      await this.cancelEnrollmentsWithLongOverduePayments(tenantId);
    } catch (error) {
      console.error(`Erro ao processar matrículas do tenant ${tenantId}:`, error);
    }
  }
  
  /**
   * Suspende matrículas pendentes há mais de 10 dias
   */
  private async suspendPendingEnrollments(tenantId: number) {
    try {
      // Buscar matrículas com status 'pending' ou 'waiting_payment'
      const pendingEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
        tenantId, 
        ['pending', 'waiting_payment']
      );
      
      console.log(`Verificando ${pendingEnrollments.length} matrículas pendentes`);
      
      for (const enrollment of pendingEnrollments) {
        // Verificar se a matrícula tem mais de 10 dias
        const enrollmentDate = new Date(enrollment.createdAt);
        const daysPassed = this.getDaysBetween(enrollmentDate, new Date());
        
        if (daysPassed >= 10) {
          console.log(`Matrícula ${enrollment.id} está pendente há ${daysPassed} dias. Suspendendo...`);
          
          // Atualizar status para 'suspended'
          await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'suspended');
          
          // Atualizar matrícula formal se existir
          if (enrollment.studentId) {
            const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
              enrollment.studentId, 
              enrollment.courseId
            );
            
            for (const formalEnrollment of formalEnrollments) {
              await storage.updateEnrollmentStatus(formalEnrollment.id, 'suspended');
            }
          }
          
          console.log(`Matrícula ${enrollment.id} suspensa com sucesso`);
        }
      }
    } catch (error) {
      console.error('Erro ao suspender matrículas pendentes:', error);
    }
  }
  
  /**
   * Cancela matrículas suspensas há mais de 30 dias
   */
  private async cancelLongSuspendedEnrollments(tenantId: number) {
    try {
      // Buscar matrículas com status 'suspended'
      const suspendedEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
        tenantId, 
        ['suspended']
      );
      
      console.log(`Verificando ${suspendedEnrollments.length} matrículas suspensas`);
      
      for (const enrollment of suspendedEnrollments) {
        // Usamos a data de atualização como referência (quando foi suspensa)
        const suspensionDate = new Date(enrollment.updatedAt);
        const daysSinceSuspension = this.getDaysBetween(suspensionDate, new Date());
        
        if (daysSinceSuspension >= 30) {
          console.log(`Matrícula ${enrollment.id} está suspensa há ${daysSinceSuspension} dias. Cancelando...`);
          
          // Cancelar pagamentos no Asaas
          if (enrollment.asaasPaymentId) {
            await paymentService.cancelPayment(enrollment.asaasPaymentId);
          }
          
          // Se tiver customerID, cancelar futuras cobranças
          if (enrollment.asaasCustomerId) {
            await paymentService.cancelFuturePayments(enrollment.asaasCustomerId);
          }
          
          // Atualizar status para 'cancelled'
          await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'cancelled');
          
          // Atualizar matrícula formal se existir
          if (enrollment.studentId) {
            const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
              enrollment.studentId, 
              enrollment.courseId
            );
            
            for (const formalEnrollment of formalEnrollments) {
              await storage.updateEnrollmentStatus(formalEnrollment.id, 'cancelled');
            }
          }
          
          console.log(`Matrícula ${enrollment.id} cancelada com sucesso`);
        }
      }
    } catch (error) {
      console.error('Erro ao cancelar matrículas suspensas:', error);
    }
  }
  
  /**
   * Suspende matrículas com pagamentos em atraso por mais de 30 dias
   */
  private async suspendEnrollmentsWithOverduePayments(tenantId: number) {
    try {
      // Buscar matrículas ativas (com pelo menos o primeiro pagamento realizado)
      const activeEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
        tenantId, 
        ['payment_confirmed', 'completed']
      );
      
      console.log(`Verificando ${activeEnrollments.length} matrículas ativas para pagamentos em atraso`);
      
      for (const enrollment of activeEnrollments) {
        if (!enrollment.asaasCustomerId) continue;
        
        // Verificar se existem pagamentos em atraso
        const overduePayments = await paymentService.getOverduePaymentsByCustomer(
          enrollment.asaasCustomerId
        );
        
        if (overduePayments && overduePayments.length > 0) {
          // Encontrar o pagamento mais antigo em atraso
          const oldestOverduePayment = overduePayments.reduce((oldest: any, current: any) => {
            const oldestDate = new Date(oldest.dueDate);
            const currentDate = new Date(current.dueDate);
            return currentDate < oldestDate ? current : oldest;
          });
          
          const dueDate = new Date(oldestOverduePayment.dueDate);
          const daysOverdue = this.getDaysBetween(dueDate, new Date());
          
          // Se estiver em atraso há mais de 30 dias, suspender
          if (daysOverdue >= 30) {
            console.log(`Matrícula ${enrollment.id} com pagamento em atraso há ${daysOverdue} dias. Suspendendo...`);
            
            // Atualizar status para 'suspended'
            await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'suspended');
            
            // Atualizar matrícula formal se existir
            if (enrollment.studentId) {
              const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
                enrollment.studentId, 
                enrollment.courseId
              );
              
              for (const formalEnrollment of formalEnrollments) {
                await storage.updateEnrollmentStatus(formalEnrollment.id, 'suspended');
              }
            }
            
            console.log(`Matrícula ${enrollment.id} suspensa com sucesso`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao suspender matrículas com pagamentos em atraso:', error);
    }
  }
  
  /**
   * Cancela matrículas com pagamentos em atraso por mais de 90 dias
   */
  private async cancelEnrollmentsWithLongOverduePayments(tenantId: number) {
    try {
      // Buscar matrículas suspensas (que já foram suspensas por atraso)
      const suspendedEnrollments = await storage.getSimplifiedEnrollmentsByStatus(
        tenantId, 
        ['suspended']
      );
      
      console.log(`Verificando ${suspendedEnrollments.length} matrículas suspensas para cancelamento por inadimplência longa`);
      
      for (const enrollment of suspendedEnrollments) {
        if (!enrollment.asaasCustomerId) continue;
        
        // Verificar se existem pagamentos em atraso
        const overduePayments = await paymentService.getOverduePaymentsByCustomer(
          enrollment.asaasCustomerId
        );
        
        if (overduePayments && overduePayments.length > 0) {
          // Encontrar o pagamento mais antigo em atraso
          const oldestOverduePayment = overduePayments.reduce((oldest: any, current: any) => {
            const oldestDate = new Date(oldest.dueDate);
            const currentDate = new Date(current.dueDate);
            return currentDate < oldestDate ? current : oldest;
          });
          
          const dueDate = new Date(oldestOverduePayment.dueDate);
          const daysOverdue = this.getDaysBetween(dueDate, new Date());
          
          // Se estiver em atraso há mais de 90 dias, cancelar
          if (daysOverdue >= 90) {
            console.log(`Matrícula ${enrollment.id} com pagamento em atraso há ${daysOverdue} dias. Cancelando...`);
            
            // Cancelar futuras cobranças
            if (enrollment.asaasCustomerId) {
              await paymentService.cancelFuturePayments(enrollment.asaasCustomerId);
            }
            
            // Atualizar status para 'cancelled'
            await storage.updateSimplifiedEnrollmentStatus(enrollment.id, 'cancelled');
            
            // Atualizar matrícula formal se existir
            if (enrollment.studentId) {
              const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
                enrollment.studentId, 
                enrollment.courseId
              );
              
              for (const formalEnrollment of formalEnrollments) {
                await storage.updateEnrollmentStatus(formalEnrollment.id, 'cancelled');
              }
            }
            
            console.log(`Matrícula ${enrollment.id} cancelada com sucesso`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao cancelar matrículas com pagamentos em atraso prolongado:', error);
    }
  }
  
  /**
   * Retorna o número de dias entre duas datas
   */
  private getDaysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds em um dia
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffTime / oneDay);
  }
}

export const simplifiedEnrollmentMonitoring = new SimplifiedEnrollmentMonitoring();