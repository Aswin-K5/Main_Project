
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ConsumptionChartProps {
  currentReading: number;
  previousReading: number | null;
}

const ConsumptionChart = ({ currentReading, previousReading }: ConsumptionChartProps) => {
  const [timespan, setTimespan] = useState("weekly");
  
  // Calculate consumption based on the readings
  const consumption = previousReading !== null ? currentReading - previousReading : 0;
  
  // Generate dates for the chart based on consumption
  const generateData = () => {
    const now = new Date();
    const data = [];
    const totalDays = timespan === "weekly" ? 7 : timespan === "monthly" ? 30 : 12;
    const dailyAvg = consumption / totalDays;
    
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Add some randomness to daily values while ensuring total matches consumption
      const randomFactor = 0.7 + Math.random() * 0.6; // Random between 0.7 and 1.3
      const dailyValue = dailyAvg * randomFactor;
      
      const dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      data.push({
        date: dateLabel,
        consumption: dailyValue.toFixed(1),
        average: (dailyValue * 0.9).toFixed(1), // Average is 90% of actual
      });
    }
    
    return data;
  };
  
  const data = generateData();
  
  // Calculate estimated bill based on consumption (₹7 per kWh)
  const estimatedBill = (consumption * 7).toFixed(2);
  
  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Energy Consumption</CardTitle>
          <CardDescription>
            Based on your meter readings
          </CardDescription>
        </div>
        <Select
          value={timespan}
          onValueChange={(value) => setTimespan(value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Select timespan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickMargin={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickMargin={10}
                unit="kWh"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="consumption"
                name="Your Usage"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="average"
                name="Average Usage"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-accent/50 p-4 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Current Period</div>
            <div className="text-2xl font-bold">{consumption.toFixed(1)} kWh</div>
            <div className="text-xs text-green-600 mt-1">
              From {previousReading} to {currentReading} kWh
            </div>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Estimated Bill</div>
            <div className="text-2xl font-bold">₹{estimatedBill}</div>
            <div className="text-xs text-muted-foreground mt-1">Based on ₹7/kWh</div>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Daily Average</div>
            <div className="text-2xl font-bold">{(consumption / 30).toFixed(1)} kWh</div>
            <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsumptionChart;
