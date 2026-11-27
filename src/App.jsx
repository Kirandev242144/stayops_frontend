import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MarketingLayout from "./layouts/MarketingLayout/MarketingLayout";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";

import HelpCenter from "./pages/HelpCenter/HelpCenter";
import CategoryPage from "./pages/HelpCenter/CategoryPage";
import ArticlePage from "./pages/HelpCenter/ArticlePage";

import Dashboard from "./pages/Dashboard/Dashboard";
import CaretakerApp from "./pages/Caretaker/CaretakerApp";

import ProtectedRoute from "./components/ProtectedRoute";


import { WebSocketProvider } from "./context/WebSocketContext";
import GuestVerificationPage from "./pages/GuestVerification/GuestVerificationPage";

import Storefront from "./pages/Storefront/Storefront";
import { extractSubdomainOrSlug, isAdminSubdomain } from "./pages/Storefront/storefrontApi";
import { PWAProvider, PWAInstallBanner } from "./features/pwa";

// Lazy-load Admin Console to ensure zero bundle overhead for hotel guests/owners
const AdminPanel = React.lazy(() => import("./pages/Admin/AdminPanel"));

const AdminLoadingFallback = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#091B33",
      color: "#04B3C0",
      fontFamily: "Inter, -apple-system, sans-serif",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(4, 179, 192, 0.2)",
          borderTopColor: "#04B3C0",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          margin: "0 auto 14px auto",
        }}
      />
      <span style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>
        INITIALIZING STAYOPS ADMIN CONSOLE...
      </span>
    </div>
  </div>
);

/**
 * Main App Component
 * Defines application routing structure using React Router.
 */
function App() {
  // Check if current hostname is the dedicated platform Admin Console (e.g. admin.localhost:5173 or admin.stayops.in)
  const isAdminActive = typeof window !== "undefined" && isAdminSubdomain();

  // Check if current hostname is a property storefront subdomain (e.g. srinature.localhost:5173 or srinature.stayops.in)
  const isSubdomainActive =
    typeof window !== "undefined" && Boolean(extractSubdomainOrSlug());

  // 1. DEDICATED ADMIN SUBDOMAIN (admin.localhost:5173 or admin.stayops.in)
  if (isAdminActive) {
    return (
      <BrowserRouter>
        <React.Suspense fallback={<AdminLoadingFallback />}>
          <Routes>
            <Route path="*" element={<AdminPanel />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    );
  }

  return (
    <PWAProvider>
      <BrowserRouter>

        <Routes>

        {/* ==========================================
            PLATFORM ADMIN PORTAL (Path Alias)
        ========================================== */}
        <Route
          path="/admin/*"
          element={
            <React.Suspense fallback={<AdminLoadingFallback />}>
              <AdminPanel />
            </React.Suspense>
          }
        />

        {/* ==========================================
            GUEST STOREFRONT & MARKETING WEBSITE
        ========================================== */}

        {isSubdomainActive ? (
          <>
            <Route path="/" element={<Storefront />} />
            <Route path="/rooms" element={<Storefront />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={<MarketingLayout />}
            >
              <Route
                index
                element={<Home />}
              />
            </Route>
            <Route
              path="/demo"
              element={<MarketingLayout />}
            >
              <Route
                index
                element={<Home />}
              />
            </Route>
          </>
        )}

        <Route
          path="/storefront"
          element={<Storefront />}
        />

        <Route
          path="/storefront/:propertyId"
          element={<Storefront />}
        />

        <Route
          path="/storefront/:propertyId/rooms"
          element={<Storefront />}
        />

        <Route
          path="/p/:slug"
          element={<Storefront />}
        />

        <Route
          path="/p/:slug/rooms"
          element={<Storefront />}
        />

        <Route
          path="/store/:slug"
          element={<Storefront />}
        />

        <Route
          path="/store/:slug/rooms"
          element={<Storefront />}
        />


        {/* ==========================================
            PUBLIC ROUTES
        ========================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/help"
          element={<HelpCenter />}
        />

        <Route
          path="/help/category"
          element={<CategoryPage />}
        />

        <Route
          path="/help/category/:categoryId"
          element={<CategoryPage />}
        />

        <Route
          path="/help/article/:articleId"
          element={<ArticlePage />}
        />

        <Route
          path="/verify/:token"
          element={<GuestVerificationPage />}
        />


        {/* ==========================================
            PROTECTED ROUTES & WEBSOCKET ENGINE
        ========================================== */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/dashboard"
            element={
              <WebSocketProvider>
                <Dashboard />
              </WebSocketProvider>
            }
          />

          <Route
            path="/caretaker"
            element={
              <WebSocketProvider>
                <CaretakerApp />
              </WebSocketProvider>
            }
          />

        </Route>

      </Routes>

      {/* Global PWA Mobile Installation Prompt & Update Banner */}
      <PWAInstallBanner />
    </BrowserRouter>
  </PWAProvider>
  );
}

export default App;