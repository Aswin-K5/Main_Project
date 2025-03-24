
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import Dashboard from "./pages/Dashboard";
import InitialReading from "./pages/InitialReading";

// Create auth context
export const AuthContext = createContext<{
  isAuthenticated: boolean;
  isFirstTimeUser: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
  setFirstTimeUser: (value: boolean) => void;
}>({
  isAuthenticated: false,
  isFirstTimeUser: false,
  login: async () => {},
  logout: () => {},
  setFirstTimeUser: () => {},
});

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isFirstTimeUser, setFirstTimeUser] = useState<boolean>(false);
  
  // Check localStorage on initial load
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    
    const firstTimeStatus = localStorage.getItem("isFirstTimeUser");
    if (firstTimeStatus === "true") {
      setFirstTimeUser(true);
    }
  }, []);
  
  const login = async (mobile: string, password: string): Promise<void> => {
    // This would be replaced with actual API authentication
    // For now, we're simulating a successful login
    localStorage.setItem("isAuthenticated", "true");
    
    // Check if this is a first-time user (simulated logic)
    const isNewUser = !localStorage.getItem("hasInitialReading");
    if (isNewUser) {
      localStorage.setItem("isFirstTimeUser", "true");
      setFirstTimeUser(true);
    }
    
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isFirstTimeUser, 
        login, 
        logout,
        setFirstTimeUser
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  isAuthenticated ? 
                    (isFirstTimeUser ? <Navigate to="/initial-reading" /> : <Dashboard />) : 
                    <Navigate to="/auth" />
                } 
              />
              <Route 
                path="/initial-reading" 
                element={
                  isAuthenticated && isFirstTimeUser ? 
                    <InitialReading /> : 
                    <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />
                } 
              />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

export default App;
