import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import HostLobby from "./pages/HostLobby";
import TeamLobby from "./pages/TeamLobby";
import PlayerView from "./pages/PlayerView";
import TeamView from "./pages/TeamView";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/tune-time-traveler">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/host/:gameCode" element={<HostLobby />} />
          <Route path="/lobby/:gameCode" element={<TeamLobby />} />
          <Route path="/player/:gameCode" element={<PlayerView />} />
          <Route path="/team/:gameCode" element={<TeamView />} />
          <Route path="/results/:gameCode" element={<Results />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
