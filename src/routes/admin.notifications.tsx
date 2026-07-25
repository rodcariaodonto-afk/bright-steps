import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Trash2, Send } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAllNotifications,
  broadcastNotification,
  deleteAdminNotification,
} from "@/modules/admin/notifications.functions";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotifications,
});

function AdminNotifications() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllNotifications);
  const broadcast = useServerFn(broadcastNotification);
  const del = useServerFn(deleteAdminNotification);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => fetchAll(),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Notificação removida");
      qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    kind: "system",
    priority: "normal",
    link: "",
    audience: "all" as "all" | "admin" | "professional" | "family",
  });

  const sendMut = useMutation({
    mutationFn: () =>
      broadcast({
        data: {
          title: form.title,
          body: form.body || undefined,
          kind: form.kind,
          priority: form.priority,
          link: form.link || undefined,
          audience: form.audience,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Enviado para ${r.sent} usuário(s)`);
      qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
      setOpen(false);
      setForm({ title: "", body: "", kind: "system", priority: "normal", link: "", audience: "all" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage
      title="Notificações"
      description="Envie comunicados e visualize o histórico da plataforma."
    >
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Bell className="mr-2 h-4 w-4" />
              Nova notificação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar notificação em massa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Textarea
                rows={4}
                placeholder="Mensagem (opcional)"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Select value={form.audience} onValueChange={(v: any) => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue placeholder="Público" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="family">Famílias</SelectItem>
                    <SelectItem value="professional">Profissionais</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="message">Mensagem</SelectItem>
                    <SelectItem value="achievement">Conquista</SelectItem>
                    <SelectItem value="appointment">Agenda</SelectItem>
                    <SelectItem value="routine">Rotina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Link opcional (ex: /app/notificacoes)"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => sendMut.mutate()}
                disabled={!form.title || sendMut.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {sendMut.isPending ? "Enviando…" : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Destinatário</th>
              <th className="px-4 py-2">Prioridade</th>
              <th className="px-4 py-2">Enviada em</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((n) => (
              <tr key={n.id} className="border-t border-border/50">
                <td className="px-4 py-2">
                  <div className="font-medium text-foreground">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground line-clamp-1">{n.body}</div>}
                </td>
                <td className="px-4 py-2"><Badge variant="outline">{n.kind}</Badge></td>
                <td className="px-4 py-2 text-muted-foreground">
                  {n.recipient?.email ?? n.user_id.slice(0, 8)}
                </td>
                <td className="px-4 py-2">
                  <Badge variant={n.priority === "critical" ? "destructive" : "secondary"}>
                    {n.priority}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground text-xs">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  <Button size="icon" variant="ghost" onClick={() => delMut.mutate(n.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nenhuma notificação.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
