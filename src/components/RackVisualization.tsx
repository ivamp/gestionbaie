
import React, { useState } from 'react';
import { Equipment, Rack } from '@/types/rack';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Cpu, Edit, Package, Battery } from 'lucide-react';
import EquipmentDetailPanel from './EquipmentDetailPanel';
import EditEquipmentDialog from './EditEquipmentDialog';
import { toast } from 'sonner';

interface RackVisualizationProps {
  rack: Rack;
  onAddEquipment?: () => void;
  onEquipmentUpdated?: () => void;
}

const RackVisualization: React.FC<RackVisualizationProps> = ({ 
  rack, 
  onAddEquipment, 
  onEquipmentUpdated 
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Fonction d'aide pour générer une chaîne de position
  const getPositionString = (equipment: Equipment) => {
    const start = equipment.position;
    const end = equipment.position + equipment.size - 1;
    return start === end ? `U${start}` : `U${start}-U${end}`;
  };
  
  // Gérer la sélection d'équipement
  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment === selectedEquipment ? null : equipment);
  };
  
  // Gérer la mise à jour d'un équipement
  const handleEquipmentUpdated = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEditDialogOpen(false);
    if (onEquipmentUpdated) {
      onEquipmentUpdated();
    }
    toast.success(`${equipment.name} mis à jour avec succès`);
  };
  
  // Gérer la suppression d'un équipement
  const handleEquipmentRemoved = () => {
    setSelectedEquipment(null);
    if (onEquipmentUpdated) {
      onEquipmentUpdated();
    }
    toast.success("Équipement supprimé avec succès");
  };

  // Obtenir l'icône basée sur le type d'équipement
  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'switch': return <Cpu className="h-4 w-4" />;
      case 'accessory': return <Package className="h-4 w-4" />;
      case 'ups': return <Battery className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  // Rendu des unités de rack avec équipements
  const renderRackUnits = () => {
    // Créer un tableau pour représenter chaque unité dans le rack
    const rackUnits = [];
    
    // Initialiser toutes les unités comme vides
    for (let i = rack.totalUnits; i >= 1; i--) {
      let unitContent = (
        <div key={`empty-${i}`} className="rack-unit group h-12">
          <div className="rack-label">{i}</div>
          <div className="h-full ml-10 flex items-center px-3">
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Vide
            </span>
          </div>
        </div>
      );
      
      // Vérifier si cette unité est occupée par un équipement
      const occupyingEquipment = rack.equipment.find(eq => {
        const startPos = eq.position;
        const endPos = startPos + eq.size - 1;
        return i >= startPos && i <= endPos;
      });
      
      if (occupyingEquipment) {
        // Si c'est la première unité de l'équipement, afficher l'équipement complet
        if (i === occupyingEquipment.position) {
          const equipmentHeight = occupyingEquipment.size * 48; // 48px par unité
          const getEquipmentClass = () => {
            switch (occupyingEquipment.type) {
              case 'switch': return 'switch-equipment bg-blue-50 dark:bg-blue-950';
              case 'server': return 'server-equipment bg-green-50 dark:bg-green-950';
              case 'accessory': return 'accessory-equipment bg-purple-50 dark:bg-purple-950';
              case 'ups': return 'ups-equipment bg-amber-50 dark:bg-amber-950';
              default: return '';
            }
          };
          
          unitContent = (
            <div 
              key={`equipment-${occupyingEquipment.id}-${i}`}
              className={`rack-unit-occupied ${getEquipmentClass()} border-b cursor-pointer ${
                selectedEquipment?.id === occupyingEquipment.id ? 'ring-2 ring-primary' : ''
              }`}
              style={{ height: `${equipmentHeight}px` }}
              onClick={() => handleEquipmentClick(occupyingEquipment)}
            >
              {/* Labels pour chaque unité */}
              <div className="rack-labels">
                {Array.from({ length: occupyingEquipment.size }, (_, index) => {
                  const unitNumber = occupyingEquipment.position + index;
                  return (
                    <div key={`label-${unitNumber}`} className="rack-label h-12">{unitNumber}</div>
                  );
                })}
              </div>
              
              <div className="ml-10 p-3 h-full flex flex-col">
                <div className="flex items-center gap-2">
                  {getEquipmentIcon(occupyingEquipment.type)}
                  <span className="font-medium text-sm">{occupyingEquipment.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {occupyingEquipment.type === 'accessory' 
                    ? getPositionString(occupyingEquipment)
                    : `${occupyingEquipment.brand} - ${getPositionString(occupyingEquipment)}`
                  }
                </div>
                
                {occupyingEquipment.type === 'switch' && (
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">Ports:</span> {occupyingEquipment.portCount || 0} RJ45
                    {occupyingEquipment.sfpPortCount ? `, ${occupyingEquipment.sfpPortCount} SFP` : ''}
                  </div>
                )}
                
                {occupyingEquipment.type === 'server' && occupyingEquipment.virtualMachines && (
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">VMs:</span> {occupyingEquipment.virtualMachines.length}
                  </div>
                )}
                
                {occupyingEquipment.type === 'ups' && occupyingEquipment.power && (
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">Puissance:</span> {occupyingEquipment.power}
                  </div>
                )}
              </div>
            </div>
          );
          
          // Skip the next n-1 units that are also part of this equipment
          i -= (occupyingEquipment.size - 1);
        } else {
          // Pour les autres unités de l'équipement, ne rien afficher
          continue;
        }
      }
      
      rackUnits.push(unitContent);
    }
    
    return rackUnits;
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
                  {renderRackUnits()}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:w-1/2 xl:w-3/5">
        {selectedEquipment ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setEditDialogOpen(true)}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Edit className="h-4 w-4" />
                Modifier cet équipement
              </button>
            </div>
            <EquipmentDetailPanel equipment={selectedEquipment} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8 border rounded-lg bg-muted/30">
            <div className="text-center max-w-md">
              <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Aucun Équipement Sélectionné</h3>
              <p className="text-muted-foreground mb-4">
                Sélectionnez un appareil dans la baie pour voir ses détails ou ajoutez un nouvel équipement.
              </p>
              {onAddEquipment && (
                <button 
                  onClick={onAddEquipment}
                  className="text-primary hover:underline focus:outline-none"
                >
                  + Ajouter Nouvel Équipement
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {selectedEquipment && (
        <EditEquipmentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          rack={rack}
          equipment={selectedEquipment}
          onEquipmentUpdated={handleEquipmentUpdated}
          onEquipmentRemoved={handleEquipmentRemoved}
        />
      )}
    </div>
  );
};

export default RackVisualization;
