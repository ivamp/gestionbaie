
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Obtenir tous les résumés de baies
router.get('/', async (req, res) => {
  try {
    // Requête pour obtenir toutes les baies
    const racks = await db.query('SELECT * FROM racks');
    
    // Pour chaque baie, calculer les unités utilisées et le nombre d'équipements
    const rackSummaries = await Promise.all(racks.map(async rack => {
      const equipment = await db.query('SELECT * FROM equipment WHERE rack_id = ?', [rack.id]);
      const usedUnits = equipment.reduce((total, eq) => total + eq.size, 0);
      
      return {
        id: rack.id,
        name: rack.name,
        location: rack.location,
        totalUnits: rack.totalUnits,
        usedUnits,
        equipmentCount: equipment.length
      };
    }));
    
    res.json(rackSummaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir une baie spécifique avec ses équipements
router.get('/:id', async (req, res) => {
  try {
    const [rack] = await db.query('SELECT * FROM racks WHERE id = ?', [req.params.id]);
    
    if (!rack) {
      return res.status(404).json({ error: 'Baie non trouvée' });
    }
    
    // Récupérer tous les équipements de la baie
    const equipment = await db.query('SELECT * FROM equipment WHERE rack_id = ?', [rack.id]);
    
    // Pour chaque équipement de type serveur, récupérer ses machines virtuelles
    const equipmentWithDetails = await Promise.all(equipment.map(async eq => {
      let result = { ...eq };
      
      if (eq.type === 'server') {
        const vms = await db.query('SELECT * FROM virtual_machines WHERE equipment_id = ?', [eq.id]);
        result.virtualMachines = vms;
      } else if (eq.type === 'switch') {
        const ports = await db.query('SELECT * FROM switch_ports WHERE equipment_id = ?', [eq.id]);
        // Convertir le JSON stocké en tableau JavaScript
        const portsWithParsedVlans = ports.map(port => ({
          ...port,
          taggedVlans: port.taggedVlans ? JSON.parse(port.taggedVlans) : []
        }));
        
        result.ports = portsWithParsedVlans;
        
        const vlans = await db.query('SELECT * FROM vlans WHERE equipment_id = ?', [eq.id]);
        result.vlans = vlans.map(vlan => vlan.name);
      }
      
      return result;
    }));
    
    // Construire l'objet complet
    const fullRack = {
      ...rack,
      equipment: equipmentWithDetails
    };
    
    res.json(fullRack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter une nouvelle baie
router.post('/', async (req, res) => {
  try {
    const { name, location, totalUnits } = req.body;
    
    if (!name || !location || !totalUnits) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    const id = uuidv4();
    await db.query(
      'INSERT INTO racks (id, name, location, totalUnits) VALUES (?, ?, ?, ?)',
      [id, name, location, totalUnits]
    );
    
    const [newRack] = await db.query('SELECT * FROM racks WHERE id = ?', [id]);
    newRack.equipment = [];
    
    res.status(201).json(newRack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une baie
router.put('/:id', async (req, res) => {
  try {
    const { name, location, totalUnits } = req.body;
    const { id } = req.params;
    
    // Vérifier si la baie existe
    const [existingRack] = await db.query('SELECT * FROM racks WHERE id = ?', [id]);
    if (!existingRack) {
      return res.status(404).json({ error: 'Baie non trouvée' });
    }
    
    // Mettre à jour la baie
    await db.query(
      'UPDATE racks SET name = ?, location = ?, totalUnits = ? WHERE id = ?',
      [name || existingRack.name, location || existingRack.location, totalUnits || existingRack.totalUnits, id]
    );
    
    // Récupérer la baie mise à jour
    const [updatedRack] = await db.query('SELECT * FROM racks WHERE id = ?', [id]);
    
    res.json(updatedRack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une baie
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la baie existe
    const [existingRack] = await db.query('SELECT * FROM racks WHERE id = ?', [id]);
    if (!existingRack) {
      return res.status(404).json({ error: 'Baie non trouvée' });
    }
    
    // Supprimer la baie (les équipements, VMs, etc. seront supprimés en cascade)
    await db.query('DELETE FROM racks WHERE id = ?', [id]);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
