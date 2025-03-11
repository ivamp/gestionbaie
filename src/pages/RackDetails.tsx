
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRack } from '@/services/rackService';
import DashboardHeader from '@/components/DashboardHeader';
import RackVisualization from '@/components/RackVisualization';
import AddEquipmentDialog from '@/components/AddEquipmentDialog';
import { Equipment } from '@/types/rack';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const RackDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addEquipmentDialogOpen, setAddEquipmentDialogOpen] = useState(false);
  
  const { 
    data: rack, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['rack', id],
    queryFn: () => getRack(id || ''),
    enabled: !!id
  });
  
  const handleEquipmentAdded = (equipment: Equipment) => {
    refetch();
  };
  
  const goBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }
  
  if (!rack) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h3 className="text-xl font-medium mb-2">Rack Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The requested rack does not exist.
          </p>
          <Button onClick={goBack}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  // Calculate free units
  const usedUnits = rack.equipment.reduce((total, eq) => total + eq.size, 0);
  const freeUnits = rack.totalUnits - usedUnits;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 hover:-translate-x-1 transition-transform" 
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <DashboardHeader 
        title={rack.name}
        onAddNew={() => setAddEquipmentDialogOpen(true)}
        addNewLabel="Add Equipment"
      />
      
      <div className="bg-primary/5 rounded-lg p-3 mb-6 flex flex-col md:flex-row gap-4 animate-fade-in">
        <div className="flex-1 p-3 rounded bg-background shadow-sm">
          <div className="text-xs text-muted-foreground">Location</div>
          <div className="font-medium">{rack.location}</div>
        </div>
        <div className="flex-1 p-3 rounded bg-background shadow-sm">
          <div className="text-xs text-muted-foreground">Total Capacity</div>
          <div className="font-medium">{rack.totalUnits}U</div>
        </div>
        <div className="flex-1 p-3 rounded bg-background shadow-sm">
          <div className="text-xs text-muted-foreground">Free Units</div>
          <div className="font-medium">{freeUnits}U</div>
        </div>
        <div className="flex-1 p-3 rounded bg-background shadow-sm">
          <div className="text-xs text-muted-foreground">Equipment Count</div>
          <div className="font-medium">{rack.equipment.length} devices</div>
        </div>
      </div>
      
      <RackVisualization 
        rack={rack} 
        onAddEquipment={() => setAddEquipmentDialogOpen(true)}
      />
      
      <AddEquipmentDialog
        open={addEquipmentDialogOpen}
        onOpenChange={setAddEquipmentDialogOpen}
        rack={rack}
        onEquipmentAdded={handleEquipmentAdded}
      />
    </div>
  );
};

export default RackDetails;
