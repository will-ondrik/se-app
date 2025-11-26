import { useEffect, useState } from "react";
import { Job, Client, Crew } from "@/types/forecasting/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JobModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (job: Omit<Job, "id"> | Job) => void;
  job?: Job | null;
  clients: Client[];
  crews: Crew[];
  onCreateClient: (client: Omit<Client, "id">) => void;
}

export const JobModal = ({
  open,
  onClose,
  onSave,
  job,
  clients,
  crews,
  onCreateClient,
}: JobModalProps) => {
  const [formData, setFormData] = useState<Partial<Job>>({
    title: "",
    description: "",
    clientId: undefined,
    crewId: undefined,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    estimatedHours: undefined,
    estimatedRevenue: undefined,
  });

  const [showClientForm, setShowClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (job) {
      setFormData(job);
    } else {
      setFormData({
        title: "",
        description: "",
        clientId: undefined,
        crewId: undefined,
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
        estimatedHours: undefined,
        estimatedRevenue: undefined,
      });
    }
    setShowClientForm(false);
  }, [job, open]);

  const handleSave = () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      return;
    }

    if (job) {
      onSave({ ...job, ...formData });
    } else {
      onSave(formData as Omit<Job, "id">);
    }

    onClose();
  };

  const handleCreateClient = () => {
    if (!newClient.name) return;

    onCreateClient(newClient);
    setShowClientForm(false);
    setNewClient({ name: "", email: "", phone: "", address: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job" : "Add New Job"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Exterior Paint - 2 Story House"
            />
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            {!showClientForm ? (
              <div className="space-y-2">
                <Select
                  value={formData.clientId?.toString()}
                  onValueChange={(value) => {
                    if (value === "new") {
                      setShowClientForm(true);
                    } else {
                      setFormData({ ...formData, clientId: parseInt(value) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Add new client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-sm">New Client</h4>
                <Input
                  placeholder="Client Name *"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                />
                <Input
                  placeholder="Phone"
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                />
                <Input
                  placeholder="Address"
                  value={newClient.address}
                  onChange={(e) =>
                    setNewClient({ ...newClient, address: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateClient} size="sm">
                    Save Client
                  </Button>
                  <Button
                    onClick={() => setShowClientForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Crew</Label>
            <Select
              value={formData.crewId?.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, crewId: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a crew" />
              </SelectTrigger>
              <SelectContent>
                {crews.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: crew.colorHex }}
                      />
                      {crew.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate
                      ? format(new Date(formData.startDate), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.startDate
                        ? new Date(formData.startDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      setFormData({
                        ...formData,
                        startDate: format(date, "yyyy-MM-dd"),
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate
                      ? format(new Date(formData.endDate), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.endDate ? new Date(formData.endDate) : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      setFormData({
                        ...formData,
                        endDate: format(date, "yyyy-MM-dd"),
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Estimated Hours</Label>
              <Input
                id="hours"
                type="number"
                value={formData.estimatedHours || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedHours: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue">Estimated Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                value={formData.estimatedRevenue || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedRevenue: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add any notes or details about this job..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
