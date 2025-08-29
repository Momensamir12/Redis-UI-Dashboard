const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Redis connection errors
  if (err.message.includes('Connection') || err.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      success: false,
      error: 'Redis server is not available',
      details: err.message,
      code: 'REDIS_CONNECTION_ERROR'
    });
  }

  // Redis command errors
  if (err.message.includes('ERR') || err.message.includes('WRONGTYPE')) {
    return res.status(400).json({
      success: false,
      error: 'Redis command error',
      details: err.message,
      code: 'REDIS_COMMAND_ERROR'
    });
  }

  // Validation errors
  if (err.message.includes('required') || err.message.includes('invalid')) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Timeout errors
  if (err.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      error: 'Request timeout',
      details: err.message,
      code: 'TIMEOUT_ERROR'
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

module.exports = errorHandler;