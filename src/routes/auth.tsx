import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Scissors } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Barber Login — BRAZIIILYY Admin" },
      { name: "description", content: "Password access for the barbershop admin dashboard." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Barber Login — BRAZIIILYY Admin" },
      { property: "og:description", content: "Password access for the barbershop admin dashboard." },
    ],
  }),
  component: AuthPage,
});

// The barber types one password only. It is combined with a fixed shop key
// before it reaches the backend account, so there is no email or username.
const ADMIN_EMAIL = "admin@braziiilyy.app";
const SHOP_KEY = "#Braziiilyy-Shop-2026";

function AuthPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: password + SHOP_KEY,
    });
    setLoading(false);

    if (signInError) {
      setError("Incorrect password.");
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="panel w-full max-w-sm p-8">
        <div className="flex items-center gap-2">
          <Scissors className="size-5 text-primary" />
          <span className="font-display text-xl tracking-[0.2em]">Barber Admin</span>
        </div>
        <h1 className="mt-6 text-3xl">Enter password</h1>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Open dashboard
          </Button>
        </form>
      </div>
    </main>
  );
}
