"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { useStore } from "@/lib/store";
import SkillCalibration from "@/components/dialogs/SkillCalibration";
import { Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import { FOCUS_CATEGORIES } from "@/lib/constants";

export default function RadarWidget() {
    const { skills, setSkills } = useStore();
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.warn("RadarWidget: No active session found.");
            setLoading(false);
            return;
        }

        // 1. Fetch Targets (Manual Goals)
        const { data: targets, error: targetError } = await supabase
            .from('skills')
            .select('category, target_score, id');

        // 2. Fetch Current Progress (Dynamic from View)
        // User specified "raw_power" and "current_score" fields in the new view
        const { data: progress, error: progressError } = await supabase
            .from('skill_summary')
            .select('*');

        console.log("RadarWidget: Raw Data from View:", progress);
        if (progressError) console.error("RadarWidget Error:", progressError);

        // Merge logic
        const mergedData = FOCUS_CATEGORIES.map(cat => {
            const targetData = targets?.find((t: any) => t.category === cat.value);
            // Ensure strict string matching for category
            const progressData = progress?.find((p: any) => p.focus_category === cat.value);

            return {
                id: targetData?.id || 'temp-' + cat.value,
                category: cat.value,
                label: cat.label,
                current_score: progressData?.current_score || 0, // Updated column
                level: progressData?.raw_power || 0,             // Updated column
                target_score: targetData?.target_score || 100,
                fullMark: 100
            };
        });

        console.log("RadarWidget: Merged Data for Chart:", mergedData);
        setSkills(mergedData);
        setLoading(false);
    };

    // ... useEffect remains same ...

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-background/95 backdrop-blur border border-border p-2 rounded-lg shadow-lg text-xs">
                    <p className="font-bold mb-1">{data.labelPretty}</p>
                    <p className="text-[#1E93AB]">Level: {data.level}</p>
                    <p className="text-[#1E93AB]">Score: {data.current_score}</p>
                    <p className="text-[#E62727]">Target: {data.target_score}</p>
                </div>
            );
        }
        return null;
    };

    const displayData = skills.length > 0 ? skills : FOCUS_CATEGORIES.map(c => ({
        category: c.value,
        label: c.label,
        current_score: 0,
        level: 0,
        target_score: 100,
        fullMark: 100
    }));

    // Calculate Max Score for Infinite Growth Domain
    const maxScore = Math.max(
        100,
        ...displayData.map((s: any) => s.current_score || 0),
        ...displayData.map((s: any) => s.target_score || 0)
    );

    // Check if user has any data
    const isAllZero = displayData.every((s: any) => (s.current_score || 0) === 0);

    // Transform for Recharts
    const finalData = displayData.map((s: any) => ({
        subject: `${s.label || s.category} (Lv. ${s.level || 0})`, // Format: "NLP (Lv. 12)"
        labelPretty: s.label || s.category, // Clean label for tooltip
        level: s.level || 0,
        A: s.current_score,
        B: s.target_score,
        // Visual Fallback: 60% fill if all zero, else 0
        placeholder: isAllZero ? (maxScore * 0.6) : 0,
        fullMark: maxScore
    }));


    // Debugging: Validate Data Delivery
    console.table(finalData);
    console.log(`RadarWidget: Fetching complete. Zero State: ${isAllZero}`);

    if (!isMounted) return null;

    if (loading) {
        return (
            <Card className="h-full flex items-center justify-center bg-card/50 backdrop-blur-sm border-primary/20">
                <Loader2 className="w-8 h-8 animate-spin text-[#1E93AB]" />
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-mono uppercase tracking-wider text-primary">Bytelogic Stats</CardTitle>
                <SkillCalibration />
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={finalData}>
                        <PolarGrid stroke="hsla(var(--secondary), 0.2)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'hsla(var(--muted-foreground))', fontSize: 9 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            tick={false}
                            axisLine={false}
                            domain={[0, maxScore]}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        {/* Placeholder Radar (Ghost) */}
                        {isAllZero && (
                            <Radar
                                name="Placeholder"
                                dataKey="placeholder"
                                stroke="#1E93AB"
                                strokeOpacity={0.2}
                                fill="#1E93AB"
                                fillOpacity={0.05}
                            />
                        )}

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
                        <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
