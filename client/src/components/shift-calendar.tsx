import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, MapPin } from "lucide-react";

type CalendarView = 'today' | 'week' | 'month';

interface Shift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  department?: { name: string };
  assigned_to?: { name: string };
}

interface ShiftCalendarProps {
  shifts: Shift[];
  className?: string;
}

export function ShiftCalendar({ shifts, className }: ShiftCalendarProps) {
  const [view, setView] = useState<CalendarView>('today');
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameWeek = (date: Date, referenceDate: Date) => {
    const startOfWeek = new Date(referenceDate);
    startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return date >= startOfWeek && date <= endOfWeek;
  };

  const isSameMonth = (date: Date, referenceDate: Date) => {
    return date.getMonth() === referenceDate.getMonth() && 
           date.getFullYear() === referenceDate.getFullYear();
  };

  const getFilteredShifts = () => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      
      switch (view) {
        case 'today':
          return isToday(shiftDate);
        case 'week':
          return isSameWeek(shiftDate, currentDate);
        case 'month':
          return isSameMonth(shiftDate, currentDate);
        default:
          return false;
      }
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'today':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getDateRangeLabel = () => {
    switch (view) {
      case 'today':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      default:
        return '';
    }
  };

  const groupShiftsByDate = (shifts: Shift[]) => {
    const grouped: { [key: string]: Shift[] } = {};
    
    shifts.forEach(shift => {
      const dateKey = new Date(shift.start_time).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(shift);
    });
    
    // Sort shifts within each day by start time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
    
    return grouped;
  };

  const filteredShifts = getFilteredShifts();
  const groupedShifts = groupShiftsByDate(filteredShifts);
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={className} data-testid="shift-calendar">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Shift Calendar</span>
          </CardTitle>
          
          {/* View Toggle Buttons */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={view === 'today' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('today')}
                className="px-3 py-1 text-xs"
                data-testid="button-view-today"
              >
                Today
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className="px-3 py-1 text-xs"
                data-testid="button-view-week"
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                className="px-3 py-1 text-xs"
                data-testid="button-view-month"
              >
                Month
              </Button>
            </div>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="p-2"
            data-testid="button-nav-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold text-center flex-1" data-testid="text-date-range">
            {getDateRangeLabel()}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
            className="p-2"
            data-testid="button-nav-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredShifts.length === 0 ? (
          <div className="text-center py-8" data-testid="no-shifts-message">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-muted-foreground mb-2">
              No shifts scheduled
            </h4>
            <p className="text-sm text-muted-foreground">
              {view === 'today' && 'No shifts scheduled for today.'}
              {view === 'week' && 'No shifts scheduled for this week.'}
              {view === 'month' && 'No shifts scheduled for this month.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedShifts).map(([dateKey, shifts]) => (
              <div key={dateKey} className="space-y-2">
                {view !== 'today' && (
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                    {new Date(dateKey).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h4>
                )}
                
                <div className="space-y-2">
                  {shifts.map((shift) => (
                    <Card key={shift.id} className="p-3 hover:shadow-md transition-shadow" data-testid={`shift-card-${shift.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-sm truncate">{shift.title}</h5>
                            <Badge variant="outline" className={getStatusColor(shift.status)}>
                              {shift.status}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
                            </div>
                            
                            {shift.department && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{shift.department.name}</span>
                              </div>
                            )}
                            
                            {shift.assigned_to && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{shift.assigned_to.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}