import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Clock, User, Calendar, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useSocket } from "@/hooks/use-socket";

export default function OnCall() {
  const { user } = useAuth();
  const { toast } = useToast();
  const socket = useSocket();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    user_id: "",
    department_id: "",
    start_time: "",
    end_time: "",
    shift_type: "regular"
  });

  const { data: onCallData, isLoading } = useQuery({
    queryKey: ["/api/on-call"],
    select: (data: any) => data?.data?.onCall || data?.onCall || []
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    select: (data: any) => {
      const usersData = data?.data?.users || data?.users || [];
      return Array.isArray(usersData) ? usersData : Object.values(usersData);
    }
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    select: (data: any) => {
      const deps = data?.data?.departments || data?.departments || [];
      return Array.isArray(deps) ? deps : Object.values(deps);
    }
  });

  const createOnCallMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/on-call", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/on-call"] });
      toast({
        title: "On-call schedule added",
        description: "The on-call schedule has been created successfully.",
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create on-call schedule",
        variant: "destructive",
      });
    },
  });

  const updateOnCallMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/on-call/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/on-call"] });
      toast({
        title: "On-call schedule updated",
        description: "The on-call schedule has been updated successfully.",
      });
      setEditingSchedule(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update on-call schedule",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      user_id: "",
      department_id: "",
      start_time: "",
      end_time: "",
      shift_type: "regular"
    });
  };

  const handleEdit = (schedule: any) => {
    // Format dates to local datetime-local input format (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      user_id: schedule.assigned_user_id || "",
      department_id: schedule.department_id,
      start_time: formatDateForInput(schedule.start_time),
      end_time: formatDateForInput(schedule.end_time),
      shift_type: schedule.title?.includes('Emergency') ? 'emergency' : 
                 schedule.title?.includes('On-Call') ? 'on-call' : 'regular'
    });
    setEditingSchedule(schedule);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      updateOnCallMutation.mutate({
        id: editingSchedule.id,
        data: formData
      });
    } else {
      createOnCallMutation.mutate(formData);
    }
  };

  const canManageOnCall = user?.role === 'admin' || user?.role === 'supervisor';

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleOnCallCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/on-call"] });
      toast({
        title: "New on-call schedule",
        description: "A new on-call schedule has been created.",
      });
    };

    const handleOnCallUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/on-call"] });
      toast({
        title: "On-call schedule updated",
        description: "An on-call schedule has been updated.",
      });
    };

    socket.on('on_call_created', handleOnCallCreated);
    socket.on('on_call_updated', handleOnCallUpdated);

    return () => {
      socket.off('on_call_created', handleOnCallCreated);
      socket.off('on_call_updated', handleOnCallUpdated);
    };
  }, [socket, toast]);

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
      <div className="container mx-auto p-4 md:p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">On-Call Staff</h1>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title-on-call">On-Call Schedule</h1>
            <p className="text-muted-foreground">Currently on-call staff and upcoming schedules</p>
          </div>
          <div className="flex gap-2">
            {canManageOnCall && (
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-on-call">
                <Plus className="mr-2 h-4 w-4" />
                Add On-Call
              </Button>
            )}
            <Button variant="outline" data-testid="button-emergency-page">
              <Phone className="mr-2 h-4 w-4" />
              Emergency Page
            </Button>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateOpen || !!editingSchedule} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingSchedule(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'Edit' : 'Create'} On-Call Schedule</DialogTitle>
              <DialogDescription>
                {editingSchedule ? 'Update' : 'Add'} staff to the on-call schedule.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="staff">Staff Member</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger data-testid="select-on-call-staff">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                >
                  <SelectTrigger data-testid="select-on-call-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shift-type">Shift Type</Label>
                <Select
                  value={formData.shift_type}
                  onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
                >
                  <SelectTrigger data-testid="select-on-call-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular On-Call</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="on-call">Special On-Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Time</Label>
                  <div className="relative">
                    <Input
                      id="start"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      className="pr-10"
                      data-testid="input-on-call-start"
                    />
                    <Calendar 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" 
                      onClick={() => document.getElementById('start')?.focus()}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="end">End Time</Label>
                  <div className="relative">
                    <Input
                      id="end"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      className="pr-10"
                      data-testid="input-on-call-end"
                    />
                    <Calendar 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" 
                      onClick={() => document.getElementById('end')?.focus()}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-on-call">
                {editingSchedule ? 'Update' : 'Create'} On-Call Schedule
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Currently On Call */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Currently On Call</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {currentlyOnCall.length > 0 ? (
              currentlyOnCall.map((shift: any) => {
                const assignedUser = users?.find((u: any) => u.id === shift.assigned_user_id);
                const department = departments?.find((d: any) => d.id === shift.department_id);
                
                return (
                  <Card key={shift.id} className="border-primary" data-testid={`card-on-call-${shift.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{assignedUser?.name || 'Unknown'}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-500">
                            <Phone className="mr-1 h-3 w-3" />
                            On Call
                          </Badge>
                          {canManageOnCall && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(shift)}
                              data-testid={`button-edit-on-call-${shift.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>{department?.name || 'Department'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{assignedUser?.role || 'Staff Member'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Contact via pager</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Until {formatTime(shift.end_time)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
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
              upcomingOnCall.map((shift: any) => {
                const assignedUser = users?.find((u: any) => u.id === shift.assigned_user_id);
                const department = departments?.find((d: any) => d.id === shift.department_id);
                
                return (
                  <Card key={shift.id} data-testid={`card-upcoming-${shift.id}`}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{assignedUser?.name || 'TBD'}</p>
                          <p className="text-sm text-muted-foreground">
                            {department?.name} • {formatDate(shift.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {shift.title?.includes('Emergency') ? 'Emergency' : 
                             shift.title?.includes('On-Call') ? 'On-Call' : 'Regular'}
                          </Badge>
                        </div>
                        {canManageOnCall && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(shift)}
                            data-testid={`button-edit-upcoming-${shift.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
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