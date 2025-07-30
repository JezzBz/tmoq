import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

/**
 * GET /api/v1/nominal-accounts
 * Получение списка номинальных счетов с пагинацией
 * 
 * @param {number} req.query.offset - Смещение (по умолчанию: 0)
 * @param {number} req.query.limit - Лимит записей (по умолчанию: 50)
 * 
 * @returns {Object} 200 - Список номинальных счетов с метаданными пагинации
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { offset = 0, limit = 50 } = req.query;
    
    // Получение всех сделок с номерами счетов
    const deals = await services.dealService.findAll();
    const nominalAccounts = deals.filter(deal => deal.accountNumber);
    
    // Применение пагинации на уровне приложения
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedAccounts = nominalAccounts.slice(startIndex, endIndex);
    
    // Форматирование ответа
    const formattedAccounts = paginatedAccounts.map(deal => ({
      accountNumber: deal.accountNumber,
      status: deal.status,
      createdAt: deal.createdAt
    }));
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: formattedAccounts.length,
      total: nominalAccounts.length,
      results: formattedAccounts
    });
  } catch (error) {
    console.error('Error getting nominal accounts:', error);
    return res.status(500).json({
      error: 'Failed to get nominal accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/nominal-accounts/{accountNumber}
 * Получение информации о номинальном счете
 * 
 * @param {string} req.params.accountNumber - Номер номинального счета
 * 
 * @returns {Object} 200 - Данные номинального счета
 * @returns {Object} 404 - Номинальный счет не найден
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:accountNumber', async (req: Request, res: Response) => {
  try {
    const { accountNumber } = req.params;
    
    // Валидация формата номера счета
    if (!/^\d{20}$|^\d{22}$/.test(accountNumber)) {
      return res.status(400).json({
        error: 'Invalid account number format',
        message: 'Account number must be 20 or 22 digits'
      });
    }
    
    // Поиск сделки по номеру счета
    const deals = await services.dealService.findAll();
    const deal = deals.find(d => d.accountNumber === accountNumber);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Nominal account not found'
      });
    }

    // Форматирование ответа
    return res.json({
      accountNumber: deal.accountNumber,
      status: deal.status,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt
    });
  } catch (error) {
    console.error('Error getting nominal account:', error);
    return res.status(500).json({
      error: 'Failed to get nominal account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 