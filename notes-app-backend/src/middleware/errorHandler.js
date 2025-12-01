const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Acest element există deja',
        details: err.meta?.target 
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Elementul nu a fost găsit' });
    }
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token invalid' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Eroare internă de server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;