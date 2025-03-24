import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

const SignupForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    serviceNumber: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, acceptTerms: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.mobileNumber || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Error",
        description: "You must accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    // Validate service number (12 digits)
    if (formData.serviceNumber && !/^\d{12}$/.test(formData.serviceNumber)) {
      toast({
        title: "Error",
        description: "Service number must be 12 digits",
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
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          mobile_number: formData.mobileNumber,
          service_number: formData.serviceNumber,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during signup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedCard className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Create an Account</h2>
        <p className="text-muted-foreground mt-2">
          Join MeterEase and start tracking your electricity usage
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
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
          <Label htmlFor="serviceNumber">Service Number (12 digits)</Label>
          <Input
            id="serviceNumber"
            name="serviceNumber"
            placeholder="123456789012"
            value={formData.serviceNumber}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={handleCheckboxChange}
          />
          <Label
            htmlFor="acceptTerms"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/auth?mode=login"
            className="text-primary font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </AnimatedCard>
  );
};

export default SignupForm;