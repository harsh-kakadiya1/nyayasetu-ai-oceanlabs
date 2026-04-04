import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Users, Coins, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import API_ENDPOINTS from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserPlan = "starter" | "professional" | "enterprise";

interface AdminUser {
  id: string;
  username: string;
  tokens: number;
  plan: UserPlan;
  role?: "user" | "admin";
  isAdmin?: boolean;
}

interface DraftValues {
  plan: UserPlan;
  tokens: number;
}

export default function Admin() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftValues>>({});

  const totalUsers = users.length;
  const totalTokens = useMemo(() => users.reduce((acc, user) => acc + user.tokens, 0), [users]);

  const refreshUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.admin.users, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to load users");
      }

      const data: AdminUser[] = await response.json();
      setUsers(data);

      const nextDrafts: Record<string, DraftValues> = {};
      data.forEach((user) => {
        nextDrafts[user.id] = {
          plan: user.plan,
          tokens: user.tokens,
        };
      });
      setDrafts(nextDrafts);
    } catch {
      toast({
        title: "Could not load users",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const updateDraftPlan = (userId: string, plan: UserPlan) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        plan,
        tokens: prev[userId]?.tokens ?? 0,
      },
    }));
  };

  const updateDraftTokens = (userId: string, tokens: number) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        plan: prev[userId]?.plan ?? "starter",
        tokens,
      },
    }));
  };

  const saveUser = async (user: AdminUser) => {
    const draft = drafts[user.id];
    if (!draft) {
      return;
    }

    if (!Number.isInteger(draft.tokens) || draft.tokens < 0) {
      toast({
        title: "Invalid tokens",
        description: "Tokens must be a non-negative integer.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingUserId(user.id);
      const response = await fetch(API_ENDPOINTS.admin.userById(user.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan: draft.plan,
          tokens: draft.tokens,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save user");
      }

      const updatedUser: AdminUser = await response.json();
      setUsers((prev) => prev.map((item) => (item.id === updatedUser.id ? { ...item, ...updatedUser } : item)));
      setDrafts((prev) => ({
        ...prev,
        [updatedUser.id]: {
          plan: updatedUser.plan,
          tokens: updatedUser.tokens,
        },
      }));

      toast({
        title: "User updated",
        description: `${updatedUser.username} updated successfully.`,
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not update user right now.",
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-68px)] bg-gradient-to-br from-[#f8f4ea] via-[#edf4f1] to-[#f4f8f7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-[#2d575e]/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1f565f]" />
            <h1 className="font-display text-xl font-semibold text-[#1d3b40]">Admin Panel</h1>
          </div>
          <p className="text-sm text-[#5f7f85]">Manage users, plans, and token balances from one place.</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-[#2d575e]/15 bg-[#f8fbfa] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#4f6f74]">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Users</span>
                </div>
                <span className="text-lg font-semibold text-[#1f565f]">{totalUsers}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#2d575e]/15 bg-[#f8fbfa] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#4f6f74]">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm">Total Tokens</span>
                </div>
                <span className="text-lg font-semibold text-[#1f565f]">{totalTokens}</span>
              </div>
            </div>
          </div>

          <Button className="mt-5 w-full" onClick={refreshUsers} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh users"}
          </Button>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#2d575e]/15 bg-white/85 shadow-sm backdrop-blur-sm">
          <div className="border-b border-[#2d575e]/12 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4a7379]">Users & Plans</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f2f8f6] text-[#4a7379]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Tokens</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#6e8f95]">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#6e8f95]">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const draft = drafts[user.id] || { plan: user.plan, tokens: user.tokens };
                    const isSaving = savingUserId === user.id;

                    return (
                      <tr key={user.id} className="border-t border-[#2d575e]/10">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#1d3b40]">{user.username}</div>
                          <div className="text-xs text-[#6b8a90]">{user.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.isAdmin ? "bg-[#e7f5f2] text-[#1f565f]" : "bg-[#f2f4f5] text-[#577176]"}`}>
                            {user.isAdmin ? "admin" : "user"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Label htmlFor={`plan-${user.id}`} className="sr-only">
                            Plan
                          </Label>
                          <select
                            id={`plan-${user.id}`}
                            className="h-9 rounded-md border border-[#2d575e]/20 bg-white px-2 text-sm text-[#1d3b40]"
                            value={draft.plan}
                            onChange={(event) => updateDraftPlan(user.id, event.target.value as UserPlan)}
                          >
                            <option value="starter">starter</option>
                            <option value="professional">professional</option>
                            <option value="enterprise">enterprise</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <Label htmlFor={`tokens-${user.id}`} className="sr-only">
                            Tokens
                          </Label>
                          <Input
                            id={`tokens-${user.id}`}
                            type="number"
                            min={0}
                            step={1}
                            value={draft.tokens}
                            onChange={(event) => updateDraftTokens(user.id, Number(event.target.value || 0))}
                            className="h-9 w-28"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => saveUser(user)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1"
                          >
                            <Save className="h-3.5 w-3.5" />
                            {isSaving ? "Saving" : "Save"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
