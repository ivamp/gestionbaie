
import React from 'react';
import { Equipment, VirtualMachine } from '@/types/rack';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Cpu, 
  Network, 
  Monitor, 
  Info, 
  LayoutGrid, 
  Layers
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EquipmentDetailPanelProps {
  equipment: Equipment;
}

const VirtualMachineCard: React.FC<{ vm: VirtualMachine }> = ({ vm }) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-sm">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold">{vm.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-1">{vm.description}</CardDescription>
          </div>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">IP Address</span>
            <span className="font-mono">{vm.ipAddress}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">AnyDesk Code</span>
            <span className="font-mono">{vm.anydeskCode}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EquipmentDetailPanel: React.FC<EquipmentDetailPanelProps> = ({ equipment }) => {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5">
            <Badge variant="outline" className="bg-primary/5">
              {equipment.type === 'switch' ? 'Network Switch' : 'Server'}
            </Badge>
            <Badge variant="outline" className="bg-secondary">
              {equipment.size}U
            </Badge>
          </div>
          <h2 className="text-2xl font-bold mt-1">{equipment.name}</h2>
          <p className="text-muted-foreground">{equipment.brand}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {equipment.type === 'switch' ? (
            <Cpu className="h-10 w-10 p-2 bg-blue-500/10 text-blue-500 rounded-lg" />
          ) : (
            <Server className="h-10 w-10 p-2 bg-amber-500/10 text-amber-500 rounded-lg" />
          )}
        </div>
      </div>
      
      <Separator />
      
      {equipment.type === 'switch' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">IP Address</div>
                    <div className="font-mono text-sm">{equipment.ipAddress}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Port Count</div>
                    <div>{equipment.portCount} ports</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  VLANs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 mt-2">
                  {equipment.vlans?.map((vlan, index) => (
                    <Badge key={index} variant="outline" className="bg-secondary">
                      {vlan}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Position</div>
                    <div>U{equipment.position}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Size</div>
                    <div>{equipment.size}U</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vms">Virtual Machines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Server Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">iDRAC IP</div>
                      <div className="font-mono text-sm">{equipment.idracIp}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Description</div>
                      <div className="text-sm">{equipment.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Virtual Machines
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">VM Count</div>
                      <div>{equipment.virtualMachines?.length || 0} virtual machines</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Position</div>
                      <div>U{equipment.position}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Size</div>
                      <div>{equipment.size}U</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="vms" className="mt-4">
            {equipment.virtualMachines && equipment.virtualMachines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.virtualMachines.map(vm => (
                  <VirtualMachineCard key={vm.id} vm={vm} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <Layers className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Virtual Machines</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  This server doesn't have any virtual machines yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default EquipmentDetailPanel;
