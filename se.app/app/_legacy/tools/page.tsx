import { useState } from "react";
import { Plus, Search, Filter, QrCode, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockTools, getConditionBadgeColor } from "@/lib/mock-data";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useNavigate } from "react-router-dom";
import { ToolsMap } from "@/components/ToolsMap";
import { Label } from "@/components/ui/label";

export default function Tools() {
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const navigate = useNavigate();

  const filteredTools = availabilityFilter === "all" 
    ? mockTools 
    : mockTools.filter(t => availabilityFilter === "available" ? t.isAvailable : !t.isAvailable);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Tools & Inventory
            <InfoTooltip content="Manage your tools and equipment with QR code tracking" className="ml-2" />
          </h1>
          <p className="text-muted-foreground">Track and manage all your equipment</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Tool
        </Button>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tools..." className="pl-10" />
        </div>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tools</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in-use">In Use</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("map")}
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "map" && (
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border border-border">
            <Label htmlFor="mapbox-token" className="text-sm font-medium">
              Mapbox Access Token
              <InfoTooltip content="Get your free token at mapbox.com" className="ml-2" />
            </Label>
            <Input
              id="mapbox-token"
              type="password"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your Mapbox token to view tools on the map
            </p>
          </div>
        </div>
      )}

      {viewMode === "table" ? (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Last Serviced</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>QR Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTools.map((tool) => (
                <TableRow 
                  key={tool.id} 
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/tools/${tool.id}`)}
                >
                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell>
                    <Badge variant={tool.isAvailable ? "default" : "secondary"}>
                      {tool.isAvailable ? "Available" : "In Use"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getConditionBadgeColor(tool.condition)}>
                      {tool.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(tool.lastServiced).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {tool.assignedTo ? `${tool.assignedTo.firstName} ${tool.assignedTo.lastName}` : "-"}
                  </TableCell>
                  <TableCell>{tool.jobId || "-"}</TableCell>
                  <TableCell>
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <ToolsMap tools={filteredTools} mapboxToken={mapboxToken} />
      )}
    </div>
  );
}