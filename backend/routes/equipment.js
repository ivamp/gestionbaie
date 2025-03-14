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
      description,
      vlans
    } = req.body;
    
    console.log("Creating equipment with request:", req.body);
    console.log("VLANS received:", vlans);
    
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
    
    // Préparer les VLANs si présents
    let vlansJson = null;
    if (vlans) {
      // Assurez-vous que vlans est un tableau
      const vlansArray = Array.isArray(vlans) ? vlans : [vlans];
      vlansJson = JSON.stringify(vlansArray);
      console.log("VLANs to store:", vlansJson);
    }
    
    // Ajouter l'équipement
    const id = uuidv4();
    await db.query(
      'INSERT INTO equipment (id, rack_id, name, type, brand, position, size, portCount, ipAddress, idracIp, description, vlans) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, rackId, name, type, brand, position, size, portCount, ipAddress, idracIp, description, vlansJson]
    );
    
    // Récupérer l'équipement ajouté
    const [newEquipment] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);
    
    // Parser les VLANs si présents
    if (newEquipment.vlans) {
      try {
        newEquipment.vlans = JSON.parse(newEquipment.vlans);
      } catch (e) {
        newEquipment.vlans = [];
        console.error("Error parsing VLANs:", e);
      }
    } else {
      newEquipment.vlans = [];
    }
    
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
        taggedVlans: JSON.parse(port.taggedVlans || '[]')
      }));
    }
    
    console.log("Equipment created successfully:", newEquipment);
    console.log("VLANs in response:", newEquipment.vlans);
    
    res.status(201).json(newEquipment);
  } catch (error) {
    console.error("Equipment creation error:", error);
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
      description,
      vlans,
      ports
    } = req.body;
    
    console.log("Update equipment request:", JSON.stringify(req.body, null, 2));
    
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
    
    // Préparer les VLANs si présents
    let vlansJson = equipment.vlans;
    if (vlans !== undefined) {
      // Assurez-vous que vlans est un tableau
      const vlansArray = Array.isArray(vlans) ? vlans : (vlans ? [vlans] : []);
      vlansJson = JSON.stringify(vlansArray);
      console.log("Update VLANs to:", vlansJson);
    }
    
    // Mettre à jour l'équipement avec les nouveaux VLANs (même s'ils sont vides)
    await db.query(
      'UPDATE equipment SET name = ?, brand = ?, position = ?, size = ?, portCount = ?, ipAddress = ?, idracIp = ?, description = ?, vlans = ? WHERE id = ?',
      [
        name ?? equipment.name, 
        brand ?? equipment.brand, 
        position ?? equipment.position, 
        size ?? equipment.size, 
        portCount ?? equipment.portCount, 
        ipAddress ?? equipment.ipAddress, 
        idracIp ?? equipment.idracIp, 
        description ?? equipment.description,
        vlansJson,
        id
      ]
    );
    
    // Si c'est un switch et que des ports temporaires sont fournis, les créer ou les mettre à jour
    if (equipment.type === 'switch' && ports && ports.length > 0 && ports[0].id.startsWith('temp-port')) {
      // Supprimer tous les ports existants
      await db.query('DELETE FROM switch_ports WHERE equipment_id = ?', [id]);
      
      // Créer les nouveaux ports
      const newPortsPromises = ports.map(port => {
        const portId = uuidv4();
        const taggedVlansJson = JSON.stringify(port.taggedVlans || []);
        return db.query(
          'INSERT INTO switch_ports (id, equipment_id, portNumber, description, connected, taggedVlans, isFibre) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            portId, 
            id, 
            port.portNumber, 
            port.description || '', 
            port.connected ? 1 : 0, 
            taggedVlansJson,
            port.isFibre ? 1 : 0
          ]
        );
      });
      
      await Promise.all(newPortsPromises);
    } 
    // Sinon, si des ports sont fournis (mise à jour), mettre à jour les ports existants
    else if (equipment.type === 'switch' && ports && Array.isArray(ports)) {
      for (const port of ports) {
        if (port.id && !port.id.startsWith('temp-port')) {
          const taggedVlansJson = JSON.stringify(port.taggedVlans || []);
          await db.query(
            'UPDATE switch_ports SET description = ?, connected = ?, taggedVlans = ?, isFibre = ? WHERE id = ?',
            [
              port.description || '', 
              port.connected ? 1 : 0, 
              taggedVlansJson,
              port.isFibre ? 1 : 0,
              port.id
            ]
          );
        }
      }
    }
    
    // Récupérer l'équipement mis à jour
    const [updatedEquipment] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);
    
    // Parser les VLANs dans la réponse
    if (updatedEquipment.vlans) {
      try {
        updatedEquipment.vlans = JSON.parse(updatedEquipment.vlans);
        // Vérification supplémentaire que vlans est un tableau valide
        if (!Array.isArray(updatedEquipment.vlans)) {
          updatedEquipment.vlans = [];
        }
      } catch (e) {
        updatedEquipment.vlans = [];
        console.error("Error parsing VLANs:", e);
      }
    } else {
      updatedEquipment.vlans = [];
    }
    
    // Si c'est un switch, récupérer ses ports
    if (updatedEquipment.type === 'switch') {
      // Récupérer les ports
      const updatedPorts = await db.query('SELECT * FROM switch_ports WHERE equipment_id = ?', [id]);
      updatedEquipment.ports = updatedPorts.map(port => ({
        ...port,
        taggedVlans: JSON.parse(port.taggedVlans || '[]')
      }));
    } else if (updatedEquipment.type === 'server') {
      // Si c'est un serveur, récupérer ses VMs
      const vms = await db.query('SELECT * FROM virtual_machines WHERE equipment_id = ?', [id]);
      updatedEquipment.virtualMachines = vms;
    }
    
    console.log("Update equipment response:", JSON.stringify(updatedEquipment, null, 2));
    console.log("VLANs in update response:", updatedEquipment.vlans);
    
    res.json(updatedEquipment);
  } catch (error) {
    console.error("Equipment update error:", error);
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
