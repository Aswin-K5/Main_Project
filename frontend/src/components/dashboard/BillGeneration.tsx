import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Payment from "@/pages/Payment";

interface BillGenerationProps {
  currentReading: number;
  previousReading: number;
}

// Calculate electricity bill based on the consumption units
function calculateElectricityBill(unitsConsumed: number) {
  // Define the tariff slabs based on consumption level
  let tariffSlabs = [];
  
  if (unitsConsumed <= 500) {
    // For consumption <= 500 units
    if (unitsConsumed <= 100) {
      // First 100 units are free
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: unitsConsumed, amount: 0 }
      ];
    } else if (unitsConsumed <= 200) {
      // First 100 units free, next units at 2.35
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 200, rate: 2.35, units: unitsConsumed - 100, amount: (unitsConsumed - 100) * 2.35 }
      ];
    } else if (unitsConsumed <= 300) {
      // First 100 units free, next 100 at 2.35, remaining at 4.7
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 200, rate: 2.35, units: 100, amount: 100 * 2.35 },
        { fromUnit: 201, toUnit: 300, rate: 4.7, units: unitsConsumed - 200, amount: (unitsConsumed - 200) * 4.7 }
      ];
    } else if (unitsConsumed <= 400) {
      // First 100 units free, next 100 at 2.35, next 200 at 4.7
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 200, rate: 2.35, units: 100, amount: 100 * 2.35 },
        { fromUnit: 201, toUnit: 400, rate: 4.7, units: unitsConsumed - 200, amount: (unitsConsumed - 200) * 4.7 }
      ];
    } else {
      // First 100 units free, next 100 at 2.35, next 200 at 4.7, remaining at 6.3
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 200, rate: 2.35, units: 100, amount: 100 * 2.35 },
        { fromUnit: 201, toUnit: 400, rate: 4.7, units: 200, amount: 200 * 4.7 },
        { fromUnit: 401, toUnit: 500, rate: 6.3, units: unitsConsumed - 400, amount: (unitsConsumed - 400) * 6.3 }
      ];
    }
  } else {
    // For consumption > 500 units
    if (unitsConsumed <= 600) {
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 400, rate: 4.7, units: 300, amount: 300 * 4.7 },
        { fromUnit: 401, toUnit: 500, rate: 6.3, units: 100, amount: 100 * 6.3 },
        { fromUnit: 501, toUnit: 600, rate: 8.4, units: unitsConsumed - 500, amount: (unitsConsumed - 500) * 8.4 }
      ];
    } else if (unitsConsumed <= 700) {
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 400, rate: 4.7, units: 300, amount: 300 * 4.7 },
        { fromUnit: 401, toUnit: 500, rate: 6.3, units: 100, amount: 100 * 6.3 },
        { fromUnit: 501, toUnit: 600, rate: 8.4, units: 100, amount: 100 * 8.4 },
        { fromUnit: 601, toUnit: 700, rate: 9.45, units: unitsConsumed - 600, amount: (unitsConsumed - 600) * 9.45 }
      ];
    } else if (unitsConsumed <= 800) {
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 400, rate: 4.7, units: 300, amount: 300 * 4.7 },
        { fromUnit: 401, toUnit: 500, rate: 6.3, units: 100, amount: 100 * 6.3 },
        { fromUnit: 501, toUnit: 600, rate: 8.4, units: 100, amount: 100 * 8.4 },
        { fromUnit: 601, toUnit: 800, rate: 9.45, units: unitsConsumed - 600, amount: (unitsConsumed - 600) * 9.45 }
      ];
    } else if (unitsConsumed <= 1000) {
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 400, rate: 4.7, units: 300, amount: 300 * 4.7 },
        { fromUnit: 401, toUnit: 500, rate: 6.3, units: 100, amount: 100 * 6.3 },
        { fromUnit: 501, toUnit: 600, rate: 8.4, units: 100, amount: 100 * 8.4 },
        { fromUnit: 601, toUnit: 800, rate: 9.45, units: 200, amount: 200 * 9.45 },
        { fromUnit: 801, toUnit: 1000, rate: 10.5, units: unitsConsumed - 800, amount: (unitsConsumed - 800) * 10.5 }
      ];
    } else {
      tariffSlabs = [
        { fromUnit: 1, toUnit: 100, rate: 0, units: 100, amount: 0 },
        { fromUnit: 101, toUnit: 400, rate: 4.7, units: 300, amount: 300 * 4.7 },
        { fromUnit: 401, toUnit: 500, rate: 6.3, units: 100, amount: 100 * 6.3 },
        { fromUnit: 501, toUnit: 600, rate: 8.4, units: 100, amount: 100 * 8.4 },
        { fromUnit: 601, toUnit: 800, rate: 9.45, units: 200, amount: 200 * 9.45 },
        { fromUnit: 801, toUnit: 1000, rate: 10.5, units: 200, amount: 200 * 10.5 },
        { fromUnit: 1001, toUnit: 5000, rate: 11.55, units: unitsConsumed - 1000, amount: (unitsConsumed - 1000) * 11.55 }
      ];
    }
  }
  
  // Calculate total charges from tariff slabs
  let totalBill = 0;
  for (let slab of tariffSlabs) {
    totalBill += slab.amount;
  }
  
  // Calculate net amounts
  const energyCharges = Math.round(totalBill);
  
  // Prepare the bill details
  return {
    unitsConsumed,
    slabCharges: tariffSlabs,
    energyCharges: energyCharges,
    finalBillAmount: energyCharges
  };
}

const BillGeneration = ({ currentReading, previousReading }: BillGenerationProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Calculate consumption and bill details
  const consumption = currentReading - previousReading;
  const billDetails = calculateElectricityBill(consumption);
  
  // Format date
  const currentDate = new Date();
  const billDate = currentDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const dueDate = new Date(currentDate);
  dueDate.setDate(dueDate.getDate() + 15);
  const billDueDate = dueDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Generate unique bill number
  const billNumber = `BILL-${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleDownloadBill = () => {
    setIsDownloading(true);
    
    // Simulate download delay
    setTimeout(() => {
      setIsDownloading(false);
      
      toast({
        title: "Bill Downloaded",
        description: "Your bill has been downloaded successfully.",
      });
    }, 1500);
  };

  const handlePayBill = () => {
    // Navigate to the payment page with bill data
    navigate("/payment", {
      state: {
        billData: {
          amount: billDetails.finalBillAmount,
          userId: "USER123",
          readingDate: billDate,
          meterNumber: "M-45632198",
          billNumber: billNumber,
          consumption: consumption,
          dueDate: billDueDate
        }
      }
    });
  };

  const toggleDetailedBreakdown = () => {
    setShowDetailedBreakdown(!showDetailedBreakdown);
  };

  // Determine which tariff information to display based on consumption
  const tariffInfo = consumption <= 500 ? (
    <>
      <li className="text-sm">1-100 units: Free (₹0.00 per unit)</li>
      <li className="text-sm">101-200 units: ₹2.35 per unit</li>
      <li className="text-sm">201-400 units: ₹4.70 per unit</li>
      <li className="text-sm">401-500 units: ₹6.30 per unit</li>
    </>
  ) : (
    <>
      <li className="text-sm">1-100 units: Free (₹0.00 per unit)</li>
      <li className="text-sm">101-400 units: ₹4.70 per unit</li>
      <li className="text-sm">401-500 units: ₹6.30 per unit</li>
      <li className="text-sm">501-600 units: ₹8.40 per unit</li>
      <li className="text-sm">601-800 units: ₹9.45 per unit</li>
      <li className="text-sm">801-1000 units: ₹10.50 per unit</li>
      <li className="text-sm">Above 1000 units: ₹11.55 per unit</li>
    </>
  );

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader>
        <CardTitle>Electricity Bill</CardTitle>
        <CardDescription>
          Bill generated based on your meter readings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bill Number</p>
            <p className="font-medium">{billNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Bill Date</p>
            <p className="font-medium">{billDate}</p>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Customer ID</p>
            <p className="font-medium">USER123</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{billDueDate}</p>
          </div>
        </div>
        
        <div className="border-t border-b py-4 my-4">
          <div className="flex justify-between mb-2">
            <p className="text-sm text-muted-foreground">Meter Number</p>
            <p className="font-medium">M-45632198</p>
          </div>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-muted-foreground">Previous Reading</p>
            <p className="font-medium">{previousReading} kWh</p>
          </div>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-muted-foreground">Current Reading</p>
            <p className="font-medium">{currentReading} kWh</p>
          </div>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-muted-foreground">Units Consumed</p>
            <p className="font-medium">{consumption} kWh</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex justify-between items-center"
            onClick={toggleDetailedBreakdown}
          >
            <span>Show Detailed Breakdown</span>
            <Info className="h-4 w-4" />
          </Button>
          
          {showDetailedBreakdown && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Tariff Slabs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">From</th>
                      <th className="text-left py-2">To</th>
                      <th className="text-right py-2">Units</th>
                      <th className="text-right py-2">Rate (₹)</th>
                      <th className="text-right py-2">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billDetails.slabCharges.map((slab, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2">{slab.fromUnit}</td>
                        <td className="py-2">{slab.toUnit}</td>
                        <td className="text-right py-2">{slab.units}</td>
                        <td className="text-right py-2">{slab.rate.toFixed(2)}</td>
                        <td className="text-right py-2">{slab.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center py-1">
                  <span>Energy Charges</span>
                  <span className="font-medium">₹{billDetails.energyCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1 font-bold border-t mt-2 pt-2">
                  <span>Final Bill Amount</span>
                  <span>₹{billDetails.finalBillAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Tariff Information</h3>
                <ul className="list-disc pl-5 space-y-1 text-blue-800">
                  {tariffInfo}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <p>Energy Charges</p>
            <p className="font-medium">₹{billDetails.energyCharges.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
            <p>Total Amount</p>
            <p>₹{billDetails.finalBillAmount.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleDownloadBill} 
          variant="outline"
          disabled={isDownloading}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download Bill"}
        </Button>
        <Button 
          onClick={handlePayBill}
          className="w-full sm:w-auto"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay Bill
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BillGeneration;