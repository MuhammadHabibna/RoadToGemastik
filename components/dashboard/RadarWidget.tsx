"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import SkillCalibration from "@/components/dialogs/SkillCalibration";

import { supabase } from "@/lib/supabaseClient";
import { FOCUS_CATEGORIES } from "@/lib/constants";

export default function RadarWidget() {
    const { skills } = useStore();
    const [chartData, setChartData] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            // Fetch all logs with mood and duration
            const { data: logs } = await supabase
                .from('daily_logs')
                .select('focus_category, duration_minutes, mood_score');

            if (!logs) return;

            // Aggregate XP per category
            // Formula: Duration (mins) * (Mood / 3) 
            // Scaling: 1 hour at mood 3 = 60 XP. 1 hour at mood 5 = 100 XP.
            const xpTotals: Record<string, number> = {};
            let globalMaxXP = 100; // Minimum scale to avoid graph looking empty at start

            logs.forEach((log: any) => {
                const category = log.focus_category;
                const duration = log.duration_minutes || 0;
                const mood = log.mood_score || 3;

                // XP Calculation
                const xp = Math.round(duration * (mood / 3));

                if (!xpTotals[category]) xpTotals[category] = 0;
                xpTotals[category] += xp;
            });

            // Find the highest skill to calibrate the chart
            Object.values(xpTotals).forEach(val => {
                if (val > globalMaxXP) globalMaxXP = val;
            });

            // Add a buffer to the max so the top point isn't hitting the edge hard
            const displayMax = Math.round(globalMaxXP * 1.2);

            const newData = FOCUS_CATEGORIES.map(cat => {
                const currentXP = xpTotals[cat.value] || 0;

                return {
                    subject: cat.value,
                    A: currentXP,
                    B: displayMax, // Target line effectively becomes the "Outer Rim" or next level
                    fullMark: displayMax
                };
            });

            setChartData(newData);
        };

        fetchData();

        const channel = supabase.channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Initial empty state
    if (chartData.length === 0) {
        // Render minimal empty state
    }

    const finalData = chartData.length > 0 ? chartData : FOCUS_CATEGORIES.map(cat => ({ subject: cat.value, A: 0, B: 100, fullMark: 100 }));


    return (
        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-mono uppercase tracking-wider text-primary">Bytelogic Stats</CardTitle>
                <SkillCalibration />
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={finalData}>
                        <PolarGrid stroke="hsla(var(--secondary), 0.2)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsla(var(--muted-foreground))', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                        <Radar
                            name="Current Skill"
                            dataKey="A"
                            stroke="#1E93AB"
                            fill="#1E93AB"
                            fillOpacity={0.4}
                        />
                        <Radar
                            name="Target Skill"
                            dataKey="B"
                            stroke="#E62727"
                            strokeDasharray="4 4"
                            fill="transparent"
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
