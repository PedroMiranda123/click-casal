'use strict';

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/authenticate');

const prisma = new PrismaClient();

// GET /api/maintenance/tasks
// Retorna todas as tarefas ativas com o último log de cada uma
router.get('/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await prisma.maintenanceTask.findMany({
      where: { isActive: true },
      orderBy: [{ frequency: 'asc' }, { order: 'asc' }],
      include: {
        logs: {
          orderBy: { doneAt: 'desc' },
          take: 1,
          include: { doneBy: { select: { id: true, name: true } } },
        },
      },
    });
    res.json(tasks);
  } catch (err) {
    console.error('[maintenance] GET /tasks error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/maintenance/tasks/:id/log
// Registra que a tarefa foi concluída pelo usuário autenticado
router.post('/tasks/:id/log', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const task = await prisma.maintenanceTask.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const log = await prisma.maintenanceLog.create({
      data: { taskId: id, doneById: req.user.id },
      include: { doneBy: { select: { id: true, name: true } } },
    });
    res.status(201).json(log);
  } catch (err) {
    console.error('[maintenance] POST /tasks/:id/log error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
