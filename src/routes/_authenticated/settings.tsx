import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ComingSoon } from "./_stubs";

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <ComingSoon
      title="Settings"
      subtitle="Notification preferences, integrations, and account controls"
      icon={Settings}
      phase="Later"
    />
  ),
});
