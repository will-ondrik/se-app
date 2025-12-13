'use client';

import { useEffect, useState } from "react";
import { UserPlus, Mail, Shield, Plus, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoleBadgeColor } from "@/lib/ui-mappers";

import { postInviteUser, getPendingInvites, getTeamMembers } from "@/services/api";
import type { User, Role, UserInvite } from "@/types/app/types";
import { InfoTooltip } from "@/components/InfoTooltip";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Permission } from "@/types/app/types";

// Helper: convert enum-like roles (e.g., "BUSINESS_COACH") to human-friendly labels ("Business Coach")
const formatRole = (role: string) =>
  role
    .toLowerCase()
    .split("_")
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

// All available permissions (UI uses friendly labels, backend expects UPPERCASE)
const ALL_PERMISSIONS: Permission[] = [
  "VIEW_JOBS",
  "EDIT_JOBS",
  "VIEW_TOOLS",
  "EDIT_TOOLS",
  "VIEW_REPORTS",
  "EDIT_REPORTS",
  "VIEW_DASHBOARDS",
  "VIEW_FINANCIALS",
  "MANAGE_USERS",
  "MANAGE_ROLES",
  "MANAGE_SETTINGS",
  "MANAGE_COMPANY",
  "INVITE_USERS",
];

const formatPermission = (perm: string) =>
  perm
    .toLowerCase()
    .split("_")
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const inviteItemSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["EMPLOYEE", "MANAGEMENT", "ACCOUNTANT", "BUSINESS_COACH", "OWNER", "CEO"]),
});

const inviteFormSchema = z.object({
  invites: z.array(inviteItemSchema).min(1, "Add at least one user"),
});

type InviteItem = z.infer<typeof inviteItemSchema>;
type InviteFormData = z.infer<typeof inviteFormSchema>;

export default function Team() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [permOpen, setPermOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [tempPerms, setTempPerms] = useState<Permission[]>([]);
  const [pendingInvites, setPendingInvites] = useState<UserInvite[]>([]);

  const activeUser = users.find((u) => u.id === activeUserId) || null;

  // Load users from API
  useEffect(() => {
    let mounted = true;
    getTeamMembers().then((u) => {
      if (mounted) setUsers(Array.isArray(u) ? u : []);
    });
    return () => { mounted = false; };
  }, []);

  // Load pending invites from API
  useEffect(() => {
    let mounted = true;
    getPendingInvites().then((inv) => {
      if (mounted) setPendingInvites(Array.isArray(inv) ? inv : []);
    });
    return () => { mounted = false; };
  }, []);

  // Permissions editor handlers
  const openPermissions = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setActiveUserId(userId);
    setTempPerms(user.permissions);
    setPermOpen(true);
  };

  const closePermissions = () => {
    setPermOpen(false);
    setActiveUserId(null);
    setTempPerms([]);
  };

  const togglePermission = (perm: Permission) => {
    setTempPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const savePermissions = () => {
    if (!activeUserId) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUserId ? { ...u, permissions: [...tempPerms] } : u))
    );
    closePermissions();
  };

  const selectAll = () => setTempPerms([...ALL_PERMISSIONS]);
  const clearAll = () => setTempPerms([]);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      invites: [
        { email: "", firstName: "", lastName: "", role: "EMPLOYEE" },
      ],
    },
  });

  const { control, handleSubmit, reset, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "invites" });

  const onSubmit = async (data: InviteFormData) => {
    const invites = data.invites.map((i) => ({
      email: i.email.trim(),
      firstName: i.firstName.trim(),
      lastName: i.lastName.trim(),
      roles: [i.role.toUpperCase() as Role],
    }));

    const results = await Promise.allSettled(invites.map((dto) => postInviteUser(dto)));
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    if (succeeded > 0) {
      toast({ title: succeeded > 1 ? `Invited ${succeeded} users` : "Invitation sent" });
    }
    if (failed > 0) {
      const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      const msg = ((firstErr?.reason as any)?.message as string) || "Some invites failed";
      toast({ title: "Invite error", description: `${failed} invite(s) failed: ${msg}` , variant: "destructive"});
    }

    if (failed === 0) {
      setInviteOpen(false);
      reset();
    }
  };

  const inviteCount = watch("invites")?.length ?? 0;
  const submitLabel = inviteCount > 1 ? "Send Invitations" : "Send Invitation";

  const addBlankInvite = () =>
    append({ email: "", firstName: "", lastName: "", role: "EMPLOYEE" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Team
            <InfoTooltip content="Manage your team members and their roles" className="ml-2" />
          </h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member{inviteCount > 1 ? 's' : ''}</DialogTitle>
              <DialogDescription>
                {inviteCount > 1
                  ? "Send invitations to multiple team members. They'll receive an email to join your company."
                  : "Send an invitation to a new team member. They'll receive an email to join your company."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-md border p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">User {index + 1}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          aria-label="Remove user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-6">
                        <FormField
                          control={control}
                          name={`invites.${index}.email` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="user@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`invites.${index}.firstName` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`invites.${index}.lastName` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`invites.${index}.role` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                  <SelectItem value="MANAGEMENT">Management</SelectItem>
                                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                  <SelectItem value="BUSINESS_COACH">Business Coach</SelectItem>
                                  <SelectItem value="OWNER">Owner</SelectItem>
                                  <SelectItem value="CEO">CEO</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button type="button" variant="outline" onClick={addBlankInvite}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add another user
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{submitLabel}</Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

          <Dialog open={permOpen} onOpenChange={(o) => (o ? setPermOpen(true) : closePermissions())}>
            <DialogContent className="sm:max-w-[720px]">
              <DialogHeader>
                <DialogTitle>Manage Permissions</DialogTitle>
                <DialogDescription>
                  {activeUser ? `Update permissions for ${activeUser.firstName} ${activeUser.lastName}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={selectAll}>Select all</Button>
                  <Button type="button" variant="outline" onClick={clearAll}>Clear all</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 rounded-md border p-2">
                      <Checkbox
                        checked={tempPerms.includes(perm)}
                        onCheckedChange={() => togglePermission(perm)}
                      />
                      <span>{formatPermission(perm)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closePermissions}>Cancel</Button>
                <Button type="button" onClick={savePermissions}>Save changes</Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingInvites.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Roles Defined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">6</div>
            <p className="text-xs text-muted-foreground">Permission levels</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>All active users in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>
                  Roles
                  <InfoTooltip content="User roles determine access levels and permissions" className="ml-2" />
                </TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <Badge key={role} className={getRoleBadgeColor(role)}>
                          {formatRole(role)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      {user.permissions.length} permissions
                      <Button variant="outline" size="sm" onClick={() => openPermissions(user.id)}>
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Users who have been invited but haven't accepted yet</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invitations</p>
          ) : (
            <div className="space-y-3">
              {pendingInvites.map((inv) => {
                const invitedDays = Math.max(0, Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / 86400000));
                const expiresDays = Math.max(0, Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / 86400000));
                return (
                  <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{inv.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {invitedDays} day{invitedDays === 1 ? '' : 's'} ago • Expires in {expiresDays} day{expiresDays === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {inv.roles.map((role) => (
                        <Badge key={role} variant="secondary">{formatRole(role)}</Badge>
                      ))}
                      <Button variant="outline" size="sm">Resend</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
