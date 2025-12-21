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

    const [renderKey, setRenderKey] = useState(0);

    // 1. Client-Side Only Guard
    useEffect(() => setMounted(true), []);

    // 2. Fetch Data (Network Visible)
    const fetchStats = async () => {
        try {
            setLoading(true);
            // Check session first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            // Action: Switch Source to 'skills' Table
            const { data: skills, error: skillsError } = await supabase
                .from('skills')
                .select('*')
                .order('category', { ascending: true })
                .abortSignal(AbortSignal.timeout(5000));

            if (skillsError) console.error("Error fetching skills:", skillsError);

            // DEBUG: Raw Payload
            console.log("Raw Response from Supabase (skills):", skills);

            // C. Merge & Map Data
            // We map directly from the fetched skills data
            const merged = FOCUS_CATEGORIES.map(cat => {
                const s = skills?.find((x: any) => x.category === cat.value);

                return {
                    subject: `${cat.label} (${s?.current_score || 0}m)`, // Label with Minutes "NLP (120m)"
                    level: Number(s?.current_score || 0),
                    A: Number(s?.current_score || 0), // Current Minutes -> Teal
                    B: Number(s?.target_score || 100), // Target -> Red
                    fullMark: 100 // Legacy prop, unused with 'auto' domain
                };
            });

            // Action: Ensure Visibility via console.table
            console.table(merged);

            // Calculate Max Score for Domain (Infinite Growth) - Logic handled by 'auto' domain now

            // Add 'fullMark' - passing through merged
            const finalData = merged.map(m => ({
                ...m,
                placeholder: 0
            }));

            console.log("FINAL DATA FOR CHART:", finalData);

            // Action: Spreak operator to force re-render
            setChartData([...finalData]);
            setRenderKey(prev => prev + 1); // Force re-render
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
    if (!mounted) return <div className="h-[300px] animate-pulse bg-slate-900/50" />;

    if (loading) {
        return (
            <Card className="h-full flex items-center justify-center bg-card/50 backdrop-blur-sm border-primary/20 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1E93AB]" />
            </Card>
        );
    }

    // Dynamic Max Score Calculation (Optional, Recharts 'auto' handles it, but good for custom ticks if needed)
    // const maxScore = Math.max(100, ...chartData.map(d => Math.max(d.A, d.B)));

    return (
        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-mono uppercase tracking-wider text-primary">Bytelogic Stats</CardTitle>
                <SkillCalibration />
            </CardHeader>

            {/* 3. Explicit Height for Recharts Robustness */}
            <CardContent className="flex-1 min-h-[300px] p-4 flex items-center justify-center">
                <ResponsiveContainer key={renderKey} width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="hsla(var(--secondary), 0.2)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'hsla(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            tick={false}
                            axisLine={false}
                            domain={[0, 'auto']}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{ fontWeight: 'bold', color: '#333' }}
                            formatter={(value: number) => [`${value} Minutes`, '']}
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
                        {/* Center Dot */}
                        <Radar
                            dataKey="placeholder"
                            stroke="none"
                            fill="none"
                            dot={{ r: 3, fill: '#E62727', strokeWidth: 0 }}
                            isAnimationActive={false}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', marginTop: '5px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
