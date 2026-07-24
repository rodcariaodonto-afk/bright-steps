import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import {
  DOC_CATEGORIES,
  getDocumentUrl,
  listDocuments,
  type ChildDocument,
} from "@/modules/documents/api";

const patientsQuery = {
  queryKey: ["pro", "patients"],
  queryFn: () => getProfessionalRepositories().patients.list(),
};

export const Route = createFileRoute("/pro/documentos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: ProDocumentsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Erro: {error.message}</div>
  ),
});

function ProDocumentsPage() {
  const { data: patients } = useSuspenseQuery(patientsQuery);
  const [childId, setChildId] = useState<string>(patients[0]?.id ?? "");

  const docsQuery = useQuery({
    queryKey: ["documents", childId],
    queryFn: () => listDocuments(childId),
    enabled: !!childId,
  });

  const patient = useMemo(
    () => patients.find((p) => p.id === childId),
    [patients, childId],
  );

  async function open(doc: ChildDocument) {
    try {
      const url = await getDocumentUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao abrir");
    }
  }

  return (
    <ProPage
      title="Documentos do paciente"
      description="Consulte laudos e relatórios liberados pela família."
    >
      {patients.length === 0 ? (
        <ProCard title="Sem pacientes">
          <p className="text-sm text-muted-foreground">
            Você ainda não foi vinculado a nenhuma criança. Peça o convite à família em
            Configurações · Profissionais vinculados.
          </p>
        </ProCard>
      ) : (
        <>
          <ProCard title="Selecionar paciente">
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Escolher..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ProCard>

          <ProCard title={patient ? `Documentos de ${patient.fullName}` : "Documentos"}>
            {docsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (docsQuery.data ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Nenhum documento compartilhado.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {(docsQuery.data ?? []).map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {doc.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {DOC_CATEGORIES.find((c) => c.value === doc.category)
                              ?.label ?? doc.category}
                          </Badge>
                          {doc.issued_at ? (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(doc.issued_at).toLocaleDateString("pt-BR")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => open(doc)}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Abrir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ProCard>
        </>
      )}
    </ProPage>
  );
}
