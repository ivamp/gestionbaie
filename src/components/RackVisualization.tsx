
import React, { useState } from 'react';
import { Equipment, Rack } from '@/types/rack';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Cpu, Edit } from 'lucide-react';
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

  // Construire la visualisation des unités de la baie avec des équipements unifiés
  const renderUnifiedRackUnits = () => {
    const rackUnitsMap = new Map<number, { unitNumber: number, equipment: Equipment | null }>();
    
    // Initialiser toutes les unités comme vides
    for (let i = 1; i <= rack.totalUnits; i++) {
      rackUnitsMap.set(i, { unitNumber: i, equipment: null });
    }
    
    // Marquer les unités occupées par des équipements
    rack.equipment.forEach(equipment => {
      const start = equipment.position;
      const end = start + equipment.size - 1;
      
      for (let i = start; i <= end; i++) {
        if (rackUnitsMap.has(i)) {
          rackUnitsMap.set(i, { unitNumber: i, equipment });
        }
      }
    });
    
    // Convertir la map en tableau trié par numéro d'unité (décroissant)
    const sortedUnits = Array.from(rackUnitsMap.values())
      .sort((a, b) => b.unitNumber - a.unitNumber);
    
    // Créer des segments unifiés pour l'affichage
    const unifiedSegments: JSX.Element[] = [];
    let currentEquipment: Equipment | null = null;
    let segmentStart = 0;
    
    sortedUnits.forEach((unit, index) => {
      // Si on commence un nouveau segment ou on change d'équipement
      if (unit.equipment !== currentEquipment) {
        // Si on avait un équipement avant, on finalise le segment précédent
        if (currentEquipment && segmentStart < index) {
          unifiedSegments.push(renderEquipmentSegment(currentEquipment, sortedUnits.slice(segmentStart, index)));
        }
        
        // On démarre un nouveau segment
        currentEquipment = unit.equipment;
        segmentStart = index;
      }
      
      // Pour le dernier élément, on finalise le segment en cours
      if (index === sortedUnits.length - 1) {
        unifiedSegments.push(
          currentEquipment 
            ? renderEquipmentSegment(currentEquipment, sortedUnits.slice(segmentStart, index + 1))
            : renderEmptyUnit(unit.unitNumber)
        );
      }
    });
    
    return unifiedSegments;
  };
  
  // Rendu d'un segment unifié pour un équipement
  const renderEquipmentSegment = (equipment: Equipment, units: { unitNumber: number, equipment: Equipment | null }[]) => {
    // S'il n'y a pas d'équipement ou d'unités, on ne rend rien
    if (!equipment || units.length === 0) return null;
    
    const firstUnit = units[0];
    const lastUnit = units[units.length - 1];
    const equipmentHeight = units.length * 48; // 48px par unité
    const isFirstUnit = equipment.position === firstUnit.unitNumber;
    
    // Si ce n'est pas la première unité de l'équipement, on affiche juste le numéro d'unité
    if (!isFirstUnit) {
      return (
        <div key={`unit-${firstUnit.unitNumber}-${lastUnit.unitNumber}`} className="rack-label-only">
          {units.map(unit => (
            <div key={`label-${unit.unitNumber}`} className="rack-label h-12">{unit.unitNumber}</div>
          ))}
        </div>
      );
    }
    
    // Si c'est la première unité, on affiche l'équipement complet
    const equipmentClass = equipment.type === 'switch' ? 'switch-equipment' : 'server-equipment';
    
    return (
      <div 
        key={`equipment-${equipment.id}`}
        className={`rack-unit-occupied ${equipmentClass} border-b cursor-pointer ${
          selectedEquipment?.id === equipment.id ? 'ring-2 ring-primary' : ''
        }`}
        style={{ height: `${equipmentHeight}px` }}
        onClick={() => handleEquipmentClick(equipment)}
      >
        <div className="rack-labels">
          {units.map(unit => (
            <div key={`label-${unit.unitNumber}`} className="rack-label h-12">{unit.unitNumber}</div>
          ))}
        </div>
        <div className="ml-10 p-3 h-full flex flex-col">
          <div className="flex items-center gap-2">
            {equipment.type === 'switch' ? (
              <Cpu className="h-4 w-4" />
            ) : (
              <Server className="h-4 w-4" />
            )}
            <span className="font-medium text-sm">{equipment.name}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {equipment.brand} - {getPositionString(equipment)}
          </div>
          
          {equipment.type === 'switch' && (
            <div className="text-xs mt-1">
              <span className="text-muted-foreground">Ports:</span> {equipment.portCount}
            </div>
          )}
          
          {equipment.type === 'server' && equipment.virtualMachines && (
            <div className="text-xs mt-1">
              <span className="text-muted-foreground">VMs:</span> {equipment.virtualMachines.length}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Rendu d'une unité vide
  const renderEmptyUnit = (unitNumber: number) => (
    <div key={`unit-${unitNumber}`} className="rack-unit group h-12">
      <div className="rack-label">{unitNumber}</div>
      <div className="h-full ml-10 flex items-center px-3">
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Vide
        </span>
      </div>
    </div>
  );
  
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
                  {renderUnifiedRackUnits()}
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
