
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardHeader from '@/components/DashboardHeader';
import RackCard from '@/components/RackCard';
import { getAllRackSummaries } from '@/services/rackService';
import { Rack } from '@/types/rack';
import AddRackDialog from '@/components/AddRackDialog';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [addRackDialogOpen, setAddRackDialogOpen] = useState(false);
  
  const { 
    data: rackSummaries, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['rackSummaries'],
    queryFn: getAllRackSummaries
  });
  
  const handleRackAdded = (rack: Rack) => {
    refetch();
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <DashboardHeader 
        title="Server Rack Management" 
        onAddNew={() => setAddRackDialogOpen(true)} 
        addNewLabel="Add Rack"
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : rackSummaries && rackSummaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rackSummaries.map((rack) => (
            <RackCard key={rack.id} rack={rack} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border rounded-lg glassmorphism animate-fade-in">
          <h3 className="text-xl font-medium mb-2">No Racks Found</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Start by adding your first server rack to manage your data center equipment.
          </p>
          <button 
            onClick={() => setAddRackDialogOpen(true)}
            className="text-primary hover:underline focus:outline-none"
          >
            + Add Your First Rack
          </button>
        </div>
      )}
      
      <AddRackDialog 
        open={addRackDialogOpen} 
        onOpenChange={setAddRackDialogOpen} 
        onRackAdded={handleRackAdded}
      />
    </div>
  );
};

export default Index;
