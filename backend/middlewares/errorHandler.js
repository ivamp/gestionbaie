
/**
 * Middleware de gestion des erreurs pour Express
 */
const errorHandler = (err, req, res, next) => {
  console.error("Erreur d'API:", err);
  
  // Déterminer le statut de l'erreur
  const statusCode = err.statusCode || 500;
  
  // Préparer la réponse
  const errorResponse = {
    error: err.message || "Une erreur inattendue est survenue",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  
  // Répondre avec le JSON approprié
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
