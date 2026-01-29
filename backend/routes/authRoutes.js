import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// Simulação de usuários admin
const adminUsers = new Map()

// === ADICIONAR UTILIZADOR PADRÃO ===
// Cria um admin: admin@admin.com / senha: 123456
const createDefaultUser = () => {
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync('123456', salt)
  const defaultKey = 'bella-vista:admin@admin.com'
  
  adminUsers.set(defaultKey, {
    id: 'admin-default',
    email: 'admin@admin.com',
    name: 'Admin Local',
    password: hash,
    tenantId: 'bella-vista',
    role: 'admin',
    createdAt: new Date()
  })
  console.log('👤 Utilizador Admin criado: admin@admin.com / 123456')
}
createDefaultUser()
// ===================================

// Middleware para validar erros
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }
  next()
}

// Middleware para verificar token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso necessário'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'salon-booking-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido'
      })
    }
    
    req.user = user
    next()
  })
}

// POST /api/auth/login - Login do admin
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email válido é obrigatório'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body
    const tenantId = req.tenant.subdomain
    
    // Buscar usuário na memória
    const userKey = `${tenantId}:${email}`
    const user = adminUsers.get(userKey)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      })
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      })
    }
    
    // Gerar token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        tenantId, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'salon-booking-secret',
      { expiresIn: '24h' }
    )
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId
        },
        token
      },
      message: 'Login realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// GET /api/auth/me - Verificar usuário atual
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  })
})

export default router