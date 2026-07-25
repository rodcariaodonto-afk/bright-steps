import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Power } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PUBLIC_PLANS } from "@/modules/billing/plans";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
} from "@/modules/admin/commerce.functions";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCoupons);
  const createFn = useServerFn(createCoupon);
  const updateFn = useServerFn(updateCoupon);
  const deleteFn = useServerFn(deleteCoupon);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => listFn(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: "10",
    max_redemptions: "",
    valid_until: "",
    applies_to_plan: "any",
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          code: form.code,
          description: form.description || undefined,
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
          valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
          applies_to_plan: form.applies_to_plan === "any" ? null : form.applies_to_plan,
        },
      }),
    onSuccess: () => {
      toast.success("Cupom criado.");
      setOpen(false);
      setForm({
        code: "",
        description: "",
        discount_type: "percent",
        discount_value: "10",
        max_redemptions: "",
        valid_until: "",
        applies_to_plan: "any",
      });
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (input: { id: string; active: boolean }) => updateFn({ data: input }),
    onSuccess: () => {
      toast.success("Cupom atualizado.");
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Cupom removido.");
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado.`);
  }

  function isExpired(c: { valid_until: string | null }) {
    return c.valid_until && new Date(c.valid_until) < new Date();
  }
  function isExhausted(c: { max_redemptions: number | null; redemptions_count: number }) {
    return c.max_redemptions !== null && c.redemptions_count >= c.max_redemptions;
  }

  return (
    <AdminPage
      title="Cupons"
      description="Crie e gerencie cupons de desconto aplicáveis no checkout."
    >
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Novo cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo cupom</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  placeholder="ATLAS20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="desc">Descrição (opcional)</Label>
                <Input
                  id="desc"
                  placeholder="Campanha de lançamento"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={form.discount_type}
                    onValueChange={(v) =>
                      setForm({ ...form, discount_type: v as "percent" | "fixed" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="val">Valor</Label>
                  <Input
                    id="val"
                    type="number"
                    min="1"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="max">Limite de resgates</Label>
                  <Input
                    id="max"
                    type="number"
                    placeholder="Ilimitado"
                    value={form.max_redemptions}
                    onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="until">Validade</Label>
                  <Input
                    id="until"
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Plano aplicável</Label>
                <Select
                  value={form.applies_to_plan}
                  onValueChange={(v) => setForm({ ...form, applies_to_plan: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Todos os planos</SelectItem>
                    {PUBLIC_PLANS.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => create.mutate()}
                disabled={!form.code || !form.discount_value || create.isPending}
              >
                {create.isPending ? "Criando..." : "Criar cupom"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Desconto</th>
              <th className="px-3 py-2 text-left">Plano</th>
              <th className="px-3 py-2 text-left">Resgates</th>
              <th className="px-3 py-2 text-left">Validade</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && (coupons ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
            {(coupons ?? []).map((c) => {
              const expired = isExpired(c);
              const exhausted = isExhausted(c);
              const inactive = !c.active || expired || exhausted;
              return (
                <tr key={c.id} className="border-t border-border/40">
                  <td className="px-3 py-2">
                    <button
                      onClick={() => copy(c.code)}
                      className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 font-mono text-xs font-bold hover:bg-muted/80"
                    >
                      {c.code}
                      <Copy className="h-3 w-3" />
                    </button>
                    {c.description && (
                      <div className="mt-1 text-xs text-muted-foreground">{c.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {c.discount_type === "percent"
                      ? `${c.discount_value}%`
                      : `R$ ${Number(c.discount_value).toFixed(2)}`}
                  </td>
                  <td className="px-3 py-2 text-xs">{c.applies_to_plan ?? "Todos"}</td>
                  <td className="px-3 py-2 text-xs">
                    {c.redemptions_count}
                    {c.max_redemptions ? `/${c.max_redemptions}` : ""}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {c.valid_until
                      ? new Date(c.valid_until).toLocaleDateString("pt-BR")
                      : "Sem validade"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        inactive
                          ? "bg-neutral-500/15 text-neutral-600"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {expired ? "Expirado" : exhausted ? "Esgotado" : c.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggle.mutate({ id: c.id, active: !c.active })}
                        title={c.active ? "Desativar" : "Ativar"}
                      >
                        <Power className={`h-4 w-4 ${c.active ? "text-amber-600" : "text-emerald-600"}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Remover cupom ${c.code}?`)) remove.mutate(c.id);
                        }}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
