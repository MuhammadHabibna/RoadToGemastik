"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { useStore } from "@/lib/store";
import SkillCalibration from "@/components/dialogs/SkillCalibration";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { FOCUS_CATEGORIES } from "@/lib/constants";

export default function RadarWidget() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

    // 1. Client-Side Only Guard
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. Fetch Data (Network Visible)
    const fetchStats = async () => {
        try {
            // Check session first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            // A. Fetch Targets
            const { data: targets, error: targetError } = await supabase
                .from('skills')
                .select('category, target_score');

            if (targetError) console.error("Error fetching targets:", targetError);

            // B. Fetch Progress (Skill Summary)
            // Use a hacky filtered query or fresh fetching to bypass some client caches if needed
            // But 'select' usually fetches fresh on client. 
            const { data: progress, error: progressError } = await supabase
                .from('skill_summary')
                .select('*')
                .abortSignal(new AbortController().signal); // Just standard fetch

            if (progressError) console.error("Error fetching progress:", progressError);

            console.log("Bytelogic Data (Progress):", progress);
            console.log("Raw View Data from Supabase:", progress); // DEBUG RAW
            console.log("View categories:", progress?.map((p: any) => p.focus_category)); // DEBUG SYNC

            // C. Merge & Map Data
            const merged = FOCUS_CATEGORIES.map(cat => {
                const t = targets?.find((x: any) => x.category === cat.value);
                const p = progress?.find((x: any) => x.focus_category === cat.value);

                return {
                    subject: cat.label, // Just the name for the axis key
                    fullLabel: `${cat.label} (Lv. ${p?.raw_power || 0})`, // Full text for reference if needed
                    levelLabel: `(Lv. ${p?.raw_power || 0})`,
                    level: Number(p?.raw_power || 0),
                    A: Number(p?.current_score || 0), // Score -> Teal
                    B: 100, // Target -> Red
                    fullMark: 100
                };
            });

            // ... (rest of logic)

            // Calculate Max Score for Domain (Infinite Growth)
            const maxVal = Math.max(
                100,
                ...merged.map(m => m.A),
                ...merged.map(m => m.B)
            );

            // Add 'fullMark'
            const finalData = merged.map(m => ({
                ...m,
                fullMark: maxVal,
                placeholder: 0 // Explicitly 0, no ghost radar
            }));

            setChartData(finalData);
        } catch (error) {
            console.error("Fetch Stats Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchStats();

            // 5. Auto-Update Trigger (Realtime)
            const channel = supabase.channel('radar-updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'daily_logs' },
                    () => {
                        console.log("Log Change Detected! Refetching Radar...");
                        fetchStats();
                    }
                )
                .subscribe();

            // 6. Manual Event Listener (From Modal)
            const handleRefresh = () => {
                console.log("Manual Refresh Triggered");
                fetchStats();
            };
            window.addEventListener('refresh-radar', handleRefresh);

            return () => {
                supabase.removeChannel(channel);
                window.removeEventListener('refresh-radar', handleRefresh);
            };
        }
    }, [mounted]);

    // Render Logic
    if (!mounted) {
        return <div className="flex-1 min-h-[300px] bg-slate-100/10 animate-pulse rounded-xl border border-dashed border-slate-700" />;
    }

    if (loading) {
        return (
            <Card className="h-full flex items-center justify-center bg-card/50 backdrop-blur-sm border-primary/20 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1E93AB]" />
            </Card>
        );
    }

    const maxScore = chartData.length > 0 ? chartData[0].fullMark : 100;
    const isAllZero = chartData.every(d => d.A === 0);

    return (
        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-mono uppercase tracking-wider text-primary">Bytelogic Stats</CardTitle>
                <SkillCalibration />
            </CardHeader>

            {/* 3. Explicit Height for Recharts Robustness */}
            <CardContent className="flex-1 min-h-[300px] p-4">
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="hsla(var(--secondary), 0.2)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={({ payload, x, y, textAnchor, stroke, radius }) => {
                                const data = chartData.find(d => d.subject === payload.value);
                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        <text
                                            x={0}
                                            y={0}
                                            dy={0}
                                            textAnchor={textAnchor}
                                            fill="hsla(var(--muted-foreground))"
                                            fontSize={10}
                                            fontWeight="bold"
                                        >
                                            {payload.value}
                                        </text>
                                        <text
                                            x={0}
                                            y={12}
                                            textAnchor={textAnchor}
                                            fill="#1E93AB"
                                            fontSize={9}
                                        >
                                            {data?.levelLabel || ""}
                                        </text>
                                    </g>
                                );
                            }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            tick={false}
                            axisLine={false}
                            domain={[0, maxScore]}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{ fontWeight: 'bold', color: '#333' }}
                        />



                        {/* 4. Correct Data Mapping */}
                        <Radar
                            name="Current Skill"
                            dataKey="A" // Teal Area
                            stroke="#1E93AB"
                            fill="#1E93AB"
                            fillOpacity={0.5}
                        />
                        <Radar
                            name="Target Skill"
                            dataKey="B" // Red Line
                            stroke="#E62727"
                            strokeDasharray="4 4"
                            fill="transparent"
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', marginTop: '5px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
