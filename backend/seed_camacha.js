import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from './models/User.js'     // Atenção ao caminho src/
import { Tenant } from './models/Tenant.js' // Atenção ao caminho src/

dotenv.config()

const seedCamacha = async () => {
  try {
    console.log('🔌 A conectar à Base de Dados...')
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-booking')
    
    const tenantId = 'barbeariajcamacha' 
    console.log(`🌲 A criar a Loja: ${tenantId}...`)

    // 1. Limpar se já existir (para não dar erro de duplicado)
    await Tenant.deleteOne({ subdomain: tenantId }) 
    
    // 2. Criar o Tenant (A Loja)
    await Tenant.create({
      name: 'Barbearia J Camacha',
      subdomain: tenantId,
      email: 'camacha@barbearia.pt',
      active: true,
      
      // Dados obrigatórios
      businessName: 'Barbearia J Camacha Lda',
      businessEmail: 'camacha@barbeariajc.pt',
      businessPhone: '911222333',
      businessAddress: {
        street: 'Largo da Camacha, 50',
        city: 'Camacha',
        state: 'Madeira',
        zipCode: '9135-000'
      },
      // Cores diferentes para distinguir
      branding: {
        primaryColor: '#22c55e', // Verde para a Camacha
        secondaryColor: '#000000'
      },
      workingHours: {
        monday: { isOpen: true, open: '09:00', close: '19:00' },
        tuesday: { isOpen: true, open: '09:00', close: '19:00' },
        wednesday: { isOpen: true, open: '09:00', close: '19:00' },
        thursday: { isOpen: true, open: '09:00', close: '19:00' },
        friday: { isOpen: true, open: '09:00', close: '19:00' },
        saturday: { isOpen: true, open: '09:00', close: '13:00' }, // Fecha mais cedo
        sunday: { isOpen: false, open: '09:00', close: '18:00' }
      }
    })
    console.log('✅ Loja Camacha criada na Base de Dados.')

    // 3. Criar o Admin da Camacha
    await User.deleteOne({ email: 'gerente@camacha.pt' })
    await User.create({
      tenantId,
      name: 'Gerente Camacha',
      email: 'gerente@camacha.pt',
      password: 'password123',
      role: 'admin'
    })
    console.log('✅ Admin da Camacha criado.')

    console.log('🏁 TUDO PRONTO! Agora podes ir ao Postman.')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

seedCamacha()