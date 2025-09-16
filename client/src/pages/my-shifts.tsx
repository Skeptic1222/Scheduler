import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";

export default function MyShifts() {
  const { data: myShifts, isLoading } = useQuery({
    queryKey: ["/api/my-shifts"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Shifts</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title-my-shifts">My Shifts</h1>
          <p className="text-muted-foreground">View your assigned and upcoming shifts</p>
        </div>

        <div className="space-y-4">
          {myShifts && myShifts.length > 0 ? (
            myShifts.map((shift: any) => (
              <Card key={shift.id} data-testid={`card-my-shift-${shift.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{shift.title}</CardTitle>
                    <Badge variant="default">{shift.status}</Badge>
                  </div>
                  <CardDescription className="flex items-center">
                    <MapPin className="mr-1 h-3 w-3" />
                    {shift.department?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(shift.start_time).toLocaleDateString()} - {new Date(shift.end_time).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assigned shifts</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any assigned shifts at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}