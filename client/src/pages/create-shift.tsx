import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateShift() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department_id: "",
    start_time: "",
    end_time: "",
    min_experience_years: 0,
    required_skills: [] as string[]
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    select: (data) => {
      const deps = data?.data?.departments || data?.departments || [];
      // Handle case where departments is returned as object with numeric keys
      if (deps && !Array.isArray(deps)) {
        return Object.values(deps);
      }
      return deps;
    }
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/shifts", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create shift");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift created successfully!",
      });
      // Reset form
      setFormData({
        title: "",
        description: "",
        department_id: "",
        start_time: "",
        end_time: "",
        min_experience_years: 0,
        required_skills: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShiftMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title-create-shift">Create New Shift</h1>
          <p className="text-muted-foreground">Schedule a new shift for hospital staff</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Shift Details
            </CardTitle>
            <CardDescription>
              Fill in the details for the new shift assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Shift Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Emergency Night Shift"
                    required
                    data-testid="input-shift-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => handleInputChange("department_id", value)}
                    required
                  >
                    <SelectTrigger data-testid="select-department">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the shift responsibilities and requirements..."
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange("start_time", e.target.value)}
                    required
                    data-testid="input-start-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange("end_time", e.target.value)}
                    required
                    data-testid="input-end-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_experience">Minimum Experience (years)</Label>
                <Input
                  id="min_experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.min_experience_years}
                  onChange={(e) => handleInputChange("min_experience_years", parseInt(e.target.value) || 0)}
                  data-testid="input-min-experience"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createShiftMutation.isPending} data-testid="button-create-shift">
                  <Save className="mr-2 h-4 w-4" />
                  {createShiftMutation.isPending ? "Creating..." : "Create Shift"}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.history.back()} data-testid="button-cancel">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}