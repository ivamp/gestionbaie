
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Ajouter une machine virtuelle à un serveur
router.post('/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { name, description, anydeskCode, ipAddress } = req.body;
    
    // Vérifier si l'équipement existe et est un serveur
    const [equipment] = await db.query(
      'SELECT * FROM equipment WHERE id = ? AND type = "server"',
      [equipmentId]
    );
    
    if (!equipment) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // Ajouter la VM
    const id = uuidv4();
    await db.query(
      'INSERT INTO virtual_machines (id, equipment_id, name, description, anydeskCode, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
      [id, equipmentId, name, description, anydeskCode, ipAddress]
    );
    
    // Récupérer la VM ajoutée
    const [newVM] = await db.query('SELECT * FROM virtual_machines WHERE id = ?', [id]);
    
    res.status(201).json(newVM);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une machine virtuelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, anydeskCode, ipAddress } = req.body;
    
    // Vérifier si la VM existe
    const [vm] = await db.query('SELECT * FROM virtual_machines WHERE id = ?', [id]);
    if (!vm) {
      return res.status(404).json({ error: 'Machine virtuelle non trouvée' });
    }
    
    // Mettre à jour la VM
    await db.query(
      'UPDATE virtual_machines SET name = ?, description = ?, anydeskCode = ?, ipAddress = ? WHERE id = ?',
      [
        name || vm.name,
        description || vm.description,
        anydeskCode || vm.anydeskCode,
        ipAddress || vm.ipAddress,
        id
      ]
    );
    
    // Récupérer la VM mise à jour
    const [updatedVM] = await db.query('SELECT * FROM virtual_machines WHERE id = ?', [id]);
    
    res.json(updatedVM);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une machine virtuelle
router.delete('/:equipmentId/:id', async (req, res) => {
  try {
    const { id, equipmentId } = req.params;
    
    // Vérifier si la VM existe et appartient au serveur
    const [vm] = await db.query(
      'SELECT * FROM virtual_machines WHERE id = ? AND equipment_id = ?',
      [id, equipmentId]
    );
    
    if (!vm) {
      return res.status(404).json({ error: 'Machine virtuelle non trouvée ou n\'appartient pas à ce serveur' });
    }
    
    // Supprimer la VM
    await db.query('DELETE FROM virtual_machines WHERE id = ?', [id]);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
