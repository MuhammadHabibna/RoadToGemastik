"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Activity, Radio } from 'lucide-react';
import { cn } from "@/lib/utils";

// Define strict types matching DB
interface DailyLog {
    id: string;
    created_at: string;
    focus_category: string;
    description: string;
    duration_minutes: number;
    xp_value: number;
}

const CATEGORY_COLORS: Record<string, string> = {
    "NLP & Text Mining": "bg-[#1E93AB] text-white hover:bg-[#1E93AB]/80", // Custom Teal
    "CV: Classification": "bg-blue-500",
    "CV: Object Detection": "bg-indigo-500",
    "Deep Learning": "bg-purple-500",
    "Predictive ML": "bg-emerald-500",
    "Generative AI": "bg-pink-500",
    // Fallback
    "default": "bg-slate-500"
};

export default function MissionLogStream() {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        // Real-time subscription
        const channel = supabase
            .channel('daily_logs_stream')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'daily_logs' },
                (payload) => {
                    // Prepend new log and keep only 5
                    setLogs((prev) => [payload.new as DailyLog, ...prev].slice(0, 5));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <Card className="border-slate-200/20 bg-background/30 backdrop-blur-sm h-full flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#1E93AB] animate-pulse" />
                    Mission Log Stream
                </CardTitle>
                <span className="text-xs text-muted-foreground">Live Feed</span>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-2 pl-2 pr-2">
                {logs.length === 0 && !loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Activity className="w-8 h-8 text-slate-700 mb-2" />
                        <p className="text-sm text-[#1E93AB] font-medium">No missions logged yet. Start your journey!</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[200px] w-full pr-4">
                        <div className="flex flex-col gap-3">
                            {logs.map((log) => (
                                <div key={log.id} className="relative pl-4 border-l-2 border-slate-700/50 hover:border-[#1E93AB] transition-colors pb-1 last:pb-0">
                                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-700 ring-2 ring-background group-hover:bg-[#1E93AB]" />

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                                                {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className={cn("text-[10px] px-1 py-0 h-5 font-normal", CATEGORY_COLORS[log.focus_category] || CATEGORY_COLORS["default"])}
                                            >
                                                {log.focus_category}
                                            </Badge>
                                        </div>

                                        <div className="flex items-baseline justify-between gap-2">
                                            <p className="text-sm font-medium text-slate-200 line-clamp-1 leading-tight">
                                                {log.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{log.duration_minutes}m</span>
                                            <span>•</span>
                                            <span>+{log.xp_value} XP</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
