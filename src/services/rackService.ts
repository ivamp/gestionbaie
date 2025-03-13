
import { Equipment, Rack, RackSummary, VirtualMachine, SwitchPort } from '../types/rack';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
          // Vérifier si vlans est une string, dans ce cas la parser
          if (eq.vlans && typeof eq.vlans === 'string') {
            try {
              eq.vlans = JSON.parse(eq.vlans);
            } catch (e) {
              console.error(`Erreur lors du parsing des VLANs pour l'équipement ${eq.id}:`, e);
              eq.vlans = [];
            }
          } else if (!eq.vlans) {
            eq.vlans = [];
          }
          
          // Vérifier que les ports ont des taggedVlans corrects
          if (eq.ports && Array.isArray(eq.ports)) {
            eq.ports = eq.ports.map(port => {
              if (port.taggedVlans && typeof port.taggedVlans === 'string') {
                try {
                  port.taggedVlans = JSON.parse(port.taggedVlans);
                } catch (e) {
                  console.error(`Erreur lors du parsing des taggedVlans pour le port ${port.id}:`, e);
                  port.taggedVlans = [];
                }
              } else if (!port.taggedVlans) {
                port.taggedVlans = [];
              }
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
    // Assurons-nous que les VLANs sont inclus dans la requête s'il s'agit d'un switch
    if (equipment.type === 'switch' && equipment.vlans) {
      console.log("Ajout d'équipement avec VLANs:", equipment.vlans);
    }
    
    // Debug log for the request
    console.log("Add equipment request:", JSON.stringify(equipment, null, 2));
    
    const response = await fetch(`${API_URL}/equipment/${rackId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(equipment),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        // Essayer de parser le message d'erreur en JSON
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || `Erreur HTTP: ${response.status}`;
      } catch (e) {
        // Si le parsing échoue, utiliser le texte brut
        errorMessage = `Erreur HTTP: ${response.status} - ${errorText.substring(0, 100)}...`;
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log("Add equipment response:", JSON.stringify(result, null, 2));
    
    // Si c'est un switch mais que les VLANs ne sont pas dans la réponse, ajoutons-les manuellement
    if (equipment.type === 'switch') {
      // Si vlans existe dans la réponse mais est une string JSON, parsons-la
      if (result.vlans && typeof result.vlans === 'string') {
        try {
          result.vlans = JSON.parse(result.vlans);
        } catch (e) {
          console.error("Erreur lors du parsing des VLANs dans la réponse:", e);
          result.vlans = equipment.vlans || [];
        }
      } 
      // Si vlans n'existe pas dans la réponse mais existe dans la requête
      else if (!result.vlans && equipment.vlans) {
        result.vlans = equipment.vlans;
        console.log("VLANs ajoutés manuellement au résultat:", equipment.vlans);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de l'ajout d'un équipement à la baie ${rackId}:`, error);
    throw error;
  }
};

// Mettre à jour un équipement
export const updateEquipment = async (
  rackId: string,
  equipmentId: string,
  updates: Partial<Equipment>
): Promise<Equipment> => {
  try {
    // Debug log for the update request
    console.log("Update equipment request:", JSON.stringify(updates, null, 2));
    
    // Clone l'objet pour éviter de modifier l'original
    const requestData: Partial<Equipment> = { ...updates };
    
    // Traitement des ports - s'assurer que taggedVlans est un array pour chaque port
    if (requestData.ports && Array.isArray(requestData.ports)) {
      requestData.ports = requestData.ports.map(port => {
        // Créer une copie pour éviter de modifier l'original
        const portCopy = { ...port };
        
        // Assurer que taggedVlans est un array
        if (!portCopy.taggedVlans) {
          portCopy.taggedVlans = [];
        }
        return portCopy;
      });
    }
    
    // Envoyer la requête au serveur
    const response = await fetch(`${API_URL}/equipment/${equipmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      // Improved error handling
      let errorMessage = `Erreur HTTP: ${response.status}`;
      try {
        const errorResponse = await response.json();
        if (errorResponse && errorResponse.error) {
          errorMessage = errorResponse.error;
        }
      } catch (e) {
        // If the response is not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
          }
        } catch (textError) {
          // Fallback if we can't get text either
          console.error("Failed to parse error response:", textError);
        }
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log("Update equipment response:", JSON.stringify(result, null, 2));
    
    // Si les VLANs sont mis à jour, mais sont une string JSON dans la réponse, parsons-les
    if (result.vlans && typeof result.vlans === 'string') {
      try {
        result.vlans = JSON.parse(result.vlans);
      } catch (e) {
        console.error("Erreur lors du parsing des VLANs dans la réponse:", e);
        result.vlans = updates.vlans || [];
      }
    }
    // Si les VLANs sont absents de la réponse mais présents dans la requête
    else if (!result.vlans && updates.vlans) {
      result.vlans = updates.vlans;
      console.log("VLANs ajoutés manuellement au résultat:", updates.vlans);
    }
    
    // Vérifier que les taggedVlans des ports sont correctement parsés
    if (result.ports && Array.isArray(result.ports)) {
      result.ports = result.ports.map(port => {
        if (port.taggedVlans && typeof port.taggedVlans === 'string') {
          try {
            port.taggedVlans = JSON.parse(port.taggedVlans);
          } catch (e) {
            console.error(`Erreur lors du parsing des taggedVlans pour le port ${port.id}:`, e);
            port.taggedVlans = [];
          }
        } else if (!port.taggedVlans) {
          port.taggedVlans = [];
        }
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
  equipmentId: string,
  portId: string,
  updates: Partial<SwitchPort>
): Promise<SwitchPort> => {
  try {
    console.log("Updating switch port:", portId, "with data:", JSON.stringify(updates, null, 2));
    
    const response = await fetch(`${API_URL}/switch-ports/${portId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
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
        result.taggedVlans = updates.taggedVlans || [];
      }
    } else if (!result.taggedVlans && updates.taggedVlans) {
      result.taggedVlans = updates.taggedVlans;
      console.log("taggedVlans ajoutés manuellement au résultat:", updates.taggedVlans);
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du port ${portId}:`, error);
    throw error;
  }
};
