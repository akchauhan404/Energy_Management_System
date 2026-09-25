export const errorMiddleware = (err, req, res, next) => {
    console.error('[API ERROR]', err);
  
    const statusCode = err.statusCode || err.status || 500;
  
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Internal server error'
      },
      ...(process.env.NODE_ENV === 'development'
        ? { stack: err.stack }
        : {})
    });
  };