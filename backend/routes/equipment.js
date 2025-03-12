
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Ajouter un équipement à une baie
router.post('/:rackId', async (req, res) => {
  try {
    const { rackId } = req.params;
    const { 
      name, 
      type, 
      brand, 
      position, 
      size, 
      portCount, 
      ipAddress, 
      idracIp, 
      description 
    } = req.body;
    
    // Vérifier si la baie existe
    const [rack] = await db.query('SELECT * FROM racks WHERE id = ?', [rackId]);
    if (!rack) {
      return res.status(404).json({ error: 'Baie non trouvée' });
    }
    
    // Vérifier si la position est valide
    const positionEnd = position + size - 1;
    if (position < 1 || positionEnd > rack.totalUnits) {
      return res.status(400).json({ 
        error: `Position invalide: L'équipement dépasse les limites de la baie (1-${rack.totalUnits})` 
      });
    }
    
    // Vérifier si l'équipement chevauche un équipement existant
    const overlappingEquipment = await db.query(
      'SELECT * FROM equipment WHERE rack_id = ? AND ((position <= ? AND position + size - 1 >= ?) OR (position >= ? AND position <= ?))',
      [rackId, positionEnd, position, position, positionEnd]
    );
    
    if (overlappingEquipment.length > 0) {
      return res.status(400).json({ error: "L'équipement chevauche un équipement existant" });
    }
    
    // Ajouter l'équipement
    const id = uuidv4();
    await db.query(
      'INSERT INTO equipment (id, rack_id, name, type, brand, position, size, portCount, ipAddress, idracIp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, rackId, name, type, brand, position, size, portCount, ipAddress, idracIp, description]
    );
    
    // Récupérer l'équipement ajouté
    const [newEquipment] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);
    
    // Si c'est un switch et qu'il a des ports, les créer
    if (type === 'switch' && portCount) {
      const portsPromises = Array.from({ length: portCount }, (_, i) => {
        const portId = uuidv4();
        return db.query(
          'INSERT INTO switch_ports (id, equipment_id, portNumber, description, connected, taggedVlans, isFibre) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [portId, id, i + 1, '', false, JSON.stringify([]), false]
        );
      });
      
      await Promise.all(portsPromises);
      
      // Récupérer les ports créés
      const ports = await db.query('SELECT * FROM switch_ports WHERE equipment_id = ?', [id]);
      newEquipment.ports = ports.map(port => ({
        ...port,
        taggedVlans: JSON.parse(port.taggedVlans)
      }));
    }
    
    res.status(201).json(newEquipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un équipement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      brand, 
      position, 
      size, 
      portCount, 
      ipAddress, 
      idracIp, 
      description 
    } = req.body;
    
    // Vérifier si l'équipement existe
    const [equipment] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);
    if (!equipment) {
      return res.status(404).json({ error: 'Équipement non trouvé' });
    }
    
    // Si la position ou la taille change, vérifier la validité
    if ((position && position !== equipment.position) || (size && size !== equipment.size)) {
      const [rack] = await db.query('SELECT * FROM racks WHERE id = ?', [equipment.rack_id]);
      
      const newPosition = position || equipment.position;
      const newSize = size || equipment.size;
      const positionEnd = newPosition + newSize - 1;
      
      // Vérifier les limites de la baie
      if (newPosition < 1 || positionEnd > rack.totalUnits) {
        return res.status(400).json({ 
          error: `Position invalide: L'équipement dépasse les limites de la baie (1-${rack.totalUnits})` 
        });
      }
      
      // Vérifier le chevauchement avec d'autres équipements
      const overlappingEquipment = await db.query(
        'SELECT * FROM equipment WHERE rack_id = ? AND id != ? AND ((position <= ? AND position + size - 1 >= ?) OR (position >= ? AND position <= ?))',
        [equipment.rack_id, id, positionEnd, newPosition, newPosition, positionEnd]
      );
      
      if (overlappingEquipment.length > 0) {
        return res.status(400).json({ error: "L'équipement chevauche un équipement existant" });
      }
    }
    
    // Mettre à jour l'équipement
    await db.query(
      'UPDATE equipment SET name = ?, brand = ?, position = ?, size = ?, portCount = ?, ipAddress = ?, idracIp = ?, description = ? WHERE id = ?',
      [
        name || equipment.name, 
        brand || equipment.brand, 
        position || equipment.position, 
        size || equipment.size, 
        portCount || equipment.portCount, 
        ipAddress || equipment.ipAddress, 
        idracIp || equipment.idracIp, 
        description || equipment.description,
        id
      ]
    );
    
    // Récupérer l'équipement mis à jour
    const [updatedEquipment] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);
    
    // Si c'est un switch, récupérer ses ports
    if (updatedEquipment.type === 'switch') {
      // Si le nombre de ports a changé, ajuster le nombre de ports
      if (portCount && portCount !== equipment.portCount) {
        // Supprimer tous les ports existants
        await db.query('DELETE FROM switch_ports WHERE equipment_id = ?', [id]);
        
        // Créer de nouveaux ports
        const portsPromises = Array.from({ length: portCount }, (_, i) => {
          const portId = uuidv4();
          return db.query(
            'INSERT INTO switch_ports (id, equipment_id, portNumber, description, connected, taggedVlans, isFibre) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [portId, id, i + 1, '', false, JSON.stringify([]), false]
          );
        });
        
        await Promise.all(portsPromises);
      }
      
      // Récupérer les ports
      const ports = await db.query('SELECT * FROM switch_ports WHERE equipment_id = ?', [id]);
      updatedEquipment.ports = ports.map(port => ({
        ...port,
        taggedVlans: JSON.parse(port.taggedVlans)
      }));
    } else if (updatedEquipment.type === 'server') {
      // Si c'est un serveur, récupérer ses VMs
      const vms = await db.query('SELECT * FROM virtual_machines WHERE equipment_id = ?', [id]);
      updatedEquipment.virtualMachines = vms;
    }
    
    res.json(updatedEquipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un équipement
router.delete('/:rackId/:id', async (req, res) => {
  try {
    const { id, rackId } = req.params;
    
    // Vérifier si l'équipement existe et appartient à la baie
    const [equipment] = await db.query(
      'SELECT * FROM equipment WHERE id = ? AND rack_id = ?', 
      [id, rackId]
    );
    
    if (!equipment) {
      return res.status(404).json({ error: 'Équipement non trouvé ou n\'appartient pas à cette baie' });
    }
    
    // Supprimer l'équipement (les VMs, ports, etc. seront supprimés en cascade)
    await db.query('DELETE FROM equipment WHERE id = ?', [id]);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
