
import { Equipment, Rack, RackSummary, VirtualMachine, SwitchPort } from '../types/rack';
import { getRackById, getRackSummaries, racks } from '../data/mockData';

/**
 * Dans une application réelle, ces fonctions feraient des appels API vers un backend
 * Pour l'instant, elles vont simplement manipuler les données en mémoire
 */

// Récupérer tous les résumés de baies
export const getAllRackSummaries = (): RackSummary[] => {
  return getRackSummaries();
};

// Récupérer une baie spécifique par ID
export const getRack = (id: string): Rack | undefined => {
  return getRackById(id);
};

// Ajouter une nouvelle baie
export const addRack = (rack: Omit<Rack, 'id' | 'equipment'>): Rack => {
  const newRack: Rack = {
    id: `rack-${Date.now()}`,
    equipment: [],
    ...rack,
  };
  
  racks.push(newRack);
  return newRack;
};

// Mettre à jour une baie
export const updateRack = (id: string, updates: Partial<Rack>): Rack | undefined => {
  const rackIndex = racks.findIndex(r => r.id === id);
  if (rackIndex === -1) return undefined;
  
  const updatedRack = { ...racks[rackIndex], ...updates };
  racks[rackIndex] = updatedRack;
  
  return updatedRack;
};

// Supprimer une baie
export const deleteRack = (id: string): boolean => {
  const initialLength = racks.length;
  const newRacks = racks.filter(r => r.id !== id);
  
  if (newRacks.length === initialLength) {
    return false;
  }
  
  racks.length = 0;
  racks.push(...newRacks);
  return true;
};

// Ajouter un équipement à une baie
export const addEquipment = (rackId: string, equipment: Omit<Equipment, 'id'>): Equipment | undefined => {
  const rack = getRackById(rackId);
  if (!rack) return undefined;

  // Vérifier si la position est valide
  const positionEnd = equipment.position + equipment.size - 1;
  if (equipment.position < 1 || positionEnd > rack.totalUnits) {
    throw new Error(`Position invalide: L'équipement dépasse les limites de la baie (1-${rack.totalUnits})`);
  }

  // Vérifier si l'équipement chevauche un équipement existant
  const overlapping = rack.equipment.some(eq => {
    const eqStart = eq.position;
    const eqEnd = eq.position + eq.size - 1;
    return (equipment.position <= eqEnd && positionEnd >= eqStart);
  });

  if (overlapping) {
    throw new Error("L'équipement chevauche un équipement existant");
  }

  // Initialiser les ports si c'est un switch
  if (equipment.type === 'switch' && equipment.portCount && !equipment.ports) {
    equipment.ports = Array.from({ length: equipment.portCount }, (_, i) => ({
      id: `port-${Date.now()}-${i}`,
      portNumber: i + 1,
      description: '',
      connected: false,
      taggedVlans: []
    }));
  }

  const newEquipment: Equipment = {
    id: `eq-${Date.now()}`,
    ...equipment,
  };

  rack.equipment.push(newEquipment);
  return newEquipment;
};

// Mettre à jour un équipement
export const updateEquipment = (
  rackId: string,
  equipmentId: string,
  updates: Partial<Equipment>
): Equipment | undefined => {
  const rack = getRackById(rackId);
  if (!rack) return undefined;

  const equipmentIndex = rack.equipment.findIndex(eq => eq.id === equipmentId);
  if (equipmentIndex === -1) return undefined;

  // Si la position ou la taille change, vérifier la validité
  if (updates.position || updates.size) {
    const updatedEquipment = { ...rack.equipment[equipmentIndex], ...updates };
    const positionEnd = updatedEquipment.position + updatedEquipment.size - 1;
    
    // Vérifier les limites de la baie
    if (updatedEquipment.position < 1 || positionEnd > rack.totalUnits) {
      throw new Error(`Position invalide: L'équipement dépasse les limites de la baie (1-${rack.totalUnits})`);
    }

    // Vérifier le chevauchement avec d'autres équipements
    const overlapping = rack.equipment.some((eq, index) => {
      if (index === equipmentIndex) return false; // Ignorer l'équipement en cours de mise à jour
      
      const eqStart = eq.position;
      const eqEnd = eq.position + eq.size - 1;
      return (updatedEquipment.position <= eqEnd && positionEnd >= eqStart);
    });

    if (overlapping) {
      throw new Error("L'équipement chevauche un équipement existant");
    }
  }

  // Mettre à jour l'équipement
  const updatedEquipment = { ...rack.equipment[equipmentIndex], ...updates };
  rack.equipment[equipmentIndex] = updatedEquipment;
  
  return updatedEquipment;
};

// Supprimer un équipement de la baie
export const removeEquipment = (rackId: string, equipmentId: string): boolean => {
  const rack = getRackById(rackId);
  if (!rack) return false;
  
  const initialLength = rack.equipment.length;
  rack.equipment = rack.equipment.filter(eq => eq.id !== equipmentId);
  
  return rack.equipment.length !== initialLength;
};

// Ajouter une machine virtuelle à un serveur
export const addVirtualMachine = (
  rackId: string,
  equipmentId: string,
  vm: Omit<VirtualMachine, 'id'>
): VirtualMachine | undefined => {
  const rack = getRackById(rackId);
  if (!rack) return undefined;
  
  const equipment = rack.equipment.find(eq => eq.id === equipmentId);
  if (!equipment || equipment.type !== 'server') return undefined;
  
  const newVM: VirtualMachine = {
    id: `vm-${Date.now()}`,
    ...vm,
  };
  
  if (!equipment.virtualMachines) {
    equipment.virtualMachines = [];
  }
  
  equipment.virtualMachines.push(newVM);
  return newVM;
};

// Mettre à jour une machine virtuelle
export const updateVirtualMachine = (
  rackId: string,
  equipmentId: string,
  vmId: string,
  updates: Partial<VirtualMachine>
): VirtualMachine | undefined => {
  const rack = getRackById(rackId);
  if (!rack) return undefined;
  
  const equipment = rack.equipment.find(eq => eq.id === equipmentId);
  if (!equipment || equipment.type !== 'server' || !equipment.virtualMachines) return undefined;
  
  const vmIndex = equipment.virtualMachines.findIndex(vm => vm.id === vmId);
  if (vmIndex === -1) return undefined;
  
  const updatedVM = { ...equipment.virtualMachines[vmIndex], ...updates };
  equipment.virtualMachines[vmIndex] = updatedVM;
  
  return updatedVM;
};

// Supprimer une machine virtuelle
export const removeVirtualMachine = (
  rackId: string,
  equipmentId: string,
  vmId: string
): boolean => {
  const rack = getRackById(rackId);
  if (!rack) return false;
  
  const equipment = rack.equipment.find(eq => eq.id === equipmentId);
  if (!equipment || equipment.type !== 'server' || !equipment.virtualMachines) return false;
  
  const initialLength = equipment.virtualMachines.length;
  equipment.virtualMachines = equipment.virtualMachines.filter(vm => vm.id !== vmId);
  
  return equipment.virtualMachines.length !== initialLength;
};

// Mettre à jour un port de switch
export const updateSwitchPort = (
  rackId: string,
  equipmentId: string,
  portId: string,
  updates: Partial<SwitchPort>
): SwitchPort | undefined => {
  const rack = getRackById(rackId);
  if (!rack) return undefined;
  
  const equipment = rack.equipment.find(eq => eq.id === equipmentId);
  if (!equipment || equipment.type !== 'switch' || !equipment.ports) return undefined;
  
  const portIndex = equipment.ports.findIndex(port => port.id === portId);
  if (portIndex === -1) return undefined;
  
  const updatedPort = { ...equipment.ports[portIndex], ...updates };
  equipment.ports[portIndex] = updatedPort;
  
  return updatedPort;
};
