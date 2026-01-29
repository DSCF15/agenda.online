import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { TenantService } from './models/TenantService.js'
import { User } from './models/User.js'
import { Tenant } from './models/Tenant.js'

dotenv.config()

const seed = async () => {
  try {
    console.log('🔌 A conectar à Base de Dados...')
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-booking')
    
    const tenantId = 'barbeariajc' 
    console.log(`💈 A configurar a Barbearia: ${tenantId}...`)

    // 1. CRIAR A IDENTIDADE DA BARBEARIA (COMPLETA)
    await Tenant.deleteOne({ subdomain: tenantId }) 
    
    await Tenant.create({
      name: 'Barbearia J Caniço',
      subdomain: tenantId,
      email: 'jc@barbearia.pt',
      active: true,
      colors: { primary: '#EAB308', secondary: '#000000' },
      
      // --- CAMPOS OBRIGATÓRIOS QUE FALTAVAM ---
      businessName: 'Barbearia J Caniço Lda',
      businessEmail: 'geral@barbeariajc.pt',
      businessPhone: '912345678',
      businessAddress: {
        street: 'Rua do Caniço, 123',
        city: 'Caniço',
        state: 'Madeira',
        zipCode: '9125-000'
      },
      // Configuração de horário (importante para o calendário funcionar bem)
      workingHours: {
        monday: { isOpen: true, open: '09:00', close: '19:00' },
        tuesday: { isOpen: true, open: '09:00', close: '19:00' },
        wednesday: { isOpen: true, open: '09:00', close: '19:00' },
        thursday: { isOpen: true, open: '09:00', close: '19:00' },
        friday: { isOpen: true, open: '09:00', close: '19:00' },
        saturday: { isOpen: true, open: '09:00', close: '18:00' },
        sunday: { isOpen: false, open: '09:00', close: '18:00' }
      }
    })
    console.log('✅ Identidade (Tenant) criada com todos os campos.')

    // 2. Criar Admin
    await User.deleteOne({ email: 'jc@barbearia.pt' })
    await User.create({
      tenantId,
      name: 'Admin Caniço',
      email: 'jc@barbearia.pt',
      password: 'password123',
      role: 'admin'
    })
    console.log('✅ Admin criado.')

    // 3. Criar Serviços
    await TenantService.deleteMany({ tenantId })
    const services = [
      { name: "Corte Barbeiro", price: 13.00, duration: 30, category: "Cabelo" },
      { name: "Corte Expresso", price: 9.00, duration: 10, category: "Cabelo" },
      { name: "Corte Criança até 8 anos", description: "(degrade não incluído)", price: 12.00, duration: 30, category: "Criança" },
      { name: "Barba", price: 8.00, duration: 15, category: "Barba" },
      { name: "Corte Expresso (1 pente) + Barba", price: 17.00, duration: 30, category: "Combo" },
      { name: "Corte Barbeiro + Barba", price: 21.00, duration: 60, category: "Combo" },
      { name: "Corte Barbeiro + Tratamento de Pele", price: 22.00, duration: 60, category: "Tratamento" },
      { name: "Corte Barbeiro + Barba + Tratamento de Pele", price: 28.00, duration: 90, category: "VIP" }
    ]

    for (const s of services) {
      await TenantService.create({ tenantId, ...s, active: true })
    }
    
    console.log(`✅ ${services.length} serviços carregados.`)
    console.log('🏁 TUDO PRONTO!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

seed()