import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import type { Client as SClient, Crew as SCrew, Job as SJob, JobStatus } from "@/types/schedule/types";
import { getJobs as apiGetJobs, getClients as apiGetClients, getCrews as apiGetCrews } from "@/lib/scheduleApi";
import { mapScheduleDataToDomain, mapScheduleCrewToDomain } from "@/lib/scheduling/adapters";
import { findScheduleConflicts, conflictJobIdSetFromBlocks } from "@/lib/scheduling/utils";
import type { JobTimeBlock, Crew as DCrew } from "@/types/domain/scheduling";

export type UseScheduleBlocksParams = {
  start: Date;
  end: Date;
  clientId?: number | "all";
  crewId?: number | "all";
  status?: "all" | JobStatus;
  searchQuery?: string;
};

type State<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export type UseScheduleBlocksResult = {
  clients: State<SClient[]>;
  crews: State<SCrew[]>;
  jobs: State<SJob[]>;
  blocks: JobTimeBlock[];
  domainCrews: DCrew[];
  conflictJobIds: Set<number>;
};

/**
 * useScheduleBlocks
 * - Fetches scheduleApi data in given date range
 * - Adapts schedule jobs -> JobTimeBlock[]
 * - Computes conflicts (crew overlap + daily over-capacity with default 8h)
 * - Returns a Set of schedule job IDs that are conflicted (for easy UI decoration)
 */
export function useScheduleBlocks(params: UseScheduleBlocksParams): UseScheduleBlocksResult {
  const { start, end, clientId, crewId, status, searchQuery } = params;

  const [clients, setClients] = useState<State<SClient[]>>({ data: [], loading: true, error: null });
  const [crews, setCrews] = useState<State<SCrew[]>>({ data: [], loading: true, error: null });
  const [jobs, setJobs] = useState<State<SJob[]>>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setClients((s) => ({ ...s, loading: true, error: null }));
      setCrews((s) => ({ ...s, loading: true, error: null }));

      try {
        const [c, r] = await Promise.all([apiGetClients(), apiGetCrews()]);
        if (!cancelled) {
          setClients({ data: c, loading: false, error: null });
          setCrews({ data: r, loading: false, error: null });
        }
      } catch (e: any) {
        if (!cancelled) {
          setClients((s) => ({ ...s, loading: false, error: e?.message || "Failed to load clients" }));
          setCrews((s) => ({ ...s, loading: false, error: e?.message || "Failed to load crews" }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setJobs((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await apiGetJobs({
          start: format(start, "yyyy-MM-dd"),
          end: format(end, "yyyy-MM-dd"),
          clientId: clientId === "all" ? undefined : clientId,
          crewId: crewId === "all" ? undefined : crewId,
        });

        // Apply uniform filtering logic (status + search) to mirror SchedulePage
        const q = (searchQuery ?? "").trim().toLowerCase();
        const filtered = data.filter((j) => {
          const statusOk = (status ?? "all") === "all" || j.status === status;
          if (!q) return statusOk;
          const hay = [j.title, j.address, j.client?.name].map((s) => (s || "").toLowerCase()).join(" ");
          return statusOk && hay.includes(q);
        });

        if (!cancelled) {
          setJobs({ data: filtered, loading: false, error: null });
        }
      } catch (e: any) {
        if (!cancelled) {
          setJobs({ data: [], loading: false, error: e?.message || "Failed to load jobs" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [start, end, clientId, crewId, status, searchQuery]);

  const domainCrews: DCrew[] = useMemo(() => crews.data.map(mapScheduleCrewToDomain), [crews.data]);

  const blocks: JobTimeBlock[] = useMemo(() => {
    const { blocks } = mapScheduleDataToDomain({ jobs: jobs.data });
    return blocks;
  }, [jobs.data]);

  const conflictJobIds = useMemo(() => {
    const conflicts = findScheduleConflicts(blocks, domainCrews);
    return conflictJobIdSetFromBlocks(conflicts, blocks);
  }, [blocks, domainCrews]);

  return {
    clients,
    crews,
    jobs,
    blocks,
    domainCrews,
    conflictJobIds,
  };
}
