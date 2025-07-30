import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

// 1.1 GET /api/v1/beneficiaries - Получить список бенефициаров
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const options = {
      skip: Number(offset),
      take: Number(limit),
      relations: ['addresses', 'documents']
    };

    const [beneficiaries, total] = await services.beneficiaryService.findAndCount(options);
    
    res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: beneficiaries.length,
      total,
      results: beneficiaries
    });
  } catch (error) {
    console.error('Error getting beneficiaries:', error);
    res.status(500).json({
      error: 'Failed to get beneficiaries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.2 POST /api/v1/beneficiaries - Создать нового бенефициара
router.post('/', async (req: Request, res: Response) => {
  try {
    const beneficiaryData = req.body;
    
    const beneficiary = await services.beneficiaryService.createBeneficiary(beneficiaryData);
    
    res.status(201).json(beneficiary);
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    res.status(400).json({
      error: 'Failed to create beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.3 GET /api/v1/beneficiaries/{beneficiaryId}/bank-details - Получить банковские реквизиты бенефициара
router.get('/:beneficiaryId/bank-details', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const [bankDetails, total] = await services.bankDetailsService.findByBeneficiaryId(
      beneficiaryId, 
      Number(limit), 
      Number(offset)
    );
    
    res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: bankDetails.length,
      total,
      results: bankDetails
    });
  } catch (error) {
    console.error('Error getting bank details:', error);
    res.status(500).json({
      error: 'Failed to get bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.4 POST /api/v1/beneficiaries/{beneficiaryId}/bank-details - Создать банковские реквизиты
router.post('/:beneficiaryId/bank-details', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const bankDetailsData = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    const bankDetails = await services.bankDetailsService.createBankDetails(
      beneficiaryId, 
      bankDetailsData, 
      idempotencyKey
    );
    
    return res.status(201).json(bankDetails);
  } catch (error) {
    console.error('Error creating bank details:', error);
    return res.status(400).json({
      error: 'Failed to create bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.5 POST /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}/set-default - Установить как дефолтные
router.post('/:beneficiaryId/bank-details/:bankDetailsId/set-default', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId, bankDetailsId } = req.params;
    
    const success = await services.bankDetailsService.setDefault(beneficiaryId, bankDetailsId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Bank details not found'
      });
    }
    
    return res.status(200).send();
  } catch (error) {
    console.error('Error setting default bank details:', error);
    return res.status(500).json({
      error: 'Failed to set default bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.6 POST /api/v1/beneficiaries/{beneficiaryId}/add-card-requests - Создать запрос на добавление карты
router.post('/:beneficiaryId/add-card-requests', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const { terminalKey } = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    const addCardRequest = await services.bankDetailsService.createAddCardRequest(
      beneficiaryId, 
      terminalKey, 
      idempotencyKey
    );
    
    return res.status(201).json(addCardRequest);
  } catch (error) {
    console.error('Error creating add card request:', error);
    return res.status(400).json({
      error: 'Failed to create add card request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.7 GET /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId} - Получить банковские реквизиты по ID
router.get('/:beneficiaryId/bank-details/:bankDetailsId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId, bankDetailsId } = req.params;
    
    const bankDetails = await services.bankDetailsService.findByIdWithBeneficiary(bankDetailsId, beneficiaryId);
    
    if (!bankDetails) {
      return res.status(404).json({
        error: 'Bank details not found'
      });
    }
    
    return res.json(bankDetails);
  } catch (error) {
    console.error('Error getting bank details:', error);
    return res.status(500).json({
      error: 'Failed to get bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.8 PUT /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId} - Обновить банковские реквизиты
router.put('/:beneficiaryId/bank-details/:bankDetailsId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId, bankDetailsId } = req.params;
    const updateData = req.body;
    
    const bankDetails = await services.bankDetailsService.updateBankDetailsWithBeneficiary(
      bankDetailsId, 
      beneficiaryId, 
      updateData
    );
    
    if (!bankDetails) {
      return res.status(404).json({
        error: 'Bank details not found'
      });
    }
    
    return res.json(bankDetails);
  } catch (error) {
    console.error('Error updating bank details:', error);
    return res.status(400).json({
      error: 'Failed to update bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.9 DELETE /api/v1/nominal-accounts/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId} - Удалить банковские реквизиты
router.delete('/:beneficiaryId/bank-details/:bankDetailsId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId, bankDetailsId } = req.params;
    
    const success = await services.bankDetailsService.deleteBankDetailsWithBeneficiary(bankDetailsId, beneficiaryId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Bank details not found'
      });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting bank details:', error);
    return res.status(500).json({
      error: 'Failed to delete bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 1.10 GET /api/v1/beneficiaries/{beneficiaryId} - Получить бенефициара по ID
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

// 1.11 PUT /api/v1/beneficiaries/{beneficiaryId} - Обновить бенефициара
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

export default router; 