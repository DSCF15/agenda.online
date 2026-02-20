import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs' // Usamos bcrypt diretamente aqui para ter a certeza
import { User } from './models/User.js'

dotenv.config()

const resetAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('🔌 Conectado à Base de Dados. A limpar utilizadores...')

    // 1. Apagar todos os utilizadores existentes
    await User.deleteMany({})
    console.log('🧹 Todos os utilizadores antigos apagados.')

    // 2. Gerar a password encriptada com toda a certeza
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('password123', salt)

    // 3. Criar os utilizadores Novos (Admin e Staff)
    const newUsers = [
      // --- CANIÇO ---
      {
        tenantId: 'barbeariajc',
        name: 'Gerente Caniço',
        email: 'jc@barbearia.pt',
        password: hashedPassword, // Usamos a hash direta
        role: 'admin'
      },
      {
        tenantId: 'barbeariajc',
        name: 'João Barbeiro',
        email: 'joao@barbearia.pt',
        password: hashedPassword,
        role: 'staff'
      },
      // --- CAMACHA ---
      {
        tenantId: 'barbeariajcamacha',
        name: 'Gerente Camacha',
        email: 'gerente@camacha.pt',
        password: hashedPassword,
        role: 'admin'
      },
      {
        tenantId: 'barbeariajcamacha',
        name: 'Pedro Aprendiz',
        email: 'pedro@camacha.pt',
        password: hashedPassword,
        role: 'staff'
      }
    ]

    // Importante: Estamos a ignorar o middleware de save do Mongoose (se houver) 
    // inserindo diretamente na BD, para evitar que a password seja encriptada duas vezes
    await User.insertMany(newUsers)

    console.log('✅ Utilizadores recriados com sucesso!')
    console.log('----------------------------------------------------')
    console.log('🔑 Password para TODOS: password123')
    console.log('👤 Emails Caniço: jc@barbearia.pt | joao@barbearia.pt')
    console.log('👤 Emails Camacha: gerente@camacha.pt | pedro@camacha.pt')
    console.log('----------------------------------------------------')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

resetAllUsers()