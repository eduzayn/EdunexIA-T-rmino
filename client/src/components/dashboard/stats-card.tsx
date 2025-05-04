import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  DollarSign, 
  Award,
  LucideIcon
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: "students" | "courses" | "revenue" | "completion";
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  onClick?: () => void;
}

export function StatsCard({ title, value, icon, trend, onClick }: StatsCardProps) {
  const getIcon = (): JSX.Element => {
    const iconMap: Record<string, LucideIcon> = {
      students: Users,
      courses: BookOpen,
      revenue: DollarSign,
      completion: Award
    };

    const IconComponent = iconMap[icon];
    
    const bgColors = {
      students: "bg-primary-50 dark:bg-primary-950/30",
      courses: "bg-secondary-50 dark:bg-secondary-950/30",
      revenue: "bg-purple-50 dark:bg-purple-950/30",
      completion: "bg-green-50 dark:bg-green-950/30"
    };
    
    const textColors = {
      students: "text-primary-600 dark:text-primary-400",
      courses: "text-secondary-600 dark:text-secondary-400",
      revenue: "text-purple-600 dark:text-purple-400",
      completion: "text-green-600 dark:text-green-400"
    };

    return (
      <div className={cn("flex-shrink-0 rounded-md p-3", bgColors[icon])}>
        <IconComponent className={cn("text-xl h-5 w-5", textColors[icon])} />
      </div>
    );
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  // Format value if it's a revenue number (assumed to be in cents)
  const displayValue = icon === 'revenue' && typeof value === 'number' 
    ? formatCurrency(value) 
    : value;

  // Mapear o tipo de estatística para a rota correspondente
  const getDetailRoute = (): string => {
    const routeMap = {
      students: "/admin/dashboard/students",
      courses: "/admin/dashboard/courses",
      revenue: "/admin/dashboard/revenue",
      completion: "/admin/dashboard/completion"
    };
    return routeMap[icon];
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="p-5 cursor-pointer" onClick={handleClick}>
          <div className="flex items-center">
            {getIcon()}
            <div className="ml-5 w-0 flex-1">
              <div className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </div>
              <div className="text-lg font-medium mt-1">
                {displayValue}
              </div>
            </div>
          </div>
        </div>
        
        {trend && (
          <div className="bg-muted/30 px-5 py-3 flex items-center justify-between border-t">
            <div className={cn(
              "text-sm flex items-center",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {trend.isPositive ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
              <span>{trend.value}%</span>
              <span className="text-muted-foreground ml-1">{trend.label}</span>
            </div>
            <Link href={getDetailRoute()} className="text-sm font-medium text-primary hover:text-primary/80">
              Ver detalhes
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
