import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnCall() {
  const { data: onCallData, isLoading } = useQuery({
    queryKey: ["/api/on-call"],
    select: (data) => data?.data?.onCall || data?.onCall || []
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">On-Call Staff</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
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

  const currentlyOnCall = onCallData?.filter((shift: any) => {
    const now = new Date();
    const start = new Date(shift.start_time);
    const end = new Date(shift.end_time);
    return now >= start && now <= end;
  }) || [];

  const upcomingOnCall = onCallData?.filter((shift: any) => {
    const now = new Date();
    const start = new Date(shift.start_time);
    return start > now;
  })?.slice(0, 6) || [];

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title-on-call">On-Call Schedule</h1>
            <p className="text-muted-foreground">Currently on-call staff and upcoming schedules</p>
          </div>
          <Button data-testid="button-emergency-page">
            <Phone className="mr-2 h-4 w-4" />
            Emergency Page
          </Button>
        </div>

        {/* Currently On Call */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Currently On Call</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentlyOnCall.length > 0 ? (
              currentlyOnCall.map((shift: any) => (
                <Card key={shift.id} className="border-primary" data-testid={`card-on-call-${shift.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{shift.staff?.name || 'Unknown'}</CardTitle>
                      <Badge variant="default" className="bg-green-500">
                        <Phone className="mr-1 h-3 w-3" />
                        On Call
                      </Badge>
                    </div>
                    <CardDescription>{shift.department?.name || 'Department'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{shift.role || 'Staff Member'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{shift.contact_number || 'Contact via pager'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Until {formatTime(shift.end_time)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Staff Currently On Call</h3>
                  <p className="text-muted-foreground text-center">
                    There are no staff members on call at this moment.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Upcoming On-Call Schedule */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Upcoming On-Call Schedule</h2>
          <div className="grid gap-4">
            {upcomingOnCall.length > 0 ? (
              upcomingOnCall.map((shift: any) => (
                <Card key={shift.id} data-testid={`card-upcoming-${shift.id}`}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{shift.staff?.name || 'TBD'}</p>
                        <p className="text-sm text-muted-foreground">
                          {shift.department?.name} • {formatDate(shift.start_time)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {shift.shift_type || 'On-Call'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming On-Call Schedule</h3>
                  <p className="text-muted-foreground text-center">
                    There are no upcoming on-call schedules at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}