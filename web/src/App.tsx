import { lazy, Suspense } from "react";
import { createHashRouter, Navigate, Outlet, RouterProvider, ScrollRestoration } from "react-router";
import { ToastProvider } from "@/components/toast";
import { IS_FRAME, StoreProvider } from "@/lib/store";
import { Home } from "@/screens/home";
import { Landing, SEEN_KEY } from "@/screens/landing";
import { ScreensBoard } from "@/screens/screens";
import { Spot } from "@/screens/spot";

// MapLibre is most of the bundle; keep it off the list view's critical path.
const MapScreen = lazy(() => import("@/screens/map").then((m) => ({ default: m.MapScreen })));

// Checked on every visit to "/", not once when the router is built, so the
// welcome screen's buttons land on the list straight away.
function Root() {
  return seenWelcome() ? <Home /> : <Navigate to="/welcome" replace />;
}

function seenWelcome() {
  try {
    return IS_FRAME || localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function Shell() {
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<div className="min-h-dvh bg-ink" />}>
        <Outlet />
      </Suspense>
    </>
  );
}

const router = createHashRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Root /> },
      { path: "/welcome", element: <Landing /> },
      { path: "/map", element: <MapScreen /> },
      { path: "/spot/:id", element: <Spot /> },
      { path: "/screens", element: <ScreensBoard /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </StoreProvider>
  );
}
