import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User.js'

const router = express.Router()

// Middleware de validação simples
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }
  next()
}

// Middleware de Autenticação (JWT)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.status(401).json({ success: false, error: 'Acesso negado' })

  jwt.verify(token, process.env.JWT_SECRET || 'salon-booking-secret', (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Token inválido' })
    req.user = user
    next()
  })
}

// LOGIN SEGURO
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').exists().withMessage('Senha obrigatória')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Procura o utilizador e pede explicitamente a password (+password)
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' })
    }

    // Atualiza último login
    user.lastLogin = new Date()
    await user.save()

    // Gera o Token de Sessão
    const token = jwt.sign(
      { userId: user._id, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET || 'salon-booking-secret',
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId }
      }
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ success: false, error: 'Erro de servidor' })
  }
})

// Verificar Sessão (Me)
router.get('/me', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.userId)
  if (!user) return res.status(404).json({ success: false, error: 'Utilizador não encontrado' })
  
  res.json({
    success: true,
    data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } }
  })
})

export default router