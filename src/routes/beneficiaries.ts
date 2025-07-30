import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

/**
 * GET /api/v1/beneficiaries
 * Получение списка бенефициаров с пагинацией
 * 
 * @param {number} req.query.offset - Смещение (по умолчанию: 0)
 * @param {number} req.query.limit - Лимит записей (по умолчанию: 50)
 * 
 * @returns {Object} 200 - Список бенефициаров с метаданными пагинации
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { offset = 0, limit = 50 } = req.query;
    
    const beneficiaries = await services.beneficiaryService.findAll();
    
    // Применение пагинации на уровне приложения
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedBeneficiaries = beneficiaries.slice(startIndex, endIndex);
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: paginatedBeneficiaries.length,
      total: beneficiaries.length,
      results: paginatedBeneficiaries
    });
  } catch (error) {
    console.error('Error getting beneficiaries:', error);
    return res.status(500).json({
      error: 'Failed to get beneficiaries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/beneficiaries
 * Создание нового бенефициара
 * 
 * @param {string} req.headers['idempotency-key'] - Ключ идемпотентности (обязательный)
 * @param {Object} req.body - Данные бенефициара
 * @param {string} req.body.name - Имя бенефициара
 * @param {string} req.body.type - Тип бенефициара
 * @param {string} req.body.inn - ИНН
 * @param {string} req.body.kpp - КПП
 * @param {string} req.body.ogrn - ОГРН
 * @param {string} req.body.ogrnip - ОГРНИП
 * 
 * @returns {Object} 201 - Созданный бенефициар
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const beneficiaryData = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    if (!beneficiaryData.name || !beneficiaryData.type) {
      return res.status(400).json({
        error: 'name and type are required'
      });
    }
    
    const beneficiary = await services.beneficiaryService.createBeneficiary(beneficiaryData);
    
    return res.status(201).json(beneficiary);
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    return res.status(400).json({
      error: 'Failed to create beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/beneficiaries/{beneficiaryId}
 * Получение бенефициара по идентификатору
 * 
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * 
 * @returns {Object} 200 - Данные бенефициара
 * @returns {Object} 404 - Бенефициар не найден
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    
    const beneficiary = await services.beneficiaryService.findById(beneficiaryId);
    
    if (!beneficiary) {
      return res.status(404).json({
        error: 'Beneficiary not found'
      });
    }

    return res.json(beneficiary);
  } catch (error) {
    console.error('Error getting beneficiary:', error);
    return res.status(500).json({
      error: 'Failed to get beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/beneficiaries/{beneficiaryId}
 * Обновление данных бенефициара
 * 
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * @param {Object} req.body - Данные для обновления
 * 
 * @returns {Object} 200 - Обновленный бенефициар
 * @returns {Object} 404 - Бенефициар не найден
 * @returns {Object} 400 - Ошибка валидации
 */
router.put('/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    const updateData = req.body;
    
    const beneficiary = await services.beneficiaryService.updateBeneficiary(beneficiaryId, updateData);
    
    if (!beneficiary) {
      return res.status(404).json({
        error: 'Beneficiary not found'
      });
    }

    return res.json(beneficiary);
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    return res.status(400).json({
      error: 'Failed to update beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/beneficiaries/{beneficiaryId}
 * Удаление бенефициара
 * 
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * 
 * @returns {Object} 204 - Бенефициар успешно удален
 * @returns {Object} 404 - Бенефициар не найден
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.delete('/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    
    const success = await services.beneficiaryService.deleteBeneficiary(beneficiaryId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Beneficiary not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    return res.status(400).json({
      error: 'Failed to delete beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/beneficiaries/{beneficiaryId}/bank-details
 * Получение банковских реквизитов бенефициара
 * 
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * 
 * @returns {Object} 200 - Список банковских реквизитов
 * @returns {Object} 404 - Бенефициар не найден
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:beneficiaryId/bank-details', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    
    const bankDetails = await services.bankDetailsService.getBankDetailsByBeneficiary(beneficiaryId);
    
    return res.json(bankDetails);
  } catch (error) {
    console.error('Error getting bank details:', error);
    return res.status(500).json({
      error: 'Failed to get bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/beneficiaries/{beneficiaryId}/bank-details
 * Создание банковских реквизитов для бенефициара
 * 
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * @param {Object} req.body - Данные банковских реквизитов
 * 
 * @returns {Object} 201 - Созданные банковские реквизиты
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/:beneficiaryId/bank-details', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    const bankDetailsData = req.body;
    
    const bankDetails = await services.bankDetailsService.createBankDetails(beneficiaryId, bankDetailsData);
    
    return res.status(201).json(bankDetails);
  } catch (error) {
    console.error('Error creating bank details:', error);
    return res.status(400).json({
      error: 'Failed to create bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}/set-default
 * Установка банковских реквизитов по умолчанию
 * 
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * @param {string} req.params.bankDetailsId - Идентификатор банковских реквизитов
 * 
 * @returns {Object} 200 - Банковские реквизиты установлены по умолчанию
 * @returns {Object} 404 - Банковские реквизиты не найдены
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/:beneficiaryId/bank-details/:bankDetailsId/set-default', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId, bankDetailsId } = req.params;
    
    const bankDetails = await services.bankDetailsService.setDefaultBankDetails(beneficiaryId, bankDetailsId);
    
    if (!bankDetails) {
      return res.status(404).json({
        error: 'Bank details not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error setting default bank details:', error);
    return res.status(400).json({
      error: 'Failed to set default bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}/delete
 * Удаление банковских реквизитов
 * 
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * @param {string} req.params.bankDetailsId - Идентификатор банковских реквизитов
 * 
 * @returns {Object} 204 - Банковские реквизиты успешно удалены
 * @returns {Object} 404 - Банковские реквизиты не найдены
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.post('/:beneficiaryId/bank-details/:bankDetailsId/delete', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId, bankDetailsId } = req.params;
    
    const success = await services.bankDetailsService.deleteBankDetails(beneficiaryId, bankDetailsId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Bank details not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting bank details:', error);
    return res.status(400).json({
      error: 'Failed to delete bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 