import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";

export default function FCFSQueue() {
  const { toast } = useToast();
  const { isConnected, lastMessage } = useSocket();
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["/api/fcfs-queue"],
  });

  // Listen for WebSocket updates and refresh the queue
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        if (message.type === 'fcfs_response' || message.type === 'shift_created') {
          // Invalidate and refetch the FCFS queue when there are updates
          queryClient.invalidateQueries({ queryKey: ["/api/fcfs-queue"] });
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
  }, [lastMessage]);

  // Mutation for responding to FCFS queue entries
  const respondToQueue = useMutation({
    mutationFn: async ({ queueId, response }: { queueId: string; response: 'accept' | 'decline' }) => {
      const res = await apiRequest('POST', '/api/fcfs-queue/respond', {
        queue_id: queueId,
        response
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the FCFS queue
      queryClient.invalidateQueries({ queryKey: ["/api/fcfs-queue"] });
      
      // Show success message
      toast({
        title: variables.response === 'accept' ? "Shift Accepted!" : "Shift Declined",
        description: variables.response === 'accept' 
          ? "You have successfully accepted this shift assignment."
          : "You have declined this shift assignment.",
        variant: variables.response === 'accept' ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAccept = (queueId: string) => {
    respondToQueue.mutate({ queueId, response: 'accept' });
  };

  const handleDecline = (queueId: string) => {
    respondToQueue.mutate({ queueId, response: 'decline' });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">FCFS Queue</h1>
          <div className="space-y-4">
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
            <h1 className="text-2xl font-bold" data-testid="page-title-fcfs-queue">FCFS Queue</h1>
            <p className="text-muted-foreground">First-Come, First-Served shift assignment queue</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isConnected ? "Live Updates" : "Connecting..."}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4">
          {queueItems && queueItems.length > 0 ? (
            queueItems.map((item: any, index: number) => (
              <Card key={item.id} className="relative" data-testid={`card-queue-item-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.shift?.title || 'Shift Title'}</CardTitle>
                        <CardDescription>{item.shift?.department?.name || 'Department'}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={item.status === 'pending' ? 'secondary' : item.status === 'accepted' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {item.shift?.start_time ? new Date(item.shift.start_time).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Priority Score: {item.priority_score || 0}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          Response Deadline: {item.response_deadline ? new Date(item.response_deadline).toLocaleString() : 'Not set'}
                        </span>
                      </div>
                    </div>
                    
                    {item.status === 'pending' && (
                      <div className="flex gap-2 items-end">
                        <Button 
                          size="sm" 
                          className="flex-1" 
                          data-testid={`button-accept-${item.id}`}
                          onClick={() => handleAccept(item.id)}
                          disabled={respondToQueue.isPending}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1" 
                          data-testid={`button-decline-${item.id}`}
                          onClick={() => handleDecline(item.id)}
                          disabled={respondToQueue.isPending}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No items in queue</h3>
                <p className="text-muted-foreground text-center">
                  You have no pending shift assignments in the FCFS queue. Check back later for new opportunities.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}