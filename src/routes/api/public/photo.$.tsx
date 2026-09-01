import { createFileRoute } from "@tanstack/react-router";

// Serves photos stored in the private "site-photos" bucket to website visitors.
export const Route = createFileRoute("/api/public/photo/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Not configured", { status: 500 });

        const upstream = await fetch(`${url}/storage/v1/object/site-photos/${path}`, {
          headers: { apikey: key },
        });
        if (!upstream.ok || !upstream.body) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(upstream.body, {
          headers: {
            "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
            "cache-control": "public, max-age=60, s-maxage=300",
          },
        });
      },
    },
  },
});
