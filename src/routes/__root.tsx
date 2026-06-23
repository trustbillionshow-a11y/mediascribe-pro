import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
          ERR_NOT_FOUND
        </div>
        <h1 className="font-display text-7xl font-extrabold uppercase tracking-tighter text-foreground">
          404
        </h1>
        <h2 className="mt-4 text-sm font-mono uppercase tracking-widest text-foreground">
          Off the reel
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The frame you're looking for isn't in this cut.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Return to slate
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
          ERR_RUNTIME
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tighter text-foreground">
          This page didn't render
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. Try reloading the take.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-foreground text-background px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-border px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Obscura Academy — Lagos Film Institute" },
      {
        name: "description",
        content:
          "Nigeria's premier multimedia institute for video editing, cinematography, sound design, photography, and drone piloting. Diploma programs in Lagos.",
      },
      { name: "author", content: "Obscura Academy" },
      { property: "og:title", content: "Obscura Academy — Lagos Film Institute" },
      {
        property: "og:description",
        content:
          "Master the cut. Diploma programs in video editing, cinematography, sound, photography, and drone — physical & online tracks in Lagos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Obscura Academy — Lagos Film Institute" },
      { name: "description", content: "Vision Academy is a website for discovering and enrolling in multimedia and tech courses, with a focus on video editing." },
      { property: "og:description", content: "Vision Academy is a website for discovering and enrolling in multimedia and tech courses, with a focus on video editing." },
      { name: "twitter:description", content: "Vision Academy is a website for discovering and enrolling in multimedia and tech courses, with a focus on video editing." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6d26cb99-8070-4f29-9ddf-bd5408ca22f5/id-preview-1669418a--bcfdd82f-0d90-4f83-9118-f7a9ce145a98.lovable.app-1782209672666.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6d26cb99-8070-4f29-9ddf-bd5408ca22f5/id-preview-1669418a--bcfdd82f-0d90-4f83-9118-f7a9ce145a98.lovable.app-1782209672666.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:ital,wght@0,700;0,800;1,700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
