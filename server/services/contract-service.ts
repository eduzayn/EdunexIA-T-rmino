import { storage } from '../database-storage';
import { InsertEducationalContract, type SimplifiedEnrollment, type Course, type User } from '../../shared/schema';

/**
 * Serviço para geração e gestão de contratos educacionais
 */
class ContractService {
  /**
   * Gera um contrato educacional baseado em uma matrícula simplificada
   */
  async generateContractFromSimplifiedEnrollment(enrollmentId: number): Promise<number> {
    try {
      // Buscar a matrícula simplificada
      const enrollment = await storage.getSimplifiedEnrollmentById(enrollmentId);
      if (!enrollment) {
        throw new Error('Matrícula simplificada não encontrada');
      }
      
      // Buscar informações do curso
      const course = await storage.getCourseById(enrollment.courseId);
      if (!course) {
        throw new Error('Curso não encontrado');
      }
      
      // Buscar informações do aluno
      let student: User | undefined;
      if (enrollment.studentId) {
        student = await storage.getStudentById(enrollment.studentId);
        if (!student) {
          throw new Error('Estudante não encontrado');
        }
      } else {
        throw new Error('Estudante não associado à matrícula');
      }
      
      // Gerar número do contrato
      const contractNumber = await this.generateContractNumber(enrollment.tenantId);
      
      // Gerar texto do contrato
      const contractText = await this.generateContractText(enrollment, course, student);
      
      // Criar o contrato no banco de dados
      const contractData: InsertEducationalContract = {
        tenantId: enrollment.tenantId,
        studentId: enrollment.studentId,
        simplifiedEnrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        contractVersion: '1.0',
        contractText,
        status: 'pending',
        totalValue: enrollment.totalValue || 0,
        installments: enrollment.installments || 1,
        installmentValue: Math.ceil((enrollment.totalValue || 0) / (enrollment.installments || 1)),
        startDate: new Date(),
        contractNumber
      };
      
      // Buscar matrícula formal (se existir)
      if (enrollment.studentId) {
        const formalEnrollments = await storage.getEnrollmentsByStudentAndCourse(
          enrollment.studentId,
          enrollment.courseId
        );
        
        if (formalEnrollments && formalEnrollments.length > 0) {
          contractData.enrollmentId = formalEnrollments[0].id;
        }
      }
      
      // Inserir contrato no banco de dados
      const contract = await storage.createEducationalContract(contractData);
      
      console.log(`Contrato educacional #${contract.id} gerado com sucesso para a matrícula #${enrollmentId}`);
      
      return contract.id;
    } catch (error) {
      console.error('Erro ao gerar contrato educacional:', error);
      throw error;
    }
  }
  
  /**
   * Gera um número único para o contrato
   */
  private async generateContractNumber(tenantId: number): Promise<string> {
    // Formato: CONT-ANO-SEQUENCIAL (ex: CONT-2025-00001)
    const currentYear = new Date().getFullYear();
    const prefix = `CONT-${currentYear}`;
    
    // Buscar o último contrato criado para este tenant
    const latestContract = await storage.getLatestContractByTenant(tenantId);
    let sequence = 1;
    
    if (latestContract && latestContract.contractNumber) {
      // Extrair o número sequencial do último contrato
      const match = latestContract.contractNumber.match(/-(\d+)$/);
      if (match && match[1]) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }
    
    // Formatar o número com zeros à esquerda
    const sequenceFormatted = sequence.toString().padStart(5, '0');
    return `${prefix}-${sequenceFormatted}`;
  }
  
  /**
   * Gera o texto do contrato baseado nos dados da matrícula, curso e aluno
   */
  private async generateContractText(
    enrollment: SimplifiedEnrollment,
    course: Course,
    student: User
  ): Promise<string> {
    // Obter dados do tenant
    const tenant = await storage.getTenantById(enrollment.tenantId);
    if (!tenant) {
      throw new Error('Instituição de ensino não encontrada');
    }
    
    // Formatar valores monetários
    const formatCurrency = (value: number): string => {
      return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    // Data de matrícula formatada
    const enrollmentDate = new Date(enrollment.createdAt).toLocaleDateString('pt-BR');
    
    // Gerar o template do contrato
    return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

CONTRATADA: ${tenant.name}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede na Cidade de [Cidade], Estado de [Estado], doravante denominada simplesmente CONTRATADA.

CONTRATANTE: ${student.fullName}, pessoa física, inscrita no CPF sob o nº ${enrollment.studentCpf}, residente e domiciliada na Cidade de [Cidade], Estado de [Estado], doravante denominada simplesmente CONTRATANTE.

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços Educacionais, que se regerá pelas cláusulas e condições a seguir:

1. OBJETO

1.1. O presente contrato tem como objeto a prestação de serviços educacionais pela CONTRATADA ao CONTRATANTE, referente ao curso "${course.title}", conforme programação, carga horária, conteúdo programático e demais informações disponibilizadas pela CONTRATADA.

2. VALOR E CONDIÇÕES DE PAGAMENTO

2.1. Pelos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor total de ${formatCurrency(enrollment.totalValue || 0)}, que poderá ser pago à vista ou em ${enrollment.installments || 1} parcelas mensais e consecutivas de ${formatCurrency((enrollment.totalValue || 0) / (enrollment.installments || 1))}.

2.2. O atraso no pagamento de qualquer parcela implicará em multa de 2% sobre o valor da parcela, mais juros de 1% ao mês, calculados pro rata die, além da correção monetária pelo IPCA.

2.3. O não pagamento de qualquer parcela por mais de 30 (trinta) dias ensejará a suspensão do acesso do CONTRATANTE às aulas e materiais do curso, até a quitação do débito.

2.4. Se o atraso no pagamento for superior a 90 (noventa) dias, o contrato poderá ser rescindido pela CONTRATADA, mediante comunicação formal ao CONTRATANTE, sem prejuízo da cobrança do montante devido.

3. OBRIGAÇÕES DA CONTRATADA

3.1. Disponibilizar ao CONTRATANTE o conteúdo do curso conforme especificado.
3.2. Fornecer certificado de conclusão, desde que cumpridos os requisitos mínimos pelo CONTRATANTE.
3.3. Manter a plataforma de ensino funcionando adequadamente.

4. OBRIGAÇÕES DO CONTRATANTE

4.1. Efetuar os pagamentos nas datas acordadas.
4.2. Respeitar as normas da instituição de ensino.
4.3. Não reproduzir ou compartilhar o material didático sem autorização.

5. VIGÊNCIA E RESCISÃO

5.1. O presente contrato é firmado por tempo determinado, pelo período necessário para a conclusão do curso, tendo início na data de sua assinatura (${enrollmentDate}).

5.2. Em caso de desistência do CONTRATANTE, serão aplicáveis as seguintes regras:
a) Até 7 dias após a matrícula: reembolso integral, deduzidas as despesas administrativas;
b) Após 7 dias da matrícula: não haverá reembolso dos valores já pagos, e o CONTRATANTE deverá pagar multa equivalente a 20% do valor restante do contrato.

6. DISPOSIÇÕES GERAIS

6.1. O presente contrato representa o acordo integral entre as partes, substituindo quaisquer entendimentos ou acordos anteriores.

6.2. O presente contrato é regido pelas leis da República Federativa do Brasil.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento, em duas vias de igual teor e forma, na presença das testemunhas abaixo.

[Local e Data]

___________________________
CONTRATADA: ${tenant.name}

___________________________
CONTRATANTE: ${student.fullName}

___________________________
TESTEMUNHA 1

___________________________
TESTEMUNHA 2
`;
  }
  
  /**
   * Atualiza o status de um contrato
   */
  async updateContractStatus(contractId: number, status: string): Promise<void> {
    try {
      await storage.updateEducationalContractStatus(contractId, status);
      
      // Se o status for "signed", registrar a data de assinatura
      if (status === 'signed') {
        await storage.updateEducationalContractSignedDate(contractId, new Date());
      }
      
      console.log(`Status do contrato #${contractId} atualizado para ${status}`);
    } catch (error) {
      console.error('Erro ao atualizar status do contrato:', error);
      throw error;
    }
  }
  
  /**
   * Busca contratos por estudante
   */
  async getContractsByStudent(studentId: number): Promise<any[]> {
    try {
      return await storage.getEducationalContractsByStudent(studentId);
    } catch (error) {
      console.error('Erro ao buscar contratos por estudante:', error);
      return [];
    }
  }
  
  /**
   * Busca contratos por curso
   */
  async getContractsByCourse(courseId: number): Promise<any[]> {
    try {
      return await storage.getEducationalContractsByCourse(courseId);
    } catch (error) {
      console.error('Erro ao buscar contratos por curso:', error);
      return [];
    }
  }
  
  /**
   * Busca contratos por tenant
   */
  async getContractsByTenant(tenantId: number): Promise<any[]> {
    try {
      return await storage.getEducationalContractsByTenant(tenantId);
    } catch (error) {
      console.error('Erro ao buscar contratos por tenant:', error);
      return [];
    }
  }
}

export const contractService = new ContractService();