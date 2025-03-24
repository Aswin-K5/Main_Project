
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";

const InitialReading = () => {
  const [initialReading, setInitialReading] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setFirstTimeUser } = useContext(AuthContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initialReading.trim()) {
      toast({
        title: "Error",
        description: "Please enter your previous meter reading",
        variant: "destructive",
      });
      return;
    }

    // Validate that the reading is a valid number
    if (isNaN(Number(initialReading)) || Number(initialReading) < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid meter reading (positive number)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate saving to backend
    setTimeout(() => {
      // Store reading in localStorage for demo purposes
      localStorage.setItem("hasInitialReading", "true");
      localStorage.setItem("initialReading", initialReading);
      localStorage.setItem("isFirstTimeUser", "false");
      
      setFirstTimeUser(false);

      toast({
        title: "Success",
        description: "Initial meter reading saved successfully!",
      });

      // Navigate to dashboard
      navigate("/dashboard");
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-background border-b py-4 px-6">
        <div className="container mx-auto">
          <div className="text-2xl font-bold flex items-center">
            <span className="text-primary mr-1">⚡</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              MeterEase
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to MeterEase!</CardTitle>
            <CardDescription>
              Before we begin, please enter your last meter reading to help us track your energy usage.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initialReading">Previous Meter Reading (kWh)</Label>
                <Input
                  id="initialReading"
                  type="text"
                  value={initialReading}
                  onChange={(e) => setInitialReading(e.target.value)}
                  placeholder="Enter your previous meter reading"
                />
                <p className="text-sm text-muted-foreground">
                  You can find this number on your electric meter or your last bill.
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Continue to Dashboard"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default InitialReading;
