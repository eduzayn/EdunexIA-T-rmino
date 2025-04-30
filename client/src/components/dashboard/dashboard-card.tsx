import React from 'react';
import { 
  AreaChart, 
  BarChart,
  Calendar,
  CircleCheck,
  Clock,
  FileText,
  Users,
  BadgeDollarSign
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface TrendProps {
  value: number;
  isPositive: boolean;
  label: string;
}

interface DashboardCardProps {
  title: string;
  value: string;
  icon: "students" | "courses" | "revenue" | "completion" | "documents" | "certificates" | "assessments" | "attendance";
  trend?: TrendProps;
  detailsLink?: string;
}

export function DashboardCard({ title, value, icon, trend, detailsLink }: DashboardCardProps) {
  // Mapeia cada tipo de ícone para seu componente
  const iconComponents = {
    students: <Users className="h-8 w-8 text-blue-500" />,
    courses: <Calendar className="h-8 w-8 text-indigo-500" />,
    revenue: <BadgeDollarSign className="h-8 w-8 text-emerald-500" />,
    completion: <CircleCheck className="h-8 w-8 text-green-500" />,
    documents: <FileText className="h-8 w-8 text-amber-500" />,
    certificates: <FileText className="h-8 w-8 text-purple-500" />,
    assessments: <BarChart className="h-8 w-8 text-orange-500" />,
    attendance: <Clock className="h-8 w-8 text-cyan-500" />
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className="p-3 bg-card rounded-lg border">
            {iconComponents[icon]}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          {trend && (
            <div className="flex items-center space-x-2">
              <span className={`flex items-center text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
          
          {detailsLink && (
            <Button 
              variant="link" 
              className="text-primary text-xs p-0"
              asChild
            >
              <Link href={detailsLink}>Ver detalhes</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}