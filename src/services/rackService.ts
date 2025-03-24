import { Equipment, Rack, RackSummary, VirtualMachine, SwitchPort } from '../types/rack';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Fonction utilitaire pour garantir que les VLANs sont toujours un tableau
 */
const ensureVlansArray = (vlans: any): string[] => {
  if (!vlans) {
    return [];
  }
  
  if (Array.isArray(vlans)) {
    return vlans.filter(v => v != null && v !== '');
  }
  
  if (typeof vlans === 'string') {
    try {
      const parsed = JSON.parse(vlans);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return vlans ? [vlans] : [];
    }
  }
  
  return [String(vlans)];
};

/**
 * Fonctions qui font des appels API vers le backend
 */

// Récupérer tous les résumés de baies
export const getAllRackSummaries = async (): Promise<RackSummary[]> => {
  try {
    const response = await fetch(`${API_URL}/racks`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des baies:', error);
    throw error;
  }
};

// Récupérer une baie spécifique par ID
export const getRack = async (id: string): Promise<Rack | undefined> => {
  try {
    const response = await fetch(`${API_URL}/racks/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const rack = await response.json();
    
    // S'assurer que les VLANs de chaque équipement sont correctement parsés
    if (rack.equipment && Array.isArray(rack.equipment)) {
      rack.equipment = rack.equipment.map(eq => {
        if (eq.type === 'switch') {
          // Débugging pour voir la valeur brute des VLANs reçus
          console.log(`VLANs reçus pour l'équipement ${eq.id}:`, eq.vlans);
          
          // Utiliser notre fonction utilitaire
          eq.vlans = ensureVlansArray(eq.vlans);
          console.log(`VLANs normalisés pour l'équipement ${eq.id}:`, eq.vlans);
          
          // Vérifier que les ports ont des taggedVlans corrects
          if (eq.ports && Array.isArray(eq.ports)) {
            eq.ports = eq.ports.map(port => {
              port.taggedVlans = ensureVlansArray(port.taggedVlans);
              return port;
            });
          }
        }
        return eq;
      });
    }
    
    return rack;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la baie ${id}:`, error);
    throw error;
  }
};

// Ajouter une nouvelle baie
export const addRack = async (rack: Omit<Rack, 'id' | 'equipment'>): Promise<Rack> => {
  try {
    const response = await fetch(`${API_URL}/racks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rack),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'une baie:', error);
    throw error;
  }
};

// Mettre à jour une baie
export const updateRack = async (id: string, updates: Partial<Rack>): Promise<Rack | undefined> => {
  try {
    const response = await fetch(`${API_URL}/racks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la baie ${id}:`, error);
    throw error;
  }
};

// Supprimer une baie
export const deleteRack = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/racks/${id}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la baie ${id}:`, error);
    throw error;
  }
};

// Ajouter un équipement à une baie
export const addEquipment = async (
  rackId: string, 
  equipment: Omit<Equipment, 'id'>
): Promise<Equipment> => {
  try {
    // Clone l'objet pour éviter de modifier l'original
    const requestData = { ...equipment };
    
    // S'assurer que vlans est bien un tableau et non pas undefined
    if (equipment.type === 'switch') {
      requestData.vlans = ensureVlansArray(requestData.vlans);
    }
    
    // Debug log for the request
    console.log("Add equipment request:", JSON.stringify(requestData, null, 2));
    
    const response = await fetch(`${API_URL}/equipment/${rackId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || `Erreur HTTP: ${response.status}`;
      } catch (e) {
        errorMessage = `Erreur HTTP: ${response.status} - ${errorText.substring(0, 100)}...`;
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log("Add equipment response:", JSON.stringify(result, null, 2));
    
    // Utiliser notre fonction utilitaire pour normaliser les VLANs
    if (result.type === 'switch') {
      result.vlans = ensureVlansArray(result.vlans);
    }
    
    // S'assurer que les ports ont des taggedVlans correctement parsés
    if (result.ports && Array.isArray(result.ports)) {
      result.ports = result.ports.map(port => {
        port.taggedVlans = ensureVlansArray(port.taggedVlans);
        return port;
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de l'ajout d'un équipement à la baie ${rackId}:`, error);
    throw error;
  }
};

// Mettre à jour un équipement
export const updateEquipment = async (
  equipmentId: string,
  updates: Partial<Equipment>
): Promise<Equipment> => {
  try {
    // Debug log for the update request
    console.log("Update equipment request:", JSON.stringify(updates, null, 2));
    
    // Clone l'objet pour éviter de modifier l'original
    const requestData: Partial<Equipment> = { ...updates };
    
    // S'assurer que vlans est un tableau si présent
    if (requestData.vlans !== undefined) {
      requestData.vlans = ensureVlansArray(requestData.vlans);
    }
    
    // Préparer les ports avant d'envoyer la requête
    if (requestData.ports && Array.isArray(requestData.ports)) {
      const updatedPorts = requestData.ports.map(port => {
        // Créer une copie du port pour éviter de modifier l'original
        const portCopy = { ...port };
        
        // S'assurer que taggedVlans est un tableau
        portCopy.taggedVlans = ensureVlansArray(portCopy.taggedVlans);
        
        return portCopy;
      });
      
      // Remplacer les ports dans la requête
      requestData.ports = updatedPorts;
    }
    
    const response = await fetch(`${API_URL}/equipment/${equipmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      let errorMessage = `Erreur HTTP: ${response.status}`;
      try {
        const errorResponse = await response.json();
        if (errorResponse && errorResponse.error) {
          errorMessage = errorResponse.error;
        }
      } catch (e) {
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
          }
        } catch (textError) {
          console.error("Failed to parse error response:", textError);
        }
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log("Update equipment response:", JSON.stringify(result, null, 2));
    
    // Utiliser notre fonction utilitaire pour normaliser les VLANs dans la réponse
    if (result.type === 'switch') {
      result.vlans = ensureVlansArray(result.vlans);
    }
    
    // Vérifier que les taggedVlans des ports sont correctement parsés
    if (result.ports && Array.isArray(result.ports)) {
      result.ports = result.ports.map(port => {
        port.taggedVlans = ensureVlansArray(port.taggedVlans);
        return port;
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'équipement ${equipmentId}:`, error);
    throw error;
  }
};

// Supprimer un équipement de la baie
export const removeEquipment = async (rackId: string, equipmentId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/equipment/${rackId}/${equipmentId}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'équipement ${equipmentId}:`, error);
    throw error;
  }
};

// Ajouter une machine virtuelle à un serveur
export const addVirtualMachine = async (
  rackId: string,
  equipmentId: string,
  vm: Omit<VirtualMachine, 'id'>
): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/virtual-machines/${equipmentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vm),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || `Erreur HTTP: ${response.status}`;
      } catch (e) {
        errorMessage = `Erreur HTTP: ${response.status} - ${errorText.substring(0, 100)}...`;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de l'ajout d'une VM à l'équipement ${equipmentId}:`, error);
    throw error;
  }
};

// Mettre à jour une machine virtuelle
export const updateVirtualMachine = async (
  equipmentId: string,
  vmId: string,
  updates: Partial<VirtualMachine>
): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/virtual-machines/${vmId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || `Erreur HTTP: ${response.status}`;
      } catch (e) {
        errorMessage = `Erreur HTTP: ${response.status} - ${errorText.substring(0, 100)}...`;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la VM ${vmId}:`, error);
    throw error;
  }
};

// Supprimer une machine virtuelle
export const removeVirtualMachine = async (
  equipmentId: string,
  vmId: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/virtual-machines/${equipmentId}/${vmId}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la VM ${vmId}:`, error);
    throw error;
  }
};

// Mettre à jour un port de switch
export const updateSwitchPort = async (
  portId: string,
  updates: Partial<SwitchPort>
): Promise<SwitchPort> => {
  try {
    console.log("Updating switch port:", portId, "with data:", JSON.stringify(updates, null, 2));
    
    // Clone l'objet pour éviter de modifier l'original
    const requestData: Partial<SwitchPort> = { ...updates };
    
    // S'assurer que taggedVlans est un tableau
    if (requestData.taggedVlans !== undefined) {
      if (!Array.isArray(requestData.taggedVlans)) {
        requestData.taggedVlans = [requestData.taggedVlans as unknown as string];
      }
    } else {
      requestData.taggedVlans = [];
    }
    
    const response = await fetch(`${API_URL}/switch-ports/${portId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      let errorMessage = `Erreur HTTP: ${response.status}`;
      try {
        const errorResponse = await response.json();
        if (errorResponse && errorResponse.error) {
          errorMessage = errorResponse.error;
        }
      } catch (e) {
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
          }
        } catch (textError) {
          console.error("Failed to parse error response:", textError);
        }
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log("Switch port update response:", JSON.stringify(result, null, 2));
    
    // S'assurer que taggedVlans est un array et pas une string
    if (result.taggedVlans && typeof result.taggedVlans === 'string') {
      try {
        result.taggedVlans = JSON.parse(result.taggedVlans);
      } catch (e) {
        console.error(`Erreur lors du parsing des taggedVlans pour le port ${portId}:`, e);
        result.taggedVlans = [];
      }
    } else if (!result.taggedVlans) {
      result.taggedVlans = [];
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du port ${portId}:`, error);
    throw error;
  }
};

// Obtenir les données de debug pour un équipement
export const getEquipmentDebugData = async (equipmentId: string) => {
  try {
    const response = await fetch(`${API_URL}/debug/equipment/${equipmentId}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de debug pour l'équipement ${equipmentId}:`, error);
    throw error;
  }
};

// Obtenir les données de debug pour les VLANs d'un équipement
export const getVlansDebugData = async (equipmentId: string) => {
  try {
    const response = await fetch(`${API_URL}/debug/vlans/${equipmentId}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de debug VLAN pour l'équipement ${equipmentId}:`, error);
    throw error;
  }
};

