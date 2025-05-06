import express from 'express';
import { z } from 'zod';
import { db } from './db';
import { questions, quizzes, insertQuestionSchema } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated } from './middleware/auth-middleware';
import { isAdmin } from './middleware/role-middleware';

const router = express.Router();

// Listar todas as questões de um quiz
router.get('/quizzes/:quizId/questions', isAuthenticated, async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Verificar se o quiz existe
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, parseInt(quizId)),
    });
    
    if (!quiz) {
      return res.status(404).json({ error: 'Simulado/avaliação não encontrado' });
    }
    
    // Buscar questões do quiz
    const quizQuestions = await db.query.questions.findMany({
      where: eq(questions.quizId, parseInt(quizId)),
      orderBy: questions.order,
    });
    
    res.json(quizQuestions);
  } catch (error) {
    console.error('Erro ao listar questões:', error);
    res.status(500).json({ error: 'Erro ao listar questões' });
  }
});

// Buscar uma questão específica
router.get('/quizzes/:quizId/questions/:questionId', isAuthenticated, async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    
    const question = await db.query.questions.findFirst({
      where: and(
        eq(questions.id, parseInt(questionId)),
        eq(questions.quizId, parseInt(quizId))
      ),
    });
    
    if (!question) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Erro ao buscar questão:', error);
    res.status(500).json({ error: 'Erro ao buscar questão' });
  }
});

// Criar uma nova questão
router.post('/quizzes/:quizId/questions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Verificar se o quiz existe
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, parseInt(quizId)),
    });
    
    if (!quiz) {
      return res.status(404).json({ error: 'Simulado/avaliação não encontrado' });
    }
    
    // Validar os dados da questão
    const questionData = {
      ...req.body,
      quizId: parseInt(quizId),
    };
    
    // Definir ordem da questão
    // Se não for informada, pegar a maior ordem existente + 1 ou 1 se for a primeira
    if (!questionData.order) {
      const lastQuestion = await db.query.questions.findFirst({
        where: eq(questions.quizId, parseInt(quizId)),
        orderBy: [{ field: questions.order, direction: 'desc' }],
      });
      
      questionData.order = lastQuestion ? lastQuestion.order + 1 : 1;
    }
    
    // Validar dados com zod
    const validatedData = insertQuestionSchema.parse(questionData);
    
    // Inserir a questão
    const [newQuestion] = await db.insert(questions).values(validatedData).returning();
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Erro ao criar questão:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.format() });
    }
    res.status(500).json({ error: 'Erro ao criar questão' });
  }
});

// Atualizar uma questão existente
router.put('/quizzes/:quizId/questions/:questionId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    
    // Verificar se a questão existe
    const existingQuestion = await db.query.questions.findFirst({
      where: and(
        eq(questions.id, parseInt(questionId)),
        eq(questions.quizId, parseInt(quizId))
      ),
    });
    
    if (!existingQuestion) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }
    
    // Validar os dados atualizados
    const questionData = {
      ...req.body,
      id: parseInt(questionId),
      quizId: parseInt(quizId),
    };
    
    // Atualizar a questão
    const [updatedQuestion] = await db
      .update(questions)
      .set(questionData)
      .where(eq(questions.id, parseInt(questionId)))
      .returning();
    
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Erro ao atualizar questão:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.format() });
    }
    res.status(500).json({ error: 'Erro ao atualizar questão' });
  }
});

// Excluir uma questão
router.delete('/quizzes/:quizId/questions/:questionId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    
    // Verificar se a questão existe
    const existingQuestion = await db.query.questions.findFirst({
      where: and(
        eq(questions.id, parseInt(questionId)),
        eq(questions.quizId, parseInt(quizId))
      ),
    });
    
    if (!existingQuestion) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }
    
    // Excluir a questão
    await db
      .delete(questions)
      .where(eq(questions.id, parseInt(questionId)));
    
    // Reordenar as questões restantes
    const remainingQuestions = await db.query.questions.findMany({
      where: eq(questions.quizId, parseInt(quizId)),
      orderBy: questions.order,
    });
    
    // Atualizar as ordens
    for (let i = 0; i < remainingQuestions.length; i++) {
      await db
        .update(questions)
        .set({ order: i + 1 })
        .where(eq(questions.id, remainingQuestions[i].id));
    }
    
    res.json({ success: true, message: 'Questão excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir questão:', error);
    res.status(500).json({ error: 'Erro ao excluir questão' });
  }
});

export default router;