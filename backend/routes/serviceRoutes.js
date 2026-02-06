import express from 'express'
import { TenantService } from '../models/TenantService.js'

const router = express.Router()

// =========================================================
// DADOS PARA SEED (AGORA COM CATEGORIAS)
// =========================================================
const SEED_CONFIG = {
  'barbeariajc': [
    { name: "Corte Barbeiro", duration: 30, price: 13.00, category: "Cabelo" },
    { name: "Corte Expresso", duration: 10, price: 9.00, category: "Cabelo" },
    { name: "Corte Criança até 8 anos", duration: 30, price: 12.00, description: "(degrade não incluído)", category: "Criança" },
    { name: "Barba", duration: 15, price: 8.00, category: "Barba" },
    { name: "Corte Expresso (1 pente) + Barba", duration: 30, price: 17.00, category: "Combo" },
    { name: "Corte Barbeiro + Barba", duration: 60, price: 21.00, category: "Combo" },
    { name: "Corte Barbeiro + Tratamento de Pele", duration: 60, price: 22.00, category: "Tratamento" },
    { name: "Corte Barbeiro + Barba + Tratamento de Pele", duration: 90, price: 28.00, category: "VIP" }
  ],
  'barbeariajcamacha': [
    { name: "Corte Barbeiro", duration: 30, price: 13.00, category: "Cabelo" },
    { name: "Corte Criança até 8 anos", duration: 30, price: 12.00, description: "(degrade não incluído)", category: "Criança" },
    { name: "Corte Expresso", duration: 10, price: 9.00, category: "Cabelo" },
    { name: "Corte Barbeiro + Barba", duration: 60, price: 21.00, category: "Combo" },
    { name: "Corte Expresso + Barba", duration: 30, price: 17.00, category: "Combo" },
    { name: "Barba", duration: 15, price: 8.00, category: "Barba" },
    { name: "Extras", duration: 5, price: 2.00, category: "Outros" }
  ],
  'default': [
    { name: "Corte Clássico", duration: 30, price: 15.00, category: "Cabelo" },
    { name: "Barba", duration: 20, price: 10.00, category: "Barba" }
  ]
}

// =========================================================
// ROTA DE SEED (POST)
// =========================================================
router.post('/seed', async (req, res) => {
  try {
    const { secret } = req.query
    const tenantId = req.tenantId 

    // Validação de segurança simples
    if (secret !== process.env.ADMIN_SEED_SECRET && secret !== 'temp_secret_key' && secret !== 'barbeariajc') {
      return res.status(403).json({ success: false, message: 'Secret inválido.' })
    }

    const rawServices = SEED_CONFIG[tenantId] || SEED_CONFIG['default']
    
    const finalServices = rawServices.map(service => ({
      tenantId,
      active: true,
      ...service
    }))

    await TenantService.deleteMany({ tenantId })
    const created = await TenantService.insertMany(finalServices)

    res.json({ success: true, message: `✅ ${created.length} serviços criados para ${tenantId}` })
  } catch (error) {
    console.error("Erro Seed:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// =========================================================
// CRUD SERVIÇOS
// =========================================================

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const services = await TenantService.find({ 
      tenantId: req.tenantId, 
      active: true 
    }).sort({ price: 1 })
    
    res.json({ success: true, data: services })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/services (Criar um serviço manualmente)
router.post('/', async (req, res) => {
  try {
    const newService = await TenantService.create({
      ...req.body,
      tenantId: req.tenantId
    })
    res.status(201).json({ success: true, data: newService })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await TenantService.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { active: false }, // Soft delete
      { new: true }
    )
    if (!deleted) return res.status(404).json({ success: false, message: 'Serviço não encontrado' })
    res.json({ success: true, message: 'Serviço removido' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router