import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from './models/User.js'

dotenv.config()

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-booking')
  
  const email = 'admin@bellavista.com'
  
  // Limpa utilizadores antigos com este email se existirem
  await User.deleteOne({ email })

  await User.create({
    tenantId: 'bella-vista',
    name: 'Dono Bella Vista',
    email: email,
    password: 'password123', // Vai ser encriptada automaticamente
    role: 'admin'
  })

  console.log(`✅ Admin criado com sucesso!`)
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Pass: password123`)
  process.exit(0)
}

createAdmin()