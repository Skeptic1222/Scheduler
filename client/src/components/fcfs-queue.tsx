import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FCFSQueueProps {
  queue: any[];
  isLoading: boolean;
  onResponse: (queueId: string, response: 'accept' | 'decline') => void;
}

export function FCFSQueue({ queue, isLoading, onResponse }: FCFSQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: async ({ queueId, response }: { queueId: string, response: 'accept' | 'decline' }) => {
      return await apiRequest('POST', '/api/fcfs-queue/respond', {
        queue_id: queueId,
        response
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fcfs-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      
      toast({
        title: variables.response === 'accept' ? "Shift Accepted" : "Shift Declined",
        description: `You have ${variables.response}ed the shift assignment.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleResponse = (queueId: string, response: 'accept' | 'decline') => {
    respondMutation.mutate({ queueId, response });
    onResponse(queueId, response);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>FCFS Distribution Queue</CardTitle>
          <CardDescription>Loading queue...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-muted/30 p-4 rounded-lg h-24"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>FCFS Distribution Queue</CardTitle>
            <CardDescription>
              First-Come, First-Served shift assignments with 15-minute response windows
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
            <div className="w-4 h-4 bg-success rounded-full animate-pulse"></div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {queue.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">No shifts in queue</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="fcfs-queue-list">
            {queue.map((entry) => (
              <div 
                key={entry.id} 
                className="fcfs-queue-item bg-muted/30 p-4 rounded-lg border-l-4 border-primary"
                data-testid={`fcfs-queue-item-${entry.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-foreground" data-testid={`text-shift-title-${entry.id}`}>
                          {entry.shift?.title || 'Shift Assignment'}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-shift-datetime-${entry.id}`}>
                          {entry.shift?.start_time ? new Date(entry.shift.start_time).toLocaleDateString() : '--'}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center space-x-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Priority Score</p>
                          <p className="text-sm font-medium" data-testid={`text-priority-score-${entry.id}`}>
                            {entry.priority_score}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Response Time</p>
                          <p className="text-sm font-medium text-warning" data-testid={`text-response-timer-${entry.id}`}>
                            {entry.response_deadline ? 
                              `${Math.max(0, Math.floor((new Date(entry.response_deadline).getTime() - Date.now()) / (1000 * 60)))} min remaining` 
                              : '--'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => handleResponse(entry.id, 'accept')}
                      disabled={respondMutation.isPending}
                      className="bg-success text-success-foreground hover:bg-success/90"
                      data-testid={`button-accept-${entry.id}`}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleResponse(entry.id, 'decline')}
                      disabled={respondMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid={`button-decline-${entry.id}`}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
