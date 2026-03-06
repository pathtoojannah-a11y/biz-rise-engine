import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Setup = lazy(() => import("./pages/Setup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Automations = lazy(() => import("./pages/Automations"));
const Reviews = lazy(() => import("./pages/Reviews"));
const QA = lazy(() => import("./pages/QA"));
const GoLive = lazy(() => import("./pages/GoLive"));
const Health = lazy(() => import("./pages/Health"));
const Billing = lazy(() => import("./pages/Billing"));
const Pilots = lazy(() => import("./pages/Pilots"));
const ROI = lazy(() => import("./pages/ROI"));
const Placeholder = lazy(() => import("./pages/Placeholder"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontWeight: 600, color: "#334155" }}>
    Loading...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/setup" element={<ProtectedRoute allowIncompleteOnboarding allowMissingWorkspace><Setup /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
                <Route path="/automations" element={<ProtectedRoute><Automations /></ProtectedRoute>} />
                <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
                <Route path="/qa" element={<ProtectedRoute><QA /></ProtectedRoute>} />
                <Route path="/go-live" element={<ProtectedRoute allowIncompleteOnboarding><GoLive /></ProtectedRoute>} />
                <Route path="/health" element={<ProtectedRoute><Health /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/pilots" element={<ProtectedRoute><Pilots /></ProtectedRoute>} />
                <Route path="/roi" element={<ProtectedRoute><ROI /></ProtectedRoute>} />
                <Route path="/website" element={<ProtectedRoute><Placeholder title="Website" /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Placeholder title="Analytics" /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Placeholder title="Settings" /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
