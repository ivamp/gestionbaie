
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

// Ajouter un nouvel endpoint spécifique pour les VLANs
router.get('/vlans/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    
    // Récupérer uniquement la colonne vlans de l'équipement
    const [equipment] = await db.query('SELECT id, vlans FROM equipment WHERE id = ?', [equipmentId]);
    if (!equipment) {
      return res.status(404).json({ error: 'Équipement non trouvé' });
    }
    
    // Analyse détaillée des VLANs
    const vlansRaw = equipment.vlans;
    let vlansJson = null;
    let vlansArray = [];
    
    try {
      if (vlansRaw) {
        vlansJson = JSON.parse(vlansRaw);
        vlansArray = Array.isArray(vlansJson) ? vlansJson : [vlansJson];
      }
    } catch (e) {
      console.error('Erreur de parsing:', e);
    }
    
    // Renvoyer des informations détaillées sur les VLANs
    res.json({
      equipmentId: equipment.id,
      vlansRaw,
      vlansRawType: typeof vlansRaw,
      vlansJson,
      vlansArray,
      isWellFormed: Array.isArray(vlansArray)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
