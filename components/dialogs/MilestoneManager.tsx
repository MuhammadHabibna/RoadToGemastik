"use client"

import React, { useState } from 'react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { Edit2, Plus, GripVertical, CheckSquare, Square } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToastStore } from "@/lib/toast-store";

export default function MilestoneManager() {
    const { milestones, setMilestones } = useStore();
    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState("");

    const { addToast } = useToastStore();

    // Fetch Milestones on Mount
    React.useEffect(() => {
        const fetchMilestones = async () => {
            const { data } = await supabase.from('milestones').select('*').order('position', { ascending: true });
            if (data) {
                // @ts-ignore
                setMilestones(data);
            }
        };

        fetchMilestones();

        const channel = supabase.channel('milestone-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, () => {
                fetchMilestones();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [setMilestones]);

    const handleAdd = async () => {
        if (!newTitle || !newDate) return;

        // Reset inputs immediately for UX
        const title = newTitle;
        const date = newDate;
        setNewTitle("");
        setNewDate("");

        try {
            // Supabase Insert
            const { error } = await supabase.from('milestones').insert({
                title: title,
                target_date: date,
                status: 'Pending',
                position: milestones.length + 1,
                user_id: (await supabase.auth.getUser()).data.user?.id
            });
            if (error) throw error;
            addToast("Milestone added successfully", "success");
        } catch (error: any) {
            console.error("Error adding milestone:", error);
            addToast(`Failed to add milestone: ${error.message}`, "error");
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Done' ? 'Pending' : 'Done';

        try {
            // Optimistic UI
            const updated = milestones.map(m => m.id === id ? { ...m, status: newStatus } : m);
            // @ts-ignore
            setMilestones(updated);

            const { error } = await supabase.from('milestones').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
        } catch (error: any) {
            console.error("Error updating milestone:", error);
            addToast(`Update failed: ${error.message}`, "error");
        }
    };

    const deleteMilestone = async (id: string) => {
        try {
            const { error } = await supabase.from('milestones').delete().eq('id', id);
            if (error) throw error;
            // @ts-ignore
            setMilestones(milestones.filter(m => m.id !== id));
            addToast("Milestone deleted", "info");
        } catch (error: any) {
            console.error("Error deleting milestone:", error);
            addToast(`Delete failed: ${error.message}`, "error");
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="h-6 w-6 p-0 bg-transparent border-none">
                    <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Strategic Roadmap Editor</SheetTitle>
                    <SheetDescription>
                        Manage your campaign milestones.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                        <h4 className="text-sm font-medium">Add New Milestone</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Master DP" />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Date</Label>
                                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                            </div>
                        </div>
                        <Button onClick={handleAdd} size="sm" className="w-full bg-primary hover:bg-primary/90">
                            <Plus className="w-4 h-4 mr-2" /> Add to Roadmap
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Current Milestones</h4>
                        {milestones.length === 0 && <p className="text-muted-foreground text-xs italic">No active missions. Add one above.</p>}
                        {milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors group">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                <button onClick={() => toggleStatus(milestone.id, milestone.status)}>
                                    {milestone.status === 'Done'
                                        ? <CheckSquare className="w-5 h-5 text-secondary" />
                                        : <Square className="w-5 h-5 text-muted-foreground" />
                                    }
                                </button>
                                <div className="flex-1">
                                    <div className={`text-sm font-medium ${milestone.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                                        {milestone.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{milestone.target_date}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive"
                                    onClick={() => deleteMilestone(milestone.id)}
                                >
                                    <span className="sr-only">Delete</span>
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
