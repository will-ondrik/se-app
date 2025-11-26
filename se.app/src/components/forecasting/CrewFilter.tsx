import { Crew } from "@/types/forecasting/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CrewFilterProps {
  crews: Crew[];
  selectedCrewId: number | null;
  onCrewChange: (crewId: number | null) => void;
}

export const CrewFilter = ({
  crews,
  selectedCrewId,
  onCrewChange,
}: CrewFilterProps) => {
  return (
    <Select
      value={selectedCrewId?.toString() || "all"}
      onValueChange={(value) =>
        onCrewChange(value === "all" ? null : parseInt(value))
      }
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="All crews" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All crews</SelectItem>
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
  );
};
