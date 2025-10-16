
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// Simulação de usuários admin (em produção, usar banco de dados)
const adminUsers = new Map()

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

// POST /api/auth/register - Registrar admin do tenant
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Email válido é obrigatório'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').notEmpty().withMessage('Nome é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password, name } = req.body
    const tenantId = req.tenant.subdomain
    
    // Verificar se já existe admin para este tenant
    const userKey = `${tenantId}:${email}`
    if (adminUsers.has(userKey)) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já existe'
      })
    }
    
    // Hash da senha
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Criar usuário
    const user = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      tenantId,
      role: 'admin',
      createdAt: new Date()
    }
    
    adminUsers.set(userKey, user)
    
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
    
    res.status(201).json({
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
      message: 'Usuário criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// POST /api/auth/login - Login do admin
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email válido é obrigatório'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body
    const tenantId = req.tenant.subdomain
    
    // Buscar usuário
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

// POST /api/auth/logout - Logout (invalidar token no frontend)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  })
})

export default router
