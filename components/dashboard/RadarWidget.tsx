"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import SkillCalibration from "@/components/dialogs/SkillCalibration";

import { supabase } from "@/lib/supabaseClient";
import { FOCUS_CATEGORIES } from "@/lib/constants";

export default function RadarWidget() {
    const { skills, setSkills } = useStore();
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const { data: skillsData, error } = await supabase
            .from('skills')
            .select('*');

        if (skillsData) {
            // Merge with constants to ensure all categories exist (handling new user case)
            const mergedData = FOCUS_CATEGORIES.map(cat => {
                const found = skillsData.find((s: any) => s.category === cat.value);
                return {
                    id: found?.id || 'temp-' + cat.value,
                    category: cat.value,
                    label: cat.label,
                    current_score: found?.current_score || 0,
                    target_score: found?.target_score || 100,
                    fullMark: 100
                };
            });
            setSkills(mergedData);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchData();

        const channel = supabase.channel('skills-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-background/95 backdrop-blur border border-border p-2 rounded-lg shadow-lg text-xs">
                    <p className="font-bold mb-1">{data.label}</p>
                    <p className="text-[#1E93AB]">Current: {data.current_score}</p>
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
        target_score: 100,
        fullMark: 100
    }));

    // Transform for Recharts
    // We Map 'category' to 'subject' for the axis
    const finalData = displayData.map((s: any) => ({
        subject: s.category, // Use short value for axis if preferred, or s.label for long
        label: s.label || s.category, // Pass label for tooltip
        A: s.current_score,
        B: s.target_score,
        fullMark: 100
    }));


    return (
        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-mono uppercase tracking-wider text-primary">Bytelogic Stats</CardTitle>
                <SkillCalibration />
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={finalData}>
                        <PolarGrid stroke="hsla(var(--secondary), 0.2)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'hsla(var(--muted-foreground))', fontSize: 9 }}
                        />
                        <PolarRadiusAxis angle={30} tick={false} axisLine={false} />

                        <Tooltip content={<CustomTooltip />} />

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
