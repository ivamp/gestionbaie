
const express = require('express');
const router = express.Router();
const db = require('../db');

// Mettre à jour un port de switch
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, connected, taggedVlans, isFibre } = req.body;
    
    // Vérifier si le port existe
    const [port] = await db.query('SELECT * FROM switch_ports WHERE id = ?', [id]);
    if (!port) {
      return res.status(404).json({ error: 'Port non trouvé' });
    }
    
    // Mettre à jour le port
    const taggedVlansJson = taggedVlans ? JSON.stringify(taggedVlans) : port.taggedVlans;
    
    await db.query(
      'UPDATE switch_ports SET description = ?, connected = ?, taggedVlans = ?, isFibre = ? WHERE id = ?',
      [
        description !== undefined ? description : port.description,
        connected !== undefined ? connected : port.connected,
        taggedVlansJson,
        isFibre !== undefined ? isFibre : port.isFibre,
        id
      ]
    );
    
    // Récupérer le port mis à jour
    const [updatedPort] = await db.query('SELECT * FROM switch_ports WHERE id = ?', [id]);
    updatedPort.taggedVlans = JSON.parse(updatedPort.taggedVlans);
    
    res.json(updatedPort);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
