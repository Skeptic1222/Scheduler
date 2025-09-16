import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, TrendingUp } from "lucide-react";

export default function Reports() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title-reports">Reports</h1>
          <p className="text-muted-foreground">Analytics and reporting for shift management</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Shift Analytics
              </CardTitle>
              <CardDescription>Shift coverage and utilization metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze shift patterns, coverage gaps, and staff utilization rates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Department Reports
              </CardTitle>
              <CardDescription>Department-wise performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View staffing levels and performance across hospital departments.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trends
              </CardTitle>
              <CardDescription>Historical trends and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track trends in shift requests, assignments, and staff availability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}