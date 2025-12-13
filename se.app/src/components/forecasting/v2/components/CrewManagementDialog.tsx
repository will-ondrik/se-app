import { useState, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Crew } from '@/data/calendarData';
import type { Employee as AppEmployee } from '@/types/forecasting/types';
import { createCrew, updateCrew, deleteCrew, getEmployees } from '@/lib/forecastingApi';

interface CrewManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crews: Crew[];
  onCreated?: () => void; // notify parent to refresh
}

const colorOptions = [
  { label: 'Teal', hex: '#14b8a6' },
  { label: 'Coral', hex: '#f97316' },
  { label: 'Amber', hex: '#f59e0b' },
  { label: 'Indigo', hex: '#3b82f6' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Slate', hex: '#64748b' },
];

export function CrewManagementDialog({ open, onOpenChange, crews, onCreated }: CrewManagementDialogProps) {
  // Map v2 CrewColor name -> hex used by our picker/API
  const crewColorToHex = (name?: string): string => {
    switch ((name || '').toLowerCase()) {
      case 'teal':
        return '#14b8a6';
      case 'coral':
        return '#f97316';
      case 'amber':
        return '#f59e0b';
      case 'indigo':
        return '#3b82f6';
      case 'emerald':
        return '#10b981';
      case 'slate':
      default:
        return '#64748b';
    }
  };
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState<string>(colorOptions[0].hex);
  const [employees, setEmployees] = useState<AppEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCrewId, setEditingCrewId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [empOpen, setEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Color dropdown state
  const [colorOpen, setColorOpen] = useState(false);
  const [colorSearch, setColorSearch] = useState('');
  const colorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [colorDropdownStyle, setColorDropdownStyle] = useState<CSSProperties>({});
  const colorDropdownRef = useRef<HTMLDivElement | null>(null);

  const reset = () => {
    setName('');
    setColorHex(colorOptions[0].hex);
    setSelected(new Set());
    setError(null);
    setEditingCrewId(null);
  };

  useEffect(() => {
    if (!open) return;
    (async () => {
      setEmployeesLoading(true);
      try {
        const list = await getEmployees();
        setEmployees(list);
      } catch {
        // ignore
      } finally {
        setEmployeesLoading(false);
      }
    })();
  }, [open]);

  // Position dropdown under trigger
  useEffect(() => {
    if (!empOpen || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      setDropdownStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, minWidth: rect.width, zIndex: 60 });
    };
    update();
    const onScroll = () => update();
    const onResize = () => update();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEmpOpen(false); };
    const onClickAway = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideTrigger = !!(triggerRef.current && triggerRef.current.contains(t));
      const insideDropdown = !!(dropdownRef.current && dropdownRef.current.contains(t));
      if (!insideTrigger && !insideDropdown) setEmpOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickAway);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickAway);
    };
  }, [empOpen]);

  // Position color dropdown under trigger
  useEffect(() => {
    if (!colorOpen || !colorTriggerRef.current) return;
    const update = () => {
      const rect = colorTriggerRef.current!.getBoundingClientRect();
      setColorDropdownStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, minWidth: rect.width, zIndex: 60 });
    };
    update();
    const onScroll = () => update();
    const onResize = () => update();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setColorOpen(false); };
    const onClickAway = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideTrigger = !!(colorTriggerRef.current && colorTriggerRef.current.contains(t));
      const insideDropdown = !!(colorDropdownRef.current && colorDropdownRef.current.contains(t));
      if (!insideTrigger && !insideDropdown) setColorOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickAway);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickAway);
    };
  }, [colorOpen]);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e => (e.name?.toLowerCase().includes(q)) || (e.role?.toLowerCase().includes(q)));
  }, [employees, empSearch]);

  const filteredColors = useMemo(() => {
    const q = colorSearch.trim().toLowerCase();
    if (!q) return colorOptions;
    return colorOptions.filter(c => c.label.toLowerCase().includes(q));
  }, [colorSearch]);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Crew name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCrewId) {
        await updateCrew(editingCrewId, { name: name.trim(), colorHex, memberIds: Array.from(selected) });
        toast.success('Crew updated');
      } else {
        await createCrew({ name: name.trim(), colorHex, memberIds: Array.from(selected) });
        toast.success('Crew created');
      }
      reset();
      onCreated?.();
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message || (editingCrewId ? 'Failed to update crew' : 'Failed to create crew');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle>Manage Crews</DialogTitle>
          <DialogDescription>
            Create a crew with a name, select members from your employees, and choose a color. New crews appear in the calendar immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing crews list */}
          <div>
            <div className="text-sm font-medium mb-2">Existing crews ({crews.length})</div>
            {crews.length === 0 ? (
              <div className="text-sm text-muted-foreground">No crews yet.</div>
            ) : (
              <ul className="max-h-40 overflow-auto space-y-1 text-sm">
                {crews.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: crewColorToHex((c as any).color) }}
                      />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Editing: map v2 crew -> form fields
                          setEditingCrewId(Number(c.id));
                          setName(c.name || '');
                          setColorHex(crewColorToHex((c as any).color));
                          const memberIds = Array.isArray((c as any).employees)
                            ? (c as any).employees.map((e: any) => Number(e.id)).filter((n: any) => !Number.isNaN(n))
                            : [];
                          setSelected(new Set(memberIds));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteTarget({ id: Number(c.id), name: c.name });
                          setConfirmOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Create form */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="crew-name">Crew name</Label>
                <Input id="crew-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Crew A" />
              </div>

              {/* Employees searchable multi-select */}
              <div className="space-y-1.5">
                <Label>Employees</Label>
                {employeesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading employees...
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No employees available.</div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      ref={triggerRef}
                      onClick={() => setEmpOpen((o) => !o)}
                      className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <span className="truncate text-left">
                        {selected.size === 0 ? 'Select employees' : `${selected.size} selected`}
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 opacity-60"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
                    </button>

                    {empOpen && createPortal(
                      <div
                        ref={dropdownRef}
                        style={dropdownStyle}
                        className="rounded-md border bg-popover text-popover-foreground shadow-md"
                      >
                        <div className="p-2 border-b">
                          <Input autoFocus placeholder="Search employees..." value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} />
                        </div>
                        <div className="max-h-60 w-full overflow-auto p-2">
                          {filteredEmployees.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">No results</div>
                          ) : (
                            <ul className="space-y-1">
                              {filteredEmployees.map((e) => (
                                <li key={e.id}>
                                  <label className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent">
                                    <Checkbox
                                      checked={selected.has(e.id)}
                                      onCheckedChange={(checked) => {
                                        setSelected((prev) => {
                                          const next = new Set(prev);
                                          if (checked) next.add(e.id);
                                          else next.delete(e.id);
                                          return next;
                                        });
                                        // keep open for multi-select
                                      }}
                                    />
                                    <span className="flex-1 truncate">{e.name}{e.role ? ` — ${e.role}` : ''}</span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t p-2 text-xs">
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => { setSelected(new Set(employees.map(e => e.id))); }}
                          >
                            Select all
                          </button>
                          <div className="flex gap-2">
                            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setEmpOpen(false)}>Done</button>
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="relative">
                  <button
                    type="button"
                    ref={colorTriggerRef}
                    onClick={() => setColorOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <div className="flex-1">
                      <div className="h-3 w-full rounded" style={{ backgroundColor: colorHex }} />
                    </div>
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-2 h-4 w-4 opacity-60"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
                  </button>

                  {colorOpen && createPortal(
                    <div
                      ref={colorDropdownRef}
                      style={colorDropdownStyle}
                      className="rounded-md border bg-popover text-popover-foreground shadow-md"
                    >
                      <div className="p-2 border-b">
                        <Input autoFocus placeholder="Search colors..." value={colorSearch} onChange={(e) => setColorSearch(e.target.value)} />
                      </div>
                      <div className="max-h-60 w-full overflow-auto p-2">
                        {filteredColors.length === 0 ? (
                          <div className="px-2 py-1 text-sm text-muted-foreground">No results</div>
                        ) : (
                          <ul className="space-y-1">
                            {filteredColors.map((opt) => (
                              <li key={opt.hex}>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent"
                                  onClick={() => { setColorHex(opt.hex); setColorOpen(false); }}
                                >
                                  <span className="flex-1">
                                    <div className="h-3 w-full rounded" style={{ backgroundColor: opt.hex }} />
                                  </span>
                                  <span className="whitespace-nowrap text-muted-foreground">{opt.label}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>
            {error && <div className="text-sm text-status-critical">{error}</div>}
          </div>
        </div>

        <DialogFooter>
          <div className="mr-auto text-xs text-muted-foreground">
            {editingCrewId ? 'Editing current crew' : null}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          {editingCrewId ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : 'Create Crew'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete crew</DialogTitle>
            <DialogDescription>
            {deleteTarget ? (
              <>
                Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget.name}"</span>? This action cannot be undone.
              </>
            ) : (
              'Are you sure?'
            )}
          </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  setSubmitting(true);
                  await deleteCrew(deleteTarget.id);
                  toast.success('Crew deleted');
                  setConfirmOpen(false);
                  setDeleteTarget(null);
                  onCreated?.();
                } catch (e: any) {
                  const msg = e?.message || 'Failed to delete crew';
                  setError(msg);
                  toast.error(msg);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
