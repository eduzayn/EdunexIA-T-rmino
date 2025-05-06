import express from 'express';
import { z } from 'zod';
import { db } from './db';
import { storage } from './database-storage';
import { quizzes, questions } from '@shared/schema';
import { requireAuth } from './middleware/auth-middleware';
import { eq, and, desc } from 'drizzle-orm';
import type { Request, Response } from 'express';

const router = express.Router();

// Schema de validação para criar/atualizar um quiz
const quizSchema = z.object({
  moduleId: z.number().optional(),
  subjectId: z.number(),
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  description: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  timeLimit: z.number().min(5, { message: 'O tempo mínimo é de 5 minutos' }).max(180, { message: 'O tempo máximo é de 180 minutos' }),
  passingScore: z.number().min(1, { message: 'A pontuação mínima deve ser pelo menos 1%' }).max(100, { message: 'A pontuação máxima é 100%' }),
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
  allowRetake: z.boolean().default(true),
  maxAttempts: z.number().optional().nullable(),
  shuffleQuestions: z.boolean().default(false),
  showAnswers: z.boolean().default(true),
  quizType: z.enum(['practice', 'final']).default('practice'),
});

// Schema de validação para criar/atualizar uma questão
const questionSchema = z.object({
  quizId: z.number(),
  questionText: z.string().min(3, { message: 'A pergunta deve ter pelo menos 3 caracteres' }),
  questionType: z.enum(['multiple_choice', 'true_false']).default('multiple_choice'),
  options: z.array(z.object({
    text: z.string().min(1, { message: 'O texto da opção é obrigatório' }),
    isCorrect: z.boolean().default(false),
  })).min(2, { message: 'A questão deve ter pelo menos 2 opções' }),
  explanation: z.string().optional().nullable(),
  points: z.number().min(1, { message: 'A pontuação deve ser pelo menos 1' }).default(10),
  difficultyLevel: z.number().min(1, { message: 'A dificuldade deve ser entre 1 e 5' }).max(5, { message: 'A dificuldade deve ser entre 1 e 5' }).default(2),
  order: z.number().optional(),
}).refine((data) => {
  // Verificar se pelo menos uma opção está marcada como correta
  return data.options.some(option => option.isCorrect);
}, {
  message: 'Selecione pelo menos uma opção correta',
  path: ['options'],
});

// GET /api/quizzes - Listar todos os quizzes de uma disciplina
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { subjectId, quizType, moduleId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ error: 'É necessário fornecer o ID da disciplina' });
    }

    let query = db.select().from(quizzes);

    if (subjectId) {
      query = query.where(eq(quizzes.subjectId, Number(subjectId)));
    }

    if (moduleId) {
      query = query.where(eq(quizzes.moduleId, Number(moduleId)));
    }

    if (quizType) {
      query = query.where(eq(quizzes.quizType, String(quizType) as 'practice' | 'final'));
    }

    query = query.orderBy(desc(quizzes.updatedAt));

    const quizzesList = await query;

    // Para cada quiz, obter a contagem de questões
    const quizzesWithCounts = await Promise.all(
      quizzesList.map(async (quiz) => {
        const questionCount = await db
          .select({ count: db.fn.count() })
          .from(questions)
          .where(eq(questions.quizId, quiz.id));

        return {
          ...quiz,
          questionCount: Number(questionCount[0]?.count || 0),
        };
      })
    );

    return res.json(quizzesWithCounts);
  } catch (error) {
    console.error('Erro ao buscar quizzes:', error);
    return res.status(500).json({ error: 'Falha ao buscar quizzes' });
  }
});

// GET /api/quizzes/:id - Obter detalhes de um quiz específico
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.id);

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId));

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Buscar as questões associadas a este quiz
    const quizQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(questions.order);

    return res.json({
      ...quiz,
      questions: quizQuestions,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do quiz:', error);
    return res.status(500).json({ error: 'Falha ao buscar detalhes do quiz' });
  }
});

// POST /api/quizzes - Criar um novo quiz
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = quizSchema.parse(req.body);

    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(201).json(newQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Erro ao criar quiz:', error);
    return res.status(500).json({ error: 'Falha ao criar quiz' });
  }
});

// PUT /api/quizzes/:id - Atualizar um quiz existente
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.id);
    const validatedData = quizSchema.parse(req.body);

    const [updatedQuiz] = await db
      .update(quizzes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, quizId))
      .returning();

    if (!updatedQuiz) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    return res.json(updatedQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Erro ao atualizar quiz:', error);
    return res.status(500).json({ error: 'Falha ao atualizar quiz' });
  }
});

// DELETE /api/quizzes/:id - Excluir um quiz
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.id);

    // Primeiro excluir todas as questões associadas ao quiz
    await db
      .delete(questions)
      .where(eq(questions.quizId, quizId));

    // Depois excluir o quiz
    const [deletedQuiz] = await db
      .delete(quizzes)
      .where(eq(quizzes.id, quizId))
      .returning();

    if (!deletedQuiz) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    return res.json({ message: 'Quiz excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir quiz:', error);
    return res.status(500).json({ error: 'Falha ao excluir quiz' });
  }
});

// POST /api/quizzes/:quizId/questions - Adicionar uma questão a um quiz
router.post('/:quizId/questions', requireAuth, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.quizId);
    
    // Verificar se o quiz existe
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId));

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Validar dados da questão
    const validatedData = questionSchema.parse({
      ...req.body,
      quizId,
    });

    // Determinar a ordem da nova questão (próxima na sequência)
    const [{ count: questionCount }] = await db
      .select({ count: db.fn.count() })
      .from(questions)
      .where(eq(questions.quizId, quizId));

    const order = validatedData.order || Number(questionCount) + 1;

    // Criar a questão
    const [newQuestion] = await db
      .insert(questions)
      .values({
        quizId,
        questionText: validatedData.questionText,
        questionType: validatedData.questionType,
        options: validatedData.options,
        explanation: validatedData.explanation,
        points: validatedData.points,
        difficultyLevel: validatedData.difficultyLevel,
        order,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(201).json(newQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Erro ao criar questão:', error);
    return res.status(500).json({ error: 'Falha ao criar questão' });
  }
});

// PUT /api/quizzes/:quizId/questions/:questionId - Atualizar uma questão
router.put('/:quizId/questions/:questionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.quizId);
    const questionId = Number(req.params.questionId);

    // Validar dados da questão
    const validatedData = questionSchema.parse({
      ...req.body,
      quizId,
    });

    // Atualizar a questão
    const [updatedQuestion] = await db
      .update(questions)
      .set({
        questionText: validatedData.questionText,
        questionType: validatedData.questionType,
        options: validatedData.options,
        explanation: validatedData.explanation,
        points: validatedData.points,
        difficultyLevel: validatedData.difficultyLevel,
        order: validatedData.order || 0,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(questions.id, questionId),
          eq(questions.quizId, quizId)
        )
      )
      .returning();

    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    return res.json(updatedQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Erro ao atualizar questão:', error);
    return res.status(500).json({ error: 'Falha ao atualizar questão' });
  }
});

// DELETE /api/quizzes/:quizId/questions/:questionId - Excluir uma questão
router.delete('/:quizId/questions/:questionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.quizId);
    const questionId = Number(req.params.questionId);

    // Excluir a questão
    const [deletedQuestion] = await db
      .delete(questions)
      .where(
        and(
          eq(questions.id, questionId),
          eq(questions.quizId, quizId)
        )
      )
      .returning();

    if (!deletedQuestion) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    // Reordenar as questões restantes
    const remainingQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(questions.order);

    // Atualizar a ordem das questões restantes (se necessário)
    for (let i = 0; i < remainingQuestions.length; i++) {
      const question = remainingQuestions[i];
      if (question.order !== i + 1) {
        await db
          .update(questions)
          .set({ order: i + 1 })
          .where(eq(questions.id, question.id));
      }
    }

    return res.json({ message: 'Questão excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir questão:', error);
    return res.status(500).json({ error: 'Falha ao excluir questão' });
  }
});

export default router;