
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import MeterReadingUpload from "@/components/dashboard/MeterReadingUpload";
import ConsumptionChart from "@/components/dashboard/ConsumptionChart";
import BillGeneration from "@/components/dashboard/BillGeneration";
import { AuthContext } from "@/App";

const Dashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showBillGeneration, setShowBillGeneration] = useState(false);
  const [meterReadingData, setMeterReadingData] = useState<{
    currentReading: string;
    previousReading: string | null;
  } | null>(null);
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMeterReadingSuccess = (currentReading: string) => {
    // Get previous reading from localStorage (set during initial reading or last upload)
    const previousReading = localStorage.getItem("initialReading");
    
    setMeterReadingData({
      currentReading,
      previousReading
    });
    
    // Save current reading as the new previous reading for next time
    localStorage.setItem("initialReading", currentReading);
    
    // Show bill generation component
    setShowBillGeneration(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="bg-background border-b py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold flex items-center">
            <span className="text-primary mr-1">⚡</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              MeterEase
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow py-8 page-transition-in">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              Dashboard
            </h1>
          </div>
          
          {!showBillGeneration ? (
            <div className="max-w-3xl mx-auto space-y-8">
              <MeterReadingUpload onReadingSuccess={handleMeterReadingSuccess} />
            </div>
          ) : (
            <div className="space-y-8">
              {meterReadingData && (
                <>
                  <ConsumptionChart 
                    currentReading={Number(meterReadingData.currentReading)}
                    previousReading={meterReadingData.previousReading ? Number(meterReadingData.previousReading) : null}
                  />
                  <BillGeneration 
                    currentReading={Number(meterReadingData.currentReading)}
                    previousReading={meterReadingData.previousReading ? Number(meterReadingData.previousReading) : 0}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-background border-t py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              © 2025 MeterEase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
