"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DayPicker } from 'react-day-picker';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Minimal custom CSS for DayPicker to match theme if standard css is missing

import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
// ContextMenu imports removed as component is missing
import { Trash } from "lucide-react";

export default function IntegratedCalendar() {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [target, setTarget] = React.useState("");
    const [isDeadline, setIsDeadline] = React.useState(false);

    // Store targets as object { text, type }
    const [targets, setTargets] = React.useState<Record<string, { text: string, type: 'normal' | 'deadline' }>>({});
    const [activeDays, setActiveDays] = React.useState<Date[]>([]);

    // Fetch all targets on mount
    const fetchTargets = async () => {
        const { data } = await supabase.from('tactical_targets').select('target_date, target_text, target_type');
        if (data) {
            const newTargets: Record<string, { text: string, type: 'normal' | 'deadline' }> = {};
            const newActiveDays: Date[] = [];

            data.forEach((t: any) => {
                newTargets[t.target_date] = {
                    text: t.target_text,
                    type: t.target_type || 'normal'
                };
                newActiveDays.push(new Date(t.target_date));
            });

            setTargets(newTargets);
            setActiveDays(newActiveDays);
        }
    };

    React.useEffect(() => {
        fetchTargets();

        const channel = supabase.channel('calendar-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tactical_targets' }, () => {
                fetchTargets();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel) };
    }, []);

    // Update input when date changes
    React.useEffect(() => {
        if (date) {
            const dateStr = format(date, 'yyyy-MM-dd');
            const existing = targets[dateStr];
            if (existing) {
                setTarget(existing.text);
                setIsDeadline(existing.type === 'deadline');
            } else {
                setTarget("");
                setIsDeadline(false);
            }
        }
    }, [date, targets]);

    const handleSaveTarget = async () => {
        if (!date) return;

        const dateStr = format(date, 'yyyy-MM-dd');
        const type = isDeadline ? 'deadline' : 'normal';

        // Upsert logic
        const { error } = await supabase.from('tactical_targets').upsert({
            target_date: dateStr,
            target_text: target,
            target_type: type
        }, { onConflict: 'user_id, target_date' });

        if (!error) {
            // Optimistic update
            setTargets(prev => ({
                ...prev,
                [dateStr]: { text: target, type: type }
            }));

            if (!activeDays.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
                setActiveDays(prev => [...prev, date]);
            }
        }
    };

    const handleDeleteTarget = async (targetDate: Date) => {
        const dateStr = format(targetDate, 'yyyy-MM-dd');

        const { error } = await supabase.from('tactical_targets').delete().eq('target_date', dateStr);

        if (!error) {
            const { [dateStr]: _, ...rest } = targets;
            setTargets(rest);
            setActiveDays(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
            if (format(date!, 'yyyy-MM-dd') === dateStr) {
                setTarget("");
                setIsDeadline(false);
            }
        }
    }

    const modifiers = {
        highlight: activeDays
    };

    return (
        <Card className="h-full border border-secondary/20 bg-secondary/5 backdrop-blur-sm shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/50">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-primary flex items-center justify-between">
                    <span>Tactical Schedule</span>
                    <span className="text-[10px] text-muted-foreground bg-primary/10 px-2 py-0.5 rounded">Oct 2026</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex justify-center items-center flex-1">
                    <DayPicker
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        showOutsideDays
                        className="p-4"
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium font-mono uppercase tracking-widest text-foreground",
                            nav: "space-x-1 flex items-center",
                            nav_button: cn(
                                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-secondary/20 rounded-full flex items-center justify-center transition-all"
                            ),
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] uppercase font-mono mb-2",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: cn(
                                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-secondary/20 hover:text-secondary rounded-lg transition-all"
                            ),
                            day_range_end: "day-range-end",
                            day_selected:
                                "bg-secondary text-white hover:bg-secondary hover:text-white focus:bg-secondary focus:text-white shadow-[0_0_10px_theme(colors.secondary.DEFAULT)]",
                            day_today: "bg-accent text-accent-foreground font-bold border border-primary/30",
                            day_outside:
                                "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle:
                                "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                        }}
                        components={{
                            IconLeft: () => <ChevronLeft className="w-4 h-4" />,
                            IconRight: () => <ChevronRight className="w-4 h-4" />,
                        }}
                        modifiers={modifiers}
                        modifiersClassNames={{
                            highlight: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full animate-pulse"
                        }}
                    />
                </div>
                {/* Target Setting Area */}
                <div className="p-4 border-t border-border/50 bg-muted/20">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder={date ? "Set target for this date..." : "Select a date"}
                            className="flex-1 bg-background border border-input rounded px-3 py-1 text-xs"
                            disabled={!date}
                        />
                        <button
                            onClick={handleSaveTarget}
                            disabled={!date}
                            className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90"
                        >
                            SET
                        </button>
                        {/* Delete Button */}
                        {date && targets[format(date, 'yyyy-MM-dd')]?.text && (
                            <button
                                onClick={() => handleDeleteTarget(date)}
                                className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-bold hover:bg-destructive/90"
                                title="Delete Target"
                            >
                                <Trash className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Deadline Toggle */}
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="isDeadline"
                            className="w-3 h-3"
                            checked={isDeadline}
                            onChange={(e) => setIsDeadline(e.target.checked)}
                            disabled={!date}
                        />
                        <label htmlFor="isDeadline" className="text-[10px] uppercase font-bold text-muted-foreground cursor-pointer">
                            Mark as Deadline
                        </label>
                    </div>

                    {/* Current Target Display */}
                    {date && targets[format(date, 'yyyy-MM-dd')] && (
                        <div className={cn(
                            "mt-2 text-xs p-2 rounded border",
                            targets[format(date, 'yyyy-MM-dd')].type === 'deadline'
                                ? "bg-red-500/10 border-red-500/50 text-red-500 font-bold"
                                : "bg-background border-border text-foreground"
                        )}>
                            {targets[format(date, 'yyyy-MM-dd')].text}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
