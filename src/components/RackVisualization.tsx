
import React, { useState } from 'react';
import { Equipment, Rack } from '@/types/rack';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Cpu } from 'lucide-react';
import EquipmentDetailPanel from './EquipmentDetailPanel';

interface RackVisualizationProps {
  rack: Rack;
  onAddEquipment?: () => void;
  onEditEquipment?: (equipment: Equipment) => void;
}

const RackVisualization: React.FC<RackVisualizationProps> = ({ 
  rack, 
  onAddEquipment, 
  onEditEquipment 
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Build rack units visualization
  const rackUnits = Array.from({ length: rack.totalUnits }, (_, i) => {
    const unitNumber = rack.totalUnits - i; // Rack units start from bottom
    const occupyingEquipment = rack.equipment.find(eq => {
      const equipmentStart = eq.position;
      const equipmentEnd = eq.position + eq.size - 1;
      return unitNumber >= equipmentStart && unitNumber <= equipmentEnd;
    });
    
    return { unitNumber, occupyingEquipment };
  });
  
  // Helper to generate position string
  const getPositionString = (equipment: Equipment) => {
    const start = equipment.position;
    const end = equipment.position + equipment.size - 1;
    return start === end ? `U${start}` : `U${start}-U${end}`;
  };
  
  // Handle equipment selection
  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment === selectedEquipment ? null : equipment);
    if (onEditEquipment) onEditEquipment(equipment);
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
      <div className="lg:w-1/2 xl:w-2/5">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-1 mb-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md text-center">
            <h3 className="font-medium text-sm">{rack.name}</h3>
            <p className="text-xs text-muted-foreground">{rack.location}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border overflow-hidden">
          <div className="rack-visualization border-b p-4 flex justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-full max-w-sm">
              <ScrollArea className="h-[600px] rounded border">
                <div className="flex flex-col">
                  {rackUnits.map(({ unitNumber, occupyingEquipment }) => {
                    // Non-occupied unit
                    if (!occupyingEquipment) {
                      return (
                        <div key={`unit-${unitNumber}`} className="rack-unit group">
                          <div className="rack-label">{unitNumber}</div>
                          <div className="h-full ml-10 flex items-center px-3">
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              Empty
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    // Render first U of equipment
                    if (occupyingEquipment.position === unitNumber) {
                      const equipmentClass = occupyingEquipment.type === 'switch' 
                        ? 'switch-equipment' 
                        : 'server-equipment';
                        
                      return (
                        <div 
                          key={`equipment-${occupyingEquipment.id}`}
                          className={`rack-unit-occupied ${equipmentClass} h-[${occupyingEquipment.size * 48}px] border-b cursor-pointer ${
                            selectedEquipment?.id === occupyingEquipment.id ? 'ring-2 ring-primary' : ''
                          }`}
                          style={{ height: `${occupyingEquipment.size * 48}px` }}
                          onClick={() => handleEquipmentClick(occupyingEquipment)}
                        >
                          <div className="rack-label">{unitNumber}</div>
                          <div className="ml-10 p-3 h-full flex flex-col">
                            <div className="flex items-center gap-2">
                              {occupyingEquipment.type === 'switch' ? (
                                <Cpu className="h-4 w-4" />
                              ) : (
                                <Server className="h-4 w-4" />
                              )}
                              <span className="font-medium text-sm">{occupyingEquipment.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {occupyingEquipment.brand} - {getPositionString(occupyingEquipment)}
                            </div>
                            
                            {occupyingEquipment.type === 'switch' && (
                              <div className="text-xs mt-1">
                                <span className="text-muted-foreground">Ports:</span> {occupyingEquipment.portCount}
                              </div>
                            )}
                            
                            {occupyingEquipment.type === 'server' && occupyingEquipment.virtualMachines && (
                              <div className="text-xs mt-1">
                                <span className="text-muted-foreground">VMs:</span> {occupyingEquipment.virtualMachines.length}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    // Continuation units (not the first U of equipment)
                    return (
                      <div key={`unit-${unitNumber}`} className="rack-label-only h-12 relative">
                        <div className="rack-label">{unitNumber}</div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:w-1/2 xl:w-3/5">
        {selectedEquipment ? (
          <EquipmentDetailPanel equipment={selectedEquipment} />
        ) : (
          <div className="h-full flex items-center justify-center p-8 border rounded-lg bg-muted/30">
            <div className="text-center max-w-md">
              <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Equipment Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a device from the rack to view its details or add a new equipment.
              </p>
              {onAddEquipment && (
                <button 
                  onClick={onAddEquipment}
                  className="text-primary hover:underline focus:outline-none"
                >
                  + Add New Equipment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RackVisualization;
