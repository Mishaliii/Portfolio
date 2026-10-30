import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { isLoggedIn } from "../utils/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({
      to: isLoggedIn() ? "/dashboard" : "/login",
      replace: true,
    });
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-text-muted">Loading CareerLens…</div>
    </div>
  );
}
