import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ShiftsTableProps {
  shifts: any[];
  isLoading: boolean;
  userRole: string;
}

export function ShiftsTable({ shifts, isLoading, userRole }: ShiftsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || shift.department_id === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { variant: "default" as const, className: "bg-success/10 text-success" },
      in_queue: { variant: "secondary" as const, className: "bg-warning/10 text-warning" },
      assigned: { variant: "outline" as const, className: "bg-primary/10 text-primary" },
      completed: { variant: "outline" as const, className: "bg-muted text-muted-foreground" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getDepartmentBadge = (departmentName: string) => {
    const colors = {
      'Emergency': 'bg-destructive/10 text-destructive',
      'Critical Care': 'bg-primary/10 text-primary',
      'Surgery': 'bg-accent/10 text-accent',
      'Pediatrics': 'bg-secondary/10 text-secondary'
    };
    
    const colorClass = colors[departmentName as keyof typeof colors] || 'bg-muted/50 text-muted-foreground';
    
    return (
      <Badge variant="outline" className={colorClass}>
        {departmentName}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Shifts</CardTitle>
          <CardDescription>Loading shifts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-muted/30 p-4 rounded-lg h-16"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle>Available Shifts</CardTitle>
            <CardDescription>Shifts ready for FCFS assignment</CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <Input
              type="text"
              placeholder="Search shifts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
              data-testid="input-search-shifts"
            />
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40" data-testid="select-department-filter">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="icu">ICU</SelectItem>
                <SelectItem value="surgery">Surgery</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredShifts.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-calendar-times text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">
              {searchTerm || departmentFilter !== "all" ? "No shifts match your filters" : "No shifts available"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift Details</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden md:table-cell">Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-muted/30" data-testid={`row-shift-${shift.id}`}>
                    <TableCell>
                      <div>
                        <h3 className="font-medium text-foreground" data-testid={`text-shift-title-${shift.id}`}>
                          {shift.title}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-shift-description-${shift.id}`}>
                          {shift.description || 'No description'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getDepartmentBadge(shift.department?.name || 'Unknown')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="text-sm font-medium text-foreground" data-testid={`text-shift-date-${shift.id}`}>
                          {shift.start_time ? new Date(shift.start_time).toLocaleDateString() : '--'}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-shift-duration-${shift.id}`}>
                          {shift.start_time && shift.end_time ? 
                            `${Math.round((new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60))} hours` 
                            : '--'
                          }
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shift.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-view-${shift.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        {(['admin', 'supervisor'].includes(userRole)) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-secondary hover:text-secondary/80"
                            data-testid={`button-edit-${shift.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
