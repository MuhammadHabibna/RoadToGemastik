"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// We'll use a custom SVG grid because importing react-calendar-heatmap might need styles
// OR we can implement a simple grid since we need full control over the "Mission Control" look.
// Let's us rechart Scatter chart or just a flex grid for "Contribution Heatmap"
// actually, let's stick to the prompt's request: "Heatmap... grid of small squares".
import { Tooltip } from "@/components/ui/tooltip" // Need basic tooltip
import { cn } from "@/lib/utils";
import { subDays, format, eachDayOfInterval } from 'date-fns';
import { supabase } from "@/lib/supabaseClient";

export default function HeatmapWidget() {
    // Generate last 120 days
    const today = new Date();
    const startDate = subDays(today, 119); // 120 days total (approx 17 weeks)

    const [gridData, setGridData] = React.useState<number[][]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('daily_logs')
            .select('created_at, duration_minutes')
            .gte('created_at', startDate.toISOString());

        if (data) {
            // Map logs to dates
            const logsByDate: Record<string, number> = {};
            data.forEach((log: any) => {
                const dateStr = format(new Date(log.created_at), 'yyyy-MM-dd');
                logsByDate[dateStr] = (logsByDate[dateStr] || 0) + log.duration_minutes;
            });

            // Create grid data (cols = weeks, rows = days)
            // We want roughly 17 columns (17 * 7 = 119)
            // We'll traverse day by day
            const newGrid: number[][] = [];
            let currentWeek: number[] = [];

            const days = eachDayOfInterval({ start: startDate, end: today });

            days.forEach((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const duration = logsByDate[dateStr] || 0;
                // Intensity: 0=none, 1=1-30m, 2=30-60m, 3=60-120m, 4=>120m
                let intensity = 0;
                if (duration > 0) intensity = 1;
                if (duration > 30) intensity = 2;
                if (duration > 60) intensity = 3;
                if (duration > 120) intensity = 4;

                currentWeek.push(intensity);

                if (currentWeek.length === 7) {
                    newGrid.push(currentWeek);
                    currentWeek = [];
                }
            });
            // Push remaining days if any
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) currentWeek.push(0); // Pad with empty
                newGrid.push(currentWeek);
            }

            setGridData(newGrid);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchLogs();

        // Subscribe to changes
        const channel = supabase.channel('heatmap-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => {
                fetchLogs();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel) };
    }, []);

    // If loading, show skeleton
    if (loading && gridData.length === 0) {
        return (
            <Card className="h-full flex flex-col border-primary/20 bg-background/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Activity Matrix</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-end justify-center pb-6">
                    <div className="w-full h-[120px] animate-pulse bg-muted/10 rounded" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col border-primary/20 bg-background/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex justify-between items-center">
                    <span>Contribution Matrix</span>
                    <span className="text-[10px] normal-case opacity-50">Log intensity</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-end justify-center pb-6">
                <div className="flex flex-wrap gap-1 justify-center max-h-[140px] overflow-hidden content-end">
                    {/* SVG Heatmap */}
                    <svg className="w-full h-full" viewBox="0 0 800 120">
                        {gridData.map((week, weekIndex) => (
                            <g key={weekIndex} transform={`translate(${weekIndex * 15}, 0)`}>
                                {week.map((intensity, dayIndex) => {
                                    const colors = [
                                        'fill-muted/10',
                                        'fill-secondary/30',
                                        'fill-secondary/50',
                                        'fill-secondary/80',
                                        'fill-secondary'
                                    ];
                                    return (
                                        <rect
                                            key={dayIndex}
                                            y={dayIndex * 15}
                                            width="12"
                                            height="12"
                                            rx="2"
                                            className={cn("transition-all duration-500 hover:opacity-80", colors[intensity])}
                                            data-tip={`Day ${dayIndex}`}
                                        />
                                    );
                                })}
                            </g>
                        ))}
                    </svg>
                </div>
            </CardContent>
        </Card>
    );
}
