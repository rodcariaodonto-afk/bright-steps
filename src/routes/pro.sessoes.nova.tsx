import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pro/sessoes/nova")({
  component: NewSessionPage,
});

function NewSessionPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage
      title={t("sessions.titleNew")}
      actions={
        <>
          <Button size="sm" variant="outline">
            Salvar rascunho
          </Button>
          <Button size="sm">Registrar sessão</Button>
        </>
      }
    >
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-soft/50 p-3 text-xs text-primary">
        <Sparkles className="mt-0.5 h-3.5 w-3.5" aria-hidden="true" />
        {t("sessions.reuse")}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ProCard title="Dados da sessão" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("sessions.fields.child")} placeholder="Selecionar paciente" />
            <FormField label={t("sessions.fields.date")} type="date" />
            <FormField label={t("sessions.fields.time")} type="time" />
            <FormField label={t("sessions.fields.duration")} placeholder="50 min" />
          </div>
          <FormArea
            className="mt-4"
            label={t("sessions.fields.activities")}
            placeholder="Descreva as atividades realizadas…"
          />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <FormArea
              label={t("sessions.fields.materials")}
              placeholder="Materiais utilizados"
            />
            <FormArea
              label={t("sessions.fields.response")}
              placeholder="Como a criança respondeu"
            />
          </div>
          <FormArea
            className="mt-4"
            label={t("sessions.fields.observations")}
            placeholder="Observações clínicas"
          />
          <FormArea
            className="mt-4"
            label={t("sessions.fields.nextSteps")}
            placeholder="Próximos passos"
          />
        </ProCard>

        <div className="space-y-4">
          <ProCard title={t("sessions.fields.goals")}>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2">
                <input type="checkbox" defaultChecked className="accent-primary" />
                Atenção compartilhada
              </li>
              <li className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2">
                <input type="checkbox" className="accent-primary" />
                Regulação em transições
              </li>
            </ul>
          </ProCard>
          <ProCard title={t("sessions.fields.attachments")}>
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Arraste arquivos aqui ou clique para enviar.
              <br />
              (Storage entra na Onda 2.)
            </div>
          </ProCard>
        </div>
      </div>
    </ProPage>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

function FormArea({
  label,
  placeholder,
  className,
}: {
  label: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <textarea
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}
