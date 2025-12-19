"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
// ContextMenu imports removed as component is missing
import { Trash } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ... imports
import DailyLogModal from "@/components/dialogs/DailyLogModal";
import { ClientTime } from "./ClientTime";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreVertical, Trash2 } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";

// ... existing imports

export default function DailyGrind() {
    const { logs, setLogs, removeLog } = useStore();
    const { addToast } = useToastStore();
    const [loading, setLoading] = useState(true);

    // React.useEffect to fetch logs on mount
    React.useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase
                .from('daily_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setLogs(data);
            }
            setLoading(false);
        };

        fetchLogs();

        // Subscribe to real-time changes
        const channel = supabase.channel('daily-grind-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, (payload) => {
                fetchLogs();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [setLogs]);

    const deleteLog = async (id: string) => {
        const { error } = await supabase.from('daily_logs').delete().eq('id', id);
        if (!error) {
            removeLog(id);
            addToast("Log deleted successfully", 'info');
        } else {
            addToast("Failed to delete log", 'error');
        }
    };

    return (
        <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
            {/* Progress Ring Section */}
            <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <div className="text-[100px] font-bold leading-none">80%</div>
                </div>
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* SVG Circle Progress */}
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-secondary" strokeDasharray="351.86" strokeDashoffset="70" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-bold">80%</span>
                        <span className="text-xs text-muted-foreground uppercase">Daily Goal</span>
                    </div>
                </div>
            </div>

            {/* Log Feed */}
            <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-mono text-sm uppercase">Log Stream</h3>
                    <DailyLogModal />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {logs.map((log) => (
                        <div key={log.id} className="relative pl-4 border-l-2 border-primary/20 hover:border-primary transition-colors py-1 group pr-2">
                            <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-mono text-muted-foreground">
                                    <ClientTime timestamp={log.created_at} />
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-secondary uppercase tracking-tighter mr-2">{log.focus_category}</span>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary/10 rounded">
                                                <MoreVertical className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-32 p-1" align="end">
                                            <button
                                                onClick={() => deleteLog(log.id)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <p className="text-sm font-medium mt-1 pr-4 break-words line-clamp-2" title={log.description}>{log.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">
                                    {log.duration_minutes}m
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    +{log.xp_value || Math.round(log.duration_minutes * ((log.mood_score || 3) / 3))} XP
                                </span>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && !loading && (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                            No logs yet. Start grinding!
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
