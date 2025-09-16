interface StatusCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  status: 'success' | 'warning' | 'error';
  'data-testid'?: string;
}

export function StatusCard({ title, value, subtitle, icon, status, 'data-testid': testId }: StatusCardProps) {
  const statusColors = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    error: 'text-destructive bg-destructive/10'
  };

  const valueColors = {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm" data-testid={testId}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${valueColors[status]}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statusColors[status]}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
}
