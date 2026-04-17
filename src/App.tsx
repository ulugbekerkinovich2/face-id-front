import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import DevicesPage from "@/pages/DevicesPage";
import LogsPage from "@/pages/LogsPage";
import UsersPage from "@/pages/UsersPage";
import StrangersPage from "@/pages/StrangersPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/strangers" element={<StrangersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
