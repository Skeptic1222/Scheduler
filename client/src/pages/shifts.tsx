import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

export default function Shifts() {
  const { data: shifts, isLoading } = useQuery({
    queryKey: ["/api/shifts"],
    select: (data) => data?.data?.shifts || data?.shifts || []
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Available Shifts</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title-shifts">Available Shifts</h1>
            <p className="text-muted-foreground">Browse and apply for available hospital shifts</p>
          </div>
          <Link href="/shifts/create">
            <Button data-testid="button-create-shift">
              <Calendar className="mr-2 h-4 w-4" />
              Create New Shift
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shifts && shifts.length > 0 ? (
            shifts.map((shift: any) => (
              <Card key={shift.id} className="hover:shadow-md transition-shadow" data-testid={`card-shift-${shift.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{shift.title}</CardTitle>
                    <Badge variant={shift.status === 'available' ? 'default' : 'secondary'}>
                      {shift.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3" />
                    {shift.department?.name || 'Department'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(shift.start_time).toLocaleDateString()} - {new Date(shift.end_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Min {shift.min_experience_years || 0} years experience</span>
                    </div>
                    {shift.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{shift.description}</p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" data-testid={`button-apply-${shift.id}`}>
                        Apply Now
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-details-${shift.id}`}>
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No shifts available</h3>
                  <p className="text-muted-foreground text-center">
                    There are currently no available shifts. Check back later or contact your supervisor.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}