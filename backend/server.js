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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Conectar ao MongoDB
connectDB()

// Middleware de segurança
app.use(helmet())
app.use(compression())
app.use(morgan('combined'))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Muitas tentativas. Tente novamente em 15 minutos.'
})
app.use(limiter)

// CORS
app.use(cors({
  origin: true, 
  credentials: true
}))

// Body parsing (ESSENCIAL PARA LER O TOKEN)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// --- ROTAS ---

app.use('/api/auth', authRoutes)

// Aplicamos o middleware de tenant manualmente APENAS onde é obrigatório:
app.use('/api/tenants', tenantDetectionMiddleware, tenantRoutes)
app.use('/api/services', tenantDetectionMiddleware, serviceRoutes)

// 🚨 AQUI ESTÁ A CORREÇÃO:
// Não colocamos o middleware aqui. O ficheiro appointmentRoutes.js gere o seu próprio middleware.
// Isto permite que a rota /verify seja pública!
app.use('/api/appointments', appointmentRoutes)

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  })
})

// Middleware de tratamento de erros
app.use(errorHandler)

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
})

export default app