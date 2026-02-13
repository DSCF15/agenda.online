import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { TenantStaff } from './models/TenantStaff.js'
import { TenantService } from './models/TenantService.js'

dotenv.config()

const seedStaff = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  
  // 1. BARBEARIA JC (Caniço)
  console.log('💇‍♂️ A criar equipa Caniço...')
  await TenantStaff.deleteMany({ tenantId: 'barbeariajc' })
  
  // Buscar serviços para associar
  const servicosCaniço = await TenantService.find({ tenantId: 'barbeariajc' })
  const idsCaniço = servicosCaniço.map(s => s._id) // Fazem tudo

  await TenantStaff.create([
    { tenantId: 'barbeariajc', name: 'Pedro Branco', services: idsCaniço },
    { tenantId: 'barbeariajc', name: 'Victor', services: idsCaniço },
    { tenantId: 'barbeariajc', name: 'Afonso', services: idsCaniço }
  ])

  // 2. BARBEARIA CAMACHA
  console.log('💇‍♂️ A criar equipa Camacha...')
  await TenantStaff.deleteMany({ tenantId: 'barbeariajcamacha' })
  
  const servicosCamacha = await TenantService.find({ tenantId: 'barbeariajcamacha' })
  const idsCamacha = servicosCamacha.map(s => s._id)

  await TenantStaff.create([
    { tenantId: 'barbeariajcamacha', name: 'Jota', services: idsCamacha },
    { tenantId: 'barbeariajcamacha', name: 'Inácio', services: idsCamacha },
    { tenantId: 'barbeariajcamacha', name: 'João', services: idsCamacha }
  ])

  console.log('✅ Equipas criadas!')
  process.exit()
}

seedStaff()