import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { TenantService } from './models/TenantService.js'
import { User } from './models/User.js'

dotenv.config()

const seed = async () => {
  try {
    console.log('🔌 A conectar à Base de Dados...')
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-booking')
    
    const tenantId = 'barbeariaj'
    console.log(`💈 A configurar Barbearia J (${tenantId})...`)

    // 1. Criar Admin (mantém o mesmo login)
    await User.deleteOne({ email: 'j@barbeariaj.pt' })
    await User.create({
      tenantId,
      name: 'João Admin',
      email: 'j@barbeariaj.pt',
      password: 'password123',
      role: 'admin'
    })

    // 2. Limpar serviços antigos
    await TenantService.deleteMany({ tenantId })

    // 3. Criar Serviços EXATOS da print
    const services = [
      { name: "Corte Barbeiro", price: 13.00, duration: 30, category: "Cabelo" },
      { name: "Corte Expresso", price: 9.00, duration: 10, category: "Cabelo" },
      { name: "Corte Criança até 8 anos", description: "(degrade não incluído)", price: 12.00, duration: 30, category: "Criança" },
      { name: "Barba", price: 8.00, duration: 15, category: "Barba" },
      { name: "Corte Expresso (1 pente) + Barba", price: 17.00, duration: 30, category: "Combo" },
      { name: "Corte Barbeiro + Barba", price: 21.00, duration: 60, category: "Combo" },
      { name: "Corte Barbeiro + Tratamento de Pele", price: 22.00, duration: 60, category: "Tratamento" },
      { name: "Corte + Barba + Tratamento de Pele", price: 28.00, duration: 90, category: "VIP" }
    ]

    for (const s of services) {
      await TenantService.create({
        tenantId,
        ...s,
        active: true
      })
    }
    
    console.log(`✅ ${services.length} serviços premium criados com sucesso.`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

seed()