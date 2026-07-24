import { createFileRoute } from "@tanstack/react-router";
import { MessagingUI } from "@/components/messaging/messaging-ui";

export const Route = createFileRoute("/app/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens · Meu Mundo Azul" },
      {
        name: "description",
        content: "Converse em tempo real com os profissionais que acompanham sua criança.",
      },
      { property: "og:title", content: "Mensagens · Meu Mundo Azul" },
      {
        property: "og:description",
        content: "Chat direto entre famílias e profissionais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <h1 className="mb-4 text-2xl font-semibold">Mensagens</h1>
      <MessagingUI variant="family" />
    </div>
  ),
});
