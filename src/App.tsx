import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import RequireAuth from "@/components/RequireAuth";

// Lazy load - sahifa faqat ochilganda yuklanadi
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const DevicesPage = lazy(() => import("@/pages/DevicesPage"));
const LogsPage = lazy(() => import("@/pages/LogsPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const BlockedPage = lazy(() => import("@/pages/BlockedPage"));
const StrangersPage = lazy(() => import("@/pages/StrangersPage"));
const CardLogsPage = lazy(() => import("@/pages/CardLogsPage"));
const InsidePage = lazy(() => import("@/pages/InsidePage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage"));
const AuditLogPage = lazy(() => import("@/pages/AuditLogPage"));
const MissingImagesPage = lazy(() => import("@/pages/MissingImagesPage"));
const ImageHealthPage = lazy(() => import("@/pages/ImageHealthPage"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/blocked" element={<BlockedPage />} />
              <Route path="/inside" element={<InsidePage />} />
              <Route path="/strangers" element={<StrangersPage />} />
              <Route path="/card-logs" element={<CardLogsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin-users" element={<AdminUsersPage />} />
              <Route path="/audit" element={<AuditLogPage />} />
              <Route path="/missing-images" element={<MissingImagesPage />} />
              <Route path="/image-health" element={<ImageHealthPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
