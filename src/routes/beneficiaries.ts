import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

// GET /api/v1/beneficiaries - Получить список бенефициаров
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const options = {
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where: {} as any
    };

    if (status) options.where.status = status;
    if (type) options.where.type = type;

    const beneficiaries = await services.beneficiaryService.findAll(options);
    
    res.json({
      message: 'Beneficiaries retrieved successfully',
      data: beneficiaries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: beneficiaries.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting beneficiaries:', error);
    res.status(500).json({
      error: 'Failed to get beneficiaries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/beneficiaries/:id - Получить бенефициара по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beneficiaryId = parseInt(id);
    
    if (isNaN(beneficiaryId)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const beneficiary = await services.beneficiaryService.findById(beneficiaryId);
    
    if (!beneficiary) {
      return res.status(404).json({
        error: 'Beneficiary not found',
        message: `Beneficiary with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Beneficiary retrieved successfully',
      data: beneficiary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting beneficiary:', error);
    return res.status(500).json({
      error: 'Failed to get beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/beneficiaries - Создать нового бенефициара
router.post('/', async (req: Request, res: Response) => {
  try {
    const beneficiaryData = req.body;
    
    const beneficiary = await services.beneficiaryService.createBeneficiary(beneficiaryData);
    
    res.status(201).json({
      message: 'Beneficiary created successfully',
      data: beneficiary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    res.status(400).json({
      error: 'Failed to create beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/beneficiaries/:id - Обновить бенефициара
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beneficiaryId = parseInt(id);
    const updateData = req.body;
    
    if (isNaN(beneficiaryId)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const beneficiary = await services.beneficiaryService.updateBeneficiary(beneficiaryId, updateData);
    
    if (!beneficiary) {
      return res.status(404).json({
        error: 'Beneficiary not found',
        message: `Beneficiary with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Beneficiary updated successfully',
      data: beneficiary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    return res.status(400).json({
      error: 'Failed to update beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/beneficiaries/:id - Удалить бенефициара
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beneficiaryId = parseInt(id);
    
    if (isNaN(beneficiaryId)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const deleted = await services.beneficiaryService.deleteBeneficiary(beneficiaryId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Beneficiary not found',
        message: `Beneficiary with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Beneficiary deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    return res.status(500).json({
      error: 'Failed to delete beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/beneficiaries/:id/addresses - Получить адреса бенефициара
router.get('/:id/addresses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beneficiaryId = parseInt(id);
    
    if (isNaN(beneficiaryId)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const addresses = await services.beneficiaryService.getAddresses(beneficiaryId);
    
    return res.json({
      message: 'Addresses retrieved successfully',
      data: addresses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting addresses:', error);
    return res.status(500).json({
      error: 'Failed to get addresses',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/beneficiaries/:id/addresses - Добавить адрес бенефициару
router.post('/:id/addresses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beneficiaryId = parseInt(id);
    const addressData = req.body;
    
    if (isNaN(beneficiaryId)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const address = await services.beneficiaryService.addAddress(beneficiaryId, addressData);
    
    return res.status(201).json({
      message: 'Address added successfully',
      data: address,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding address:', error);
    return res.status(400).json({
      error: 'Failed to add address',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/beneficiaries/:id/documents - Получить документы бенефициара
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beneficiaryId = parseInt(id);
    
    if (isNaN(beneficiaryId)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const documents = await services.beneficiaryService.getDocuments(beneficiaryId);
    
    return res.json({
      message: 'Documents retrieved successfully',
      data: documents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    return res.status(500).json({
      error: 'Failed to get documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/beneficiaries/:id/documents - Добавить документ бенефициару
router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beneficiaryId = parseInt(id);
    const documentData = req.body;
    
    if (isNaN(beneficiaryId)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const document = await services.beneficiaryService.addDocument(beneficiaryId, documentData);
    
    return res.status(201).json({
      message: 'Document added successfully',
      data: document,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding document:', error);
    return res.status(400).json({
      error: 'Failed to add document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 