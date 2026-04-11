"use client";

import { DataLocation } from "@/lib/api-client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface DataVisualizationProps {
  dataLocations: DataLocation[];
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
];

export function DataVisualization({ dataLocations }: DataVisualizationProps) {
  // Count data by service provider
  const serviceData = dataLocations.reduce(
    (acc, location) => {
      const provider = location.serviceProvider;
      if (!acc[provider]) {
        acc[provider] = { name: provider, value: 0, active: 0, deleted: 0 };
      }
      acc[provider].value += 1;
      if (location.deleted) {
        acc[provider].deleted += 1;
      } else {
        acc[provider].active += 1;
      }
      return acc;
    },
    {} as Record<
      string,
      { name: string; value: number; active: number; deleted: number }
    >,
  );

  const chartData = Object.values(serviceData);

  // Count data by category
  const categoryData = dataLocations.reduce(
    (acc, location) => {
      (location.dataCategories ?? []).forEach((category) => {
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += 1;
      });
      return acc;
    },
    {} as Record<string, number>,
  );

  const categoryChartData = Object.entries(categoryData).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Services Distribution */}
      <div className="p-6 rounded-lg bg-secondary/30 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Data by Service
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        )}
      </div>

      {/* Categories Distribution */}
      <div className="p-6 rounded-lg bg-secondary/30 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Data by Category
        </h3>
        {categoryChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.map((service, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg bg-background/50 border border-border"
          >
            <div className="text-sm font-medium text-foreground mb-2">
              {service.name}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Active:</span>
              <span className="font-semibold text-primary">
                {service.active}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Deleted:</span>
              <span className="font-semibold text-accent">
                {service.deleted}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
