
const express = require('express');
const router = express.Router();
const db = require('../db');

// Récupérer les données brutes d'un équipement pour debugging
router.get('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer les données brutes de l'équipement
    const [equipment] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);
    if (!equipment) {
      return res.status(404).json({ error: 'Équipement non trouvé' });
    }
    
    // Renvoyer les données brutes avec des informations supplémentaires
    res.json({
      rawData: equipment,
      vlansType: typeof equipment.vlans,
      vlansValue: equipment.vlans,
      parsedVlans: equipment.vlans ? JSON.parse(equipment.vlans) : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
