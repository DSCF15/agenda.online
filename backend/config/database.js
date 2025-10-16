
import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-booking', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`)
    
    // Event listeners para conexão
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro de conexão MongoDB:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado')
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('🔒 Conexão MongoDB fechada devido ao encerramento da aplicação')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message)
    process.exit(1)
  }
}
