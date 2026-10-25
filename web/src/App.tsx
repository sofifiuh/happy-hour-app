import { lazy, Suspense, useEffect } from "react";
import { createBrowserRouter, createHashRouter, Navigate, Outlet, RouterProvider, ScrollRestoration, useLocation, useParams } from "react-router";
import { ToastProvider } from "@/components/toast";
import { isSpotPath, noteLocation } from "@/lib/back-to";
import { BROWSER_ROUTER, spotPath } from "@/lib/routes";
import { IS_FRAME, StoreProvider } from "@/lib/store";
import { isDesktop, useIsDesktop } from "@/lib/use-media";
import { useStaticHead } from "@/lib/use-static-head";
import { AllSpots } from "@/screens/all-spots";
import { BestScreen } from "@/screens/best";
import { Home } from "@/screens/home";
import { Info } from "@/screens/info";
import { Landing, SEEN_KEY } from "@/screens/landing";
import { NotFound } from "@/screens/not-found";
import { Saved } from "@/screens/saved";
import { ScreensBoard } from "@/screens/screens";
import { Spot } from "@/screens/spot";

// MapLibre is most of the bundle; keep it off the list view's critical path.
const MapScreen = lazy(() => import("@/screens/map").then((m) => ({ default: m.MapScreen })));
// Venue owners' tools: only venue managers ever load these.
const venueTools = () => import("@/screens/venue");
const VenueHome = lazy(() => venueTools().then((m) => ({ default: m.VenueHome })));
const VenueLogin = lazy(() => venueTools().then((m) => ({ default: m.VenueLogin })));
const VenueClaim = lazy(() => venueTools().then((m) => ({ default: m.VenueClaim })));
const VenueEditor = lazy(() => venueTools().then((m) => ({ default: m.VenueEditor })));
const VenueAdmin = lazy(() => venueTools().then((m) => ({ default: m.VenueAdmin })));

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

const isHomePath = (path: string) => path === "/" || path === "/index.html";
const spotIdOf = (path: string) => (isSpotPath(path) ? decodeURIComponent(path.split("/").pop()!).replace(/\.html$/, "") : null);

// On desktop the list and a venue panel beside it are one screen, so
// opening or closing a venue keeps the list where it was scrolled.
const scrollKey = (location: { pathname: string; key: string }) =>
  isDesktop() && (isHomePath(location.pathname) || isSpotPath(location.pathname)) ? "browse" : location.key;

function Shell() {
  useStaticHead();
  const { pathname, search } = useLocation();
  useEffect(() => noteLocation(pathname, search), [pathname, search]);
  return (
    <>
      <ScrollRestoration getKey={scrollKey} />
      <Suspense fallback={<div className="min-h-dvh bg-ink" />}>
        <Outlet />
      </Suspense>
    </>
  );
}

// Desktop opens a venue in a panel beside the list, with the map still
// on the right; the venue keeps its own URL (/spots/<id>.html) and the
// list stays mounted underneath, so closing it lands back where you were.
// Phones keep the full-page venue.
function Browse() {
  const desktop = useIsDesktop();
  const { pathname } = useLocation();
  const spot = spotIdOf(pathname);
  if (!desktop || (!spot && !isHomePath(pathname))) return <Outlet />;
  if (!spot && !seenWelcome()) return <Navigate to="/welcome" replace />;
  return <Home panel={spot} />;
}

// /spots/<id>.html is a venue; /spots/index.html is the A–Z list.
function SpotsFile() {
  const { file = "" } = useParams();
  return file === "index.html" || file === "" ? <AllSpots /> : <Spot />;
}

// The old site's venue links were menu.html?id=<id>.
function OldMenuLink() {
  const id = new URLSearchParams(window.location.search).get("id");
  return <Navigate to={id ? spotPath(id) : "/"} replace />;
}

const createRouter = BROWSER_ROUTER ? createBrowserRouter : createHashRouter;

const router = createRouter([
  {
    element: <Shell />,
    children: [
      {
        element: <Browse />,
        children: [
          { path: "/", element: <Root /> },
          { path: "/index.html", element: <Root /> },
          { path: "/spot/:id", element: <Spot /> },
          { path: "/spots/:file", element: <SpotsFile /> },
        ],
      },
      { path: "/menu.html", element: <OldMenuLink /> },
      { path: "/welcome", element: <Landing /> },
      { path: "/map", element: <MapScreen /> },
      { path: "/best", element: <BestScreen /> },
      { path: "/spots", element: <AllSpots /> },
      { path: "/saved", element: <Saved /> },
      { path: "/about", element: <Info page="about" /> },
      { path: "/privacy", element: <Info page="privacy" /> },
      { path: "/terms", element: <Info page="terms" /> },
      { path: "/screens", element: <ScreensBoard /> },
      { path: "/venue", element: <VenueHome /> },
      { path: "/venue/login", element: <VenueLogin /> },
      { path: "/venue/admin", element: <VenueAdmin /> },
      { path: "/venue/claim/:id", element: <VenueClaim /> },
      { path: "/venue/:id", element: <VenueEditor /> },
      { path: "*", element: <NotFound /> },
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
