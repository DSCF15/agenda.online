import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from './models/User.js'
import { TenantStaff } from './models/TenantStaff.js'

dotenv.config()

const createStaffUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('🔌 Conectado. A criar logins para os barbeiros...')

    // --- 1. STAFF CANIÇO ---
    // Vamos procurar o "João Silva" que criámos no seed anterior
    const joaoStaff = await TenantStaff.findOne({ name: /João/, tenantId: 'barbeariajc' })
    
    if (joaoStaff) {
      // Criar Login para o João
      await User.deleteOne({ email: 'joao@barbearia.pt' })
      const userJoao = await User.create({
        tenantId: 'barbeariajc',
        name: 'João Silva',
        email: 'joao@barbearia.pt',
        password: 'password123',
        role: 'staff' // 👈 Importante: Role 'staff'
      })
      
      // Ligar o Staff ao User (Para o sistema saber quem é quem)
      joaoStaff.userId = userJoao._id
      await joaoStaff.save()
      console.log('✅ Login criado: joao@barbearia.pt (Caniço)')
    }

    // --- 2. STAFF CAMACHA ---
    // Vamos procurar o "Pedro"
    const pedroStaff = await TenantStaff.findOne({ name: /Pedro/, tenantId: 'barbeariajcamacha' })
    
    if (pedroStaff) {
      await User.deleteOne({ email: 'pedro@camacha.pt' })
      const userPedro = await User.create({
        tenantId: 'barbeariajcamacha',
        name: 'Pedro Aprendiz',
        email: 'pedro@camacha.pt',
        password: 'password123',
        role: 'staff'
      })

      pedroStaff.userId = userPedro._id
      await pedroStaff.save()
      console.log('✅ Login criado: pedro@camacha.pt (Camacha)')
    }

    console.log('🏁 Feito!')
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

createStaffUsers()