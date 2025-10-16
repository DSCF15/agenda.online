
export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log do erro
  console.error('❌ Erro:', err.stack)

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = {
      message,
      statusCode: 400
    }
  }

  // Erro de cast do Mongoose (ID inválido)
  if (err.name === 'CastError') {
    const message = 'Recurso não encontrado'
    error = {
      message,
      statusCode: 404
    }
  }

  // Erro de duplicação (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} já existe`
    error = {
      message,
      statusCode: 400
    }
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido'
    error = {
      message,
      statusCode: 401
    }
  }

  // Erro JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado'
    error = {
      message,
      statusCode: 401
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

// Middleware para capturar rotas não encontradas
export const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`)
  res.status(404)
  next(error)
}
