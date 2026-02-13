import express from 'express'
import { TenantStaff } from '../models/TenantStaff.js'
import { tenantDetectionMiddleware } from '../middleware/tenantDetection.js'

const router = express.Router()
router.use(tenantDetectionMiddleware)

router.get('/', async (req, res) => {
  try {
    // Retorna todos os barbeiros ativos da loja
    const staff = await TenantStaff.find({ tenantId: req.tenantId, active: true })
    res.json({ success: true, data: staff })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router