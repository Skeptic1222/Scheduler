import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const shiftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  department_id: z.string().min(1, "Department is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  required_skills: z.string().optional(),
  min_experience_years: z.coerce.number().min(0).optional(),
});

type ShiftFormData = z.infer<typeof shiftSchema>;

interface ShiftFormProps {
  onSubmit: (data: ShiftFormData) => void;
}

export function ShiftForm({ onSubmit }: ShiftFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      title: "",
      description: "",
      department_id: "",
      start_time: "",
      end_time: "",
      required_skills: "",
      min_experience_years: 0,
    },
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ["/api/departments"],
    select: (data) => data.departments || []
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: ShiftFormData) => {
      const submitData = {
        ...data,
        required_skills: data.required_skills ? data.required_skills.split(',').map(s => s.trim()) : [],
      };
      
      return await apiRequest('POST', '/api/shifts', submitData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Shift Created",
        description: "The shift has been created and added to the FCFS queue.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shift. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: ShiftFormData) => {
    createShiftMutation.mutate(data);
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Shift</CardTitle>
        <CardDescription>Add shifts to the FCFS distribution system</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="form-create-shift">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter shift title" 
                        {...field} 
                        data-testid="input-shift-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentsData?.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        data-testid="input-start-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        data-testid="input-end-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required_skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., RN, Critical Care, BLS" 
                        {...field} 
                        data-testid="input-required-skills"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_experience_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Experience (years)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field} 
                        data-testid="input-min-experience"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Additional details about the shift..." 
                      {...field} 
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-4">
              <Button 
                type="submit" 
                disabled={createShiftMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2"
                data-testid="button-submit-shift"
              >
                <i className="fas fa-plus"></i>
                <span>{createShiftMutation.isPending ? 'Creating...' : 'Create Shift'}</span>
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                data-testid="button-save-template"
              >
                Save as Template
              </Button>
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => form.reset()}
                data-testid="button-clear-form"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
