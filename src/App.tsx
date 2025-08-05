import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import TeamSelection from "./pages/TeamSelection";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Results from "./pages/Results";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import JoinGame from "./pages/JoinGame";
import TeamJoin from "./pages/TeamJoin";
import PrintableQR from "./pages/PrintableQR";
import NewGame from "./pages/NewGame";
import Queue from "./pages/Queue";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && "status" in error && typeof error.status === "number") {
          return error.status >= 500 && failureCount < 3;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
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
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/teams" element={<TeamSelection />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/results" element={<Results />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/qr-codes" element={<PrintableQR />} />
          <Route path="/join" element={<TeamJoin />} />
          <Route path="/join/:gameCode" element={<JoinGame />} />
          <Route path="/join/:gameCode/:team" element={<JoinGame />} />
          <Route path="/new-game" element={<NewGame />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
