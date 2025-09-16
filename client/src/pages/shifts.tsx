import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, Edit } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

export default function Shifts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingShift, setEditingShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department_id: "",
    start_time: "",
    end_time: "",
    min_experience_years: 0,
    required_skills: [] as string[]
  });

  const { data: shifts, isLoading } = useQuery({
    queryKey: ["/api/shifts"],
    select: (data: any) => {
      const shiftsData = data?.data?.shifts || data?.shifts || [];
      return Array.isArray(shiftsData) ? shiftsData : Object.values(shiftsData);
    }
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    select: (data: any) => {
      const deps = data?.data?.departments || data?.departments || [];
      return Array.isArray(deps) ? deps : Object.values(deps);
    }
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/shifts/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Shift updated",
        description: "The shift has been updated successfully.",
      });
      setEditingShift(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shift",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      department_id: "",
      start_time: "",
      end_time: "",
      min_experience_years: 0,
      required_skills: []
    });
  };

  const handleEdit = (shift: any) => {
    setFormData({
      title: shift.title,
      description: shift.description || "",
      department_id: shift.department_id,
      start_time: new Date(shift.start_time).toISOString().slice(0, 16),
      end_time: new Date(shift.end_time).toISOString().slice(0, 16),
      min_experience_years: shift.min_experience_years || 0,
      required_skills: shift.required_skills || []
    });
    setEditingShift(shift);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShiftMutation.mutate({
      id: editingShift.id,
      data: {
        ...formData,
        required_skills: typeof formData.required_skills === 'string' 
          ? (formData.required_skills as any).split(',').map((s: string) => s.trim()) 
          : formData.required_skills
      }
    });
  };

  const canEditShifts = user?.role === 'admin' || user?.role === 'supervisor';

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Available Shifts</h1>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title-shifts">Available Shifts</h1>
            <p className="text-muted-foreground">Browse and apply for available hospital shifts</p>
          </div>
          {canEditShifts && (
            <Link href="/shifts/create">
              <Button data-testid="button-create-shift">
                <Calendar className="mr-2 h-4 w-4" />
                Create New Shift
              </Button>
            </Link>
          )}
        </div>

        {editingShift && (
          <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
            <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Shift</DialogTitle>
                <DialogDescription>
                  Update shift information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="input-edit-shift-title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    data-testid="input-edit-shift-description"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger data-testid="select-edit-shift-department">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start">Start Time</Label>
                    <Input
                      id="edit-start"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      data-testid="input-edit-shift-start"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end">End Time</Label>
                    <Input
                      id="edit-end"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      data-testid="input-edit-shift-end"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-experience">Minimum Experience (years)</Label>
                  <Input
                    id="edit-experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.min_experience_years}
                    onChange={(e) => setFormData({ ...formData, min_experience_years: parseInt(e.target.value, 10) })}
                    data-testid="input-edit-shift-experience"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-update-shift">
                  Update Shift
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {shifts && shifts.length > 0 ? (
            shifts.map((shift: any) => (
              <Card key={shift.id} className="hover:shadow-md transition-shadow" data-testid={`card-shift-${shift.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{shift.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={shift.status === 'available' ? 'default' : 'secondary'}>
                        {shift.status}
                      </Badge>
                      {canEditShifts && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(shift)}
                          data-testid={`button-edit-shift-${shift.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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