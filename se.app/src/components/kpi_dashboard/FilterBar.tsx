import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X, Check, ChevronsUpDown } from "lucide-react";
import { format, subDays, subMonths, subQuarters, subYears, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Project } from "@/types/kpi_dashboard/types";

interface FilterBarProps {
  projects: Project[];
  onFilterChange: (filters: any) => void;
}

const datePresets = [
  { label: "All Time", value: "all" },
  { label: "This Year", value: "yearly" },
  { label: "This Quarter", value: "quarterly" },
  { label: "This Month", value: "monthly" },
  { label: "This Week", value: "weekly" },
  { label: "Custom", value: "custom" },
];

export const FilterBar = ({ projects, onFilterChange }: FilterBarProps) => {
  const [datePreset, setDatePreset] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [client, setClient] = useState<string>("all");
  const [leader, setLeader] = useState<string>("all");
  const [businessType, setBusinessType] = useState<string>("all");
  const [billingType, setBillingType] = useState<string>("all");
  const [openClient, setOpenClient] = useState(false);
  const [openLeader, setOpenLeader] = useState(false);

  // Extract unique clients and leaders from data
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    projects.forEach((project) => {
      clients.add(project.clientName.name);
    });
    return Array.from(clients).sort();
  }, [projects]);

  const uniqueLeaders = useMemo(() => {
    const leaders = new Set<string>();
    projects.forEach((project) => {
      leaders.add(`${project.lead.firstName} ${project.lead.lastName}`);
    });
    return Array.from(leaders).sort();
  }, [projects]);

  // Label maps for Selects
  const periodLabelMap = useMemo(
    () => Object.fromEntries(datePresets.map((p) => [p.value, p.label] as const)),
    []
  );

  const businessTypeLabels = useMemo(
    () => ({
      all: "All Types",
      cabinets: "Cabinets",
      commercial: "Commercial",
      "customer service": "Customer Service",
      exteriors: "Exteriors",
      "new construction": "New Construction",
      renovations: "Renovations",
      repaint: "Repaint",
      shop: "Shop",
    }),
    []
  );

  const billingLabels = useMemo(
    () => ({
      all: "All Billing",
      Quote: "Quote",
      "Cost Plus": "Cost Plus",
    }),
    []
  );

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = today;

    switch (preset) {
      case "yearly":
        from = startOfYear(today);
        break;
      case "quarterly":
        from = subQuarters(today, 1);
        break;
      case "monthly":
        from = subMonths(today, 1);
        break;
      case "weekly":
        from = subDays(today, 7);
        break;
      case "all":
        from = null;
        to = null;
        break;
    }

    if (preset !== "custom") {
      setDateRange({ from, to });
      emitFilters({ from, to });
    }
  };

  const emitFilters = (customDateRange?: { from: Date | null; to: Date | null }) => {
    const range = customDateRange || dateRange;
    onFilterChange({
      dateRange: { ...range, preset: datePreset },
      client: client === "all" ? null : client,
      leader: leader === "all" ? null : leader,
      businessType: businessType === "all" ? null : businessType,
      billingType: billingType === "all" ? null : billingType,
    });
  };

  const handleReset = () => {
    setDatePreset("all");
    setDateRange({ from: null, to: null });
    setClient("all");
    setLeader("all");
    setBusinessType("all");
    setBillingType("all");
    onFilterChange({
      dateRange: { from: null, to: null, preset: "all" },
      client: null,
      leader: null,
      businessType: null,
      billingType: null,
    });
  };

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-card rounded-lg border border-border/50 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
        <Select value={datePreset} onValueChange={handlePresetChange} valueToLabel={periodLabelMap}>
          <SelectTrigger className="w-[140px] h-9 bg-background border border-border rounded-md px-3 flex items-center justify-between">
            <span className="truncate"><SelectValue /></span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {datePresets.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {datePreset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d, yyyy")} -{" "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={{ from: dateRange.from || undefined, to: dateRange.to || undefined }}
              onSelect={(range) => {
                setDateRange({ from: range?.from || null, to: range?.to || null });
                if (range?.from && range?.to) {
                  emitFilters({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}

      <Popover open={openClient} onOpenChange={setOpenClient}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openClient}
            className="w-[180px] justify-between bg-background"
          >
            {client === "all" ? "All Clients" : client}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0 bg-popover border-border z-50">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    setClient("all");
                    setOpenClient(false);
                    setTimeout(() => emitFilters(), 0);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      client === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Clients
                </CommandItem>
                {uniqueClients.map((clientName) => (
                  <CommandItem
                    key={clientName}
                    value={clientName}
                    onSelect={(currentValue: string) => {
                      setClient(currentValue);
                      setOpenClient(false);
                      setTimeout(() => emitFilters(), 0);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        client === clientName ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {clientName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={openLeader} onOpenChange={setOpenLeader}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openLeader}
            className="w-[180px] justify-between bg-background"
          >
            {leader === "all" ? "All Leaders" : leader}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0 bg-popover border-border z-50">
          <Command>
            <CommandInput placeholder="Search leaders..." />
            <CommandList>
              <CommandEmpty>No leader found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    setLeader("all");
                    setOpenLeader(false);
                    setTimeout(() => emitFilters(), 0);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      leader === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Leaders
                </CommandItem>
                {uniqueLeaders.map((leaderName) => (
                  <CommandItem
                    key={leaderName}
                    value={leaderName}
                    onSelect={(currentValue: string) => {
                      setLeader(currentValue);
                      setOpenLeader(false);
                      setTimeout(() => emitFilters(), 0);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        leader === leaderName ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {leaderName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Select
        value={businessType}
        onValueChange={(value) => {
          setBusinessType(value);
          setTimeout(() => emitFilters(), 0);
        }}
        valueToLabel={businessTypeLabels}
      >
        <SelectTrigger className="w-[180px] h-9 bg-background border border-border rounded-md px-3 flex items-center justify-between">
          <span className="truncate"><SelectValue placeholder="All Types" /></span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="cabinets">Cabinets</SelectItem>
          <SelectItem value="commercial">Commercial</SelectItem>
          <SelectItem value="customer service">Customer Service</SelectItem>
          <SelectItem value="exteriors">Exteriors</SelectItem>
          <SelectItem value="new construction">New Construction</SelectItem>
          <SelectItem value="renovations">Renovations</SelectItem>
          <SelectItem value="repaint">Repaint</SelectItem>
          <SelectItem value="shop">Shop</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={billingType}
        onValueChange={(value) => {
          setBillingType(value);
          setTimeout(() => emitFilters(), 0);
        }}
        valueToLabel={billingLabels}
      >
        <SelectTrigger className="w-[160px] h-9 bg-background border border-border rounded-md px-3 flex items-center justify-between">
          <span className="truncate"><SelectValue placeholder="All Billing" /></span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="all">All Billing</SelectItem>
          <SelectItem value="Quote">Quote</SelectItem>
          <SelectItem value="Cost Plus">Cost Plus</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={handleReset} className="ml-auto">
        <X className="h-4 w-4 mr-1" />
        Reset
      </Button>
    </div>
  );
};
