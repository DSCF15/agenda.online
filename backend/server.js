import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { connectDB } from './config/database.js'
import { tenantDetectionMiddleware } from './middleware/tenantDetection.js'
import { errorHandler } from './middleware/errorHandler.js'

// Importar rotas
import tenantRoutes from './routes/tenantRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import authRoutes from './routes/authRoutes.js'
import staffRoutes from './routes/staffRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

connectDB()

app.use(helmet())
app.use(compression())
app.use(morgan('combined'))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Muitas tentativas. Tente novamente em 15 minutos.'
})
app.use(limiter)

// CORS (Permite frontend)
app.use(cors({
  origin: true, 
  credentials: true
}))

// JSON Parsing (Obrigatório para ler o token)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// --- AQUI ESTÁ A CORREÇÃO CRÍTICA ---
// Removemos o "app.use(tenantDetectionMiddleware)" global daqui!

// Rotas Públicas (Auth não precisa de tenant)
app.use('/api/auth', authRoutes)

app.use('/api/analytics', analyticsRoutes)

// Rotas Protegidas (Aplicamos o middleware manualmente nestas)
app.use('/api/tenants', tenantDetectionMiddleware, tenantRoutes)
app.use('/api/services', tenantDetectionMiddleware, serviceRoutes)

// Rotas Híbridas (O appointmentRoutes gere o seu próprio middleware internamente)
// Isto permite que o /verify funcione sem bloqueios!
app.use('/api/appointments', appointmentRoutes)

app.use('/api/staff', staffRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})

export default app