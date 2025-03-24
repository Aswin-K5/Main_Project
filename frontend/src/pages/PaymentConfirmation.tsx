import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BillData {
  amount: number;
  userId: string;
  readingDate: string;
  meterNumber: string;
  billNumber: string;
  consumption: number;
  dueDate: string;
}

interface ConfirmationState {
  transactionId: string;
  billData: BillData;
  paymentMethod: string;
  paymentDate: string;
}

const PaymentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmationData, setConfirmationData] = useState<ConfirmationState | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    const state = location.state as ConfirmationState | null;
    
    if (state && state.transactionId && state.billData) {
      setConfirmationData(state);
    } else {
      // If no confirmation data found, redirect to home
      toast({
        title: "No payment data found",
        description: "Redirecting to home page",
        variant: "destructive"
      });
      navigate("/", { replace: true });
    }
  }, [location.state, navigate, toast]);

  // If confirmation data is still loading, show loading state
  if (!confirmationData) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading confirmation details...</p>
        </div>
      </div>
    );
  }

  const { transactionId, billData, paymentMethod, paymentDate } = confirmationData;
  
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Credit/Debit Card';
      case 'upi':
        return 'UPI/QR';
      case 'netbanking':
        return 'Net Banking';
      default:
        return method;
    }
  };

  const handleDownloadReceipt = () => {
    setIsDownloading(true);
    
    // Simulate download delay
    setTimeout(() => {
      setIsDownloading(false);
      
      toast({
        title: "Receipt Downloaded",
        description: "Your payment receipt has been downloaded successfully.",
      });
    }, 1500);
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Card className="w-full shadow-md">
        <CardHeader className="bg-green-50 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="bg-secondary/20 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Transaction ID</p>
            <p className="font-medium">{transactionId}</p>
          </div>
          
          <div className="border-t border-b py-4">
            <h3 className="font-medium mb-4">Payment Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <p className="text-sm text-muted-foreground">Amount Paid:</p>
              <p className="text-sm font-medium">₹{billData.amount.toFixed(2)}</p>
              
              <p className="text-sm text-muted-foreground">Payment Method:</p>
              <p className="text-sm font-medium">{getPaymentMethodLabel(paymentMethod)}</p>
              
              <p className="text-sm text-muted-foreground">Payment Date:</p>
              <p className="text-sm font-medium">{paymentDate}</p>
              
              <p className="text-sm text-muted-foreground">Bill Number:</p>
              <p className="text-sm font-medium">{billData.billNumber}</p>
              
              <p className="text-sm text-muted-foreground">Meter Number:</p>
              <p className="text-sm font-medium">{billData.meterNumber}</p>
              
              <p className="text-sm text-muted-foreground">Units Consumed:</p>
              <p className="text-sm font-medium">{billData.consumption} kWh</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-blue-800">
            <p className="text-sm">
              A confirmation email with payment details has been sent to your registered email address.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
            className="w-full sm:w-auto"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-opacity-50 border-t-transparent rounded-full"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </>
            )}
          </Button>
          <Button
            onClick={handleGoHome}
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentConfirmation;