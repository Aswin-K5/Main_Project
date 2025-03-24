import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

const LoginForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobileNumber: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.mobileNumber || !formData.password) {
      toast({
        title: "Error",
        description: "Please enter both mobile number and password",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast({
        title: "Error",
        description: "Mobile number must be 10 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: formData.mobileNumber,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid mobile number or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedCard className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Welcome Back</h2>
        <p className="text-muted-foreground mt-2">
          Sign in to your MeterEase account
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input
            id="mobileNumber"
            name="mobileNumber"
            type="tel"
            placeholder="1234567890"
            value={formData.mobileNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={formData.rememberMe}
            onCheckedChange={handleCheckboxChange}
          />
          <Label
            htmlFor="rememberMe"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remember me
          </Label>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/auth?mode=signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AnimatedCard>
  );
};

export default LoginForm;