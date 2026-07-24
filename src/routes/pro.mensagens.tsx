import { createFileRoute } from "@tanstack/react-router";
import { ProPage } from "@/components/pro/pro-page";
import { MessagingUI } from "@/components/messaging/messaging-ui";

export const Route = createFileRoute("/pro/mensagens")({
  component: () => (
    <ProPage title="Mensagens">
      <MessagingUI variant="pro" />
    </ProPage>
  ),
});
