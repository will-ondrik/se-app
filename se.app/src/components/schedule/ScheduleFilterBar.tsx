"use client";

import React from "react";
import type { Client as SClient, Crew as SCrew, JobStatus } from "@/types/schedule/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type StatusFilter = "all" | JobStatus;

export interface ScheduleFilterBarProps {
  clients: SClient[];
  crews: SCrew[];
  selectedClientId: number | "all";
  setSelectedClientId: (v: number | "all") => void;
  selectedCrewId: number | "all";
  setSelectedCrewId: (v: number | "all") => void;
  selectedStatus: StatusFilter;
  setSelectedStatus: (v: StatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  compact?: boolean;
  // optional management handlers to mirror Schedule page behavior
  onManageClients?: () => void;
  onManageCrews?: () => void;
}

/**
 * ScheduleFilterBar
 * - Uniform filter surface (Client, Crew, Status, Search)
 * - Matches the styling used on SchedulePage (combobox + select + search)
 * - Stateless UI; state is controlled by parent
 */
export function ScheduleFilterBar({
  clients,
  crews,
  selectedClientId,
  setSelectedClientId,
  selectedCrewId,
  setSelectedCrewId,
  selectedStatus,
  setSelectedStatus,
  searchQuery,
  setSearchQuery,
  compact = false,
  onManageClients,
  onManageCrews,
}: ScheduleFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <ClientCombobox
        clients={clients}
        value={selectedClientId}
        onChange={setSelectedClientId}
        buttonClassName={compact ? "h-9 min-w-[160px]" : "h-9 min-w-[200px]"}
      />
      <CrewCombobox
        crews={crews}
        value={selectedCrewId}
        onChange={setSelectedCrewId}
        buttonClassName={compact ? "h-9 min-w-[160px]" : "h-9 min-w-[200px]"}
      />
      {onManageClients || onManageCrews ? (
        <div className="flex items-center gap-2">
          {onManageClients && (
            <Button variant="outline" size="sm" onClick={onManageClients}>
              Manage Clients
            </Button>
          )}
          {onManageCrews && (
            <Button variant="outline" size="sm" onClick={onManageCrews}>
              Manage Crews
            </Button>
          )}
        </div>
      ) : null}
      <Select value={String(selectedStatus)} onValueChange={(v) => setSelectedStatus(v === "all" ? "all" : (v as JobStatus))}>
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Search jobs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={compact ? "h-9 w-[180px] sm:w-[220px]" : "h-9 w-[200px] sm:w-[260px]"}
      />
    </div>
  );
}

function ClientCombobox({
  clients,
  value,
  onChange,
  buttonClassName,
}: {
  clients: SClient[];
  value: number | "all";
  onChange: (v: number | "all") => void;
  buttonClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const current = value === "all" ? null : clients.find((c) => c.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={buttonClassName || "h-9 min-w-[200px] justify-between"}>
          {current ? current.name : "All clients"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <div className="flex items-center gap-2 p-2">
            <CommandInput placeholder="Search clients..." className="h-8" />
          </div>
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => { onChange("all"); setOpen(false); }}>
                All clients
              </CommandItem>
              {clients.map((c) => (
                <CommandItem key={c.id} value={String(c.id)} onSelect={() => { onChange(c.id); setOpen(false); }}>
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CrewCombobox({
  crews,
  value,
  onChange,
  buttonClassName,
}: {
  crews: SCrew[];
  value: number | "all";
  onChange: (v: number | "all") => void;
  buttonClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const current = value === "all" ? null : crews.find((c) => c.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={buttonClassName || "h-9 min-w-[200px] justify-between"}>
          <span className="flex items-center gap-2">
            {current && (
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: current.colorHex || "#64748b" }}
              />
            )}
            {current ? current.name : "All crews"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <div className="flex items-center gap-2 p-2">
            <CommandInput placeholder="Search crews..." className="h-8" />
          </div>
          <CommandList>
            <CommandEmpty>No crews found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => { onChange("all"); setOpen(false); }}>
                All crews
              </CommandItem>
              {crews.map((c) => (
                <CommandItem key={c.id} value={String(c.id)} onSelect={() => { onChange(c.id); setOpen(false); }}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.colorHex || "#64748b" }}
                    />
                    {c.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ScheduleFilterBar;
