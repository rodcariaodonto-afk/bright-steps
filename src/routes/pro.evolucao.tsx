import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Plus } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import { proWrites } from "@/modules/professional/repositories/supabase";
import { toast } from "sonner";

const evolutionQuery = {
  queryKey: ["pro", "evolution", "feed"],
  queryFn: async () => {
    const repos = getProfessionalRepositories();
    const [feed, patients] = await Promise.all([
      repos.evolution.feed(),
      repos.patients.list(),
    ]);
    return { feed, patients };
  },
};

export const Route = createFileRoute("/pro/evolucao")({
  loader: ({ context }) => context.queryClient.ensureQueryData(evolutionQuery),
  component: EvolutionPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Erro: {error.message}</div>
  ),
});

function EvolutionPage() {
  const { t } = useTranslation("pro");
  const { data } = useSuspenseQuery(evolutionQuery);
  const qc = useQueryClient();
  const patientById = new Map(data.patients.map((p) => [p.id, p]));

  const [open, setOpen] = useState(false);
  const [childId, setChildId] = useState(data.patients[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [shareFamily, setShareFamily] = useState(true);
  const [shareSchool, setShareSchool] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!childId || !content.trim()) {
      toast.error("Preencha paciente e evolução");
      return;
    }
    setSaving(true);
    try {
      await proWrites.createEvolution({
        childId,
        content,
        category: category || undefined,
        sharedWithFamily: shareFamily,
        sharedWithSchool: shareSchool,
      });
      toast.success("Evolução registrada");
      setContent("");
      setCategory("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["pro", "evolution"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProPage
      title={t("evolution.title")}
      subtitle={t("evolution.subtitle")}
      actions={
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Nova evolução
        </Button>
      }
    >
      {open && (
        <ProCard title="Registrar evolução">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Paciente</span>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {data.patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Categoria</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Comunicação, socialização, sensorial…"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Evolução</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={shareFamily} onChange={(e) => setShareFamily(e.target.checked)} />
              Compartilhar com família
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={shareSchool} onChange={(e) => setShareSchool(e.target.checked)} />
              Compartilhar com escola
            </label>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={submit} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        </ProCard>
      )}

      <ProCard title="Feed cronológico">
        {data.feed.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhum registro de evolução ainda.
          </p>
        ) : (
          <ol className="relative space-y-6 border-l border-border pl-6">
            {data.feed.map((e) => {
              const child = patientById.get(e.childId);
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-1 flex h-3 w-3 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("pt-BR")} · {child?.fullName ?? "Paciente"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{e.text}</p>
                  <div className="mt-2 flex gap-1.5">
                    {e.sharedWith.family && (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {t("evolution.shareWith.family")}
                      </span>
                    )}
                    {e.sharedWith.school && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                        {t("evolution.shareWith.school")}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </ProCard>
    </ProPage>
  );
}
