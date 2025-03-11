
import { Equipment, Rack, RackSummary, VirtualMachine } from '../types/rack';
import { getRackById, getRackSummaries, racks } from '../data/mockData';

/**
 * In a real application, these functions would make API calls to a backend
 * For now, they'll just manipulate the in-memory data
 */

// Get all rack summaries
export const getAllRackSummaries = (): RackSummary[] => {
  return getRackSummaries();
};

// Get a specific rack by ID
export const getRack = (id: string): Rack | undefined => {
  return getRackById(id);
};

// Add a new rack
export const addRack = (rack: Omit<Rack, 'id' | 'equipment'>): Rack => {
  const newRack: Rack = {
    id: `rack-${Date.now()}`,
    equipment: [],
    ...rack,
  };
  
  racks.push(newRack);
  return newRack;
};

// Update a rack
export const updateRack = (id: string, updates: Partial<Rack>): Rack | undefined => {
  const rackIndex = racks.findIndex(r => r.id === id);
  if (rackIndex === -1) return undefined;
  
  const updatedRack = { ...racks[rackIndex], ...updates };
  racks[rackIndex] = updatedRack;
  
  return updatedRack;
};

// Delete a rack
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

// Add equipment to a rack
export const addEquipment = (rackId: string, equipment: Omit<Equipment, 'id'>): Equipment | undefined => {
  const rack = getRackById(rackId);
  if (!rack) return undefined;

  // Check if the position is valid
  const positionEnd = equipment.position + equipment.size - 1;
  if (equipment.position < 1 || positionEnd > rack.totalUnits) {
    throw new Error(`Invalid position: Equipment exceeds rack boundaries (1-${rack.totalUnits})`);
  }

  // Check for overlapping equipment
  const overlapping = rack.equipment.some(eq => {
    const eqStart = eq.position;
    const eqEnd = eq.position + eq.size - 1;
    return (equipment.position <= eqEnd && positionEnd >= eqStart);
  });

  if (overlapping) {
    throw new Error('Equipment overlaps with existing equipment');
  }

  const newEquipment: Equipment = {
    id: `eq-${Date.now()}`,
    ...equipment,
  };

  rack.equipment.push(newEquipment);
  return newEquipment;
};

// Update equipment
export const updateEquipment = (
  rackId: string,
  equipmentId: string,
  updates: Partial<Equipment>
): Equipment | undefined => {
  const rack = getRackById(rackId);
  if (!rack) return undefined;

  const equipmentIndex = rack.equipment.findIndex(eq => eq.id === equipmentId);
  if (equipmentIndex === -1) return undefined;

  // If position or size is changing, check for validity
  if (updates.position || updates.size) {
    const updatedEquipment = { ...rack.equipment[equipmentIndex], ...updates };
    const positionEnd = updatedEquipment.position + updatedEquipment.size - 1;
    
    // Check rack boundaries
    if (updatedEquipment.position < 1 || positionEnd > rack.totalUnits) {
      throw new Error(`Invalid position: Equipment exceeds rack boundaries (1-${rack.totalUnits})`);
    }

    // Check for overlapping with other equipment
    const overlapping = rack.equipment.some((eq, index) => {
      if (index === equipmentIndex) return false; // Skip the equipment being updated
      
      const eqStart = eq.position;
      const eqEnd = eq.position + eq.size - 1;
      return (updatedEquipment.position <= eqEnd && positionEnd >= eqStart);
    });

    if (overlapping) {
      throw new Error('Equipment overlaps with existing equipment');
    }
  }

  // Update the equipment
  const updatedEquipment = { ...rack.equipment[equipmentIndex], ...updates };
  rack.equipment[equipmentIndex] = updatedEquipment;
  
  return updatedEquipment;
};

// Remove equipment from rack
export const removeEquipment = (rackId: string, equipmentId: string): boolean => {
  const rack = getRackById(rackId);
  if (!rack) return false;
  
  const initialLength = rack.equipment.length;
  rack.equipment = rack.equipment.filter(eq => eq.id !== equipmentId);
  
  return rack.equipment.length !== initialLength;
};

// Add a virtual machine to a server
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

// Update a virtual machine
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

// Remove a virtual machine
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
