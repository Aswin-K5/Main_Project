import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Wallet, Landmark, AlertTriangle, ArrowLeft } from "lucide-react";

interface BillData {
  amount: number;
  userId: string;
  readingDate: string;
  meterNumber: string;
  billNumber: string;
  consumption: number;
  dueDate: string;
}

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Get bill data from state with proper fallback
  const billData: BillData = state?.billData || {
    amount: 0,
    userId: "N/A",
    readingDate: new Date().toLocaleDateString(),
    meterNumber: "N/A",
    billNumber: "N/A",
    consumption: 0,
    dueDate: "N/A"
  };

  // Redirect if no valid bill data is available
  if (!state?.billData?.amount) {
    if (typeof window !== 'undefined' && billData.amount === 0) {
      toast({
        title: "Error",
        description: "No bill data found. Please generate a bill first.",
        variant: "destructive"
      });
      navigate("/");
      return null;
    }
  }

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
  };

  const handleBackToBill = () => {
    navigate(-1); // Go back to previous page
  };

  const handlePaymentProcess = () => {
    setIsProcessing(true);

    // Replace with your Razorpay payment page URL
    const razorpayPaymentPageUrl = "https://rzp.io/rzp/KEgyBuY";

    // Redirect to Razorpay payment page
    window.location.href = razorpayPaymentPageUrl;
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Button 
        variant="ghost" 
        onClick={handleBackToBill} 
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bill
      </Button>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Payment Details</CardTitle>
          <CardDescription>Complete your electricity bill payment</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Bill Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-muted-foreground">Bill Number:</p>
              <p className="text-sm font-medium">{billData.billNumber}</p>
              
              <p className="text-sm text-muted-foreground">Meter Number:</p>
              <p className="text-sm font-medium">{billData.meterNumber}</p>
              
              <p className="text-sm text-muted-foreground">Reading Date:</p>
              <p className="text-sm font-medium">{billData.readingDate}</p>
              
              <p className="text-sm text-muted-foreground">Units Consumed:</p>
              <p className="text-sm font-medium">{billData.consumption} kWh</p>
              
              <p className="text-sm text-muted-foreground">Due Date:</p>
              <p className="text-sm font-medium">{billData.dueDate}</p>
              
              <p className="text-sm text-muted-foreground">Total Amount:</p>
              <p className="text-sm font-medium">₹{billData.amount.toFixed(2)}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Select Payment Method</h3>
            <RadioGroup 
              defaultValue="card" 
              value={paymentMethod}
              onValueChange={handlePaymentMethodChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/20">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-5 w-5" />
                  <span>Credit/Debit Card</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/20">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-5 w-5" />
                  <span>UPI/QR</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/20">
                <RadioGroupItem value="netbanking" id="netbanking" />
                <Label htmlFor="netbanking" className="flex items-center gap-2 cursor-pointer">
                  <Landmark className="h-5 w-5" />
                  <span>Net Banking</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-center p-3 bg-amber-50 text-amber-800 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">This is a simulated payment environment. No real transactions will be processed.</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-xl font-bold">Total: ₹{billData.amount.toFixed(2)}</div>
          <Button 
            onClick={handlePaymentProcess} 
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : "Pay Now"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Payment;