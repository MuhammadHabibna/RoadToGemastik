"use client"

import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";  // Import Textarea
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { useToastStore } from "@/lib/toast-store";
import { FOCUS_CATEGORIES } from "@/lib/constants";
import { useRouter } from "next/navigation";

// 1. Zod Schema
const formSchema = z.object({
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
    duration: z.coerce.number().min(1, "Duration must be at least 1 min"),
    mood: z.coerce.number().min(1).max(5)
});

type FormData = z.infer<typeof formSchema>;

export default function DailyLogModal() {
    const [open, setOpen] = useState(false);
    const { addToast } = useToastStore();
    const { addLog } = useStore();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "NLP & Text Mining",
            description: "",
            duration: 30,
            mood: 4
        }
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        const xp = Math.round(data.duration * (data.mood / 3));

        try {
            // 1. Optimistic Update (Zustand)
            const newLog = {
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                focus_category: data.category,
                description: data.description,
                mood_score: data.mood,
                duration_minutes: data.duration,
                xp_value: xp
            };

            // Add to store immediately
            addLog(newLog);

            // 2. Supabase Insert
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Explicit user check as requested
                addToast("Please login to commit logs.", 'error');
                setLoading(false);
                return;
            }

            console.log("Committing Log:", { ...newLog, user_id: user.id });
            console.log("Submitting category:", data.category); // DEBUG SYNC

            const { error } = await supabase.from('daily_logs').insert({
                focus_category: data.category,
                description: data.description,
                mood_score: data.mood,
                duration_minutes: data.duration,
                xp_value: xp,
                user_id: user.id // Explicit assignment
            });

            if (error) throw error; // Throw to catch block

            addToast(`Successfully logged ${data.category} activity! (+${xp} XP)`, 'success');
            setOpen(false);
            reset();
            router.refresh();

        } catch (error: any) {
            console.error("Error inserting daily log:", error.message || error);
            addToast(`Failed to save log: ${error.message || "Unknown error"}`, 'error');
            // Ideally rollback optimistic update here if needed, but for simple app keeping it might be okay or remove it:
            // removeLog(newLog.id); // If we extracted id to scope
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 border-secondary/50 text-secondary hover:bg-secondary/10">
                    <Plus className="w-4 h-4 mr-1" /> Log Activity
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mission Log</DialogTitle>
                    <DialogDescription>
                        Record your daily progress towards Gemastik.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Focus</Label>
                        <select
                            id="category"
                            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("category")}
                        >
                            {FOCUS_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">Duration (m)</Label>
                        <Input
                            id="duration"
                            type="number"
                            className="col-span-3"
                            placeholder="60"
                            {...register("duration")}
                        />
                        {errors.duration && <span className="text-xs text-red-500 col-start-2 col-span-3 italic">{errors.duration.message}</span>}
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">Notes / Achievement</Label>
                        <Textarea
                            id="description"
                            className="col-span-3 min-h-[100px]"
                            placeholder="What did you accomplish? e.g. Implemented YOLOv8"
                            {...register("description")}
                        />
                        {errors.description && <span className="text-xs text-red-500 col-start-2 col-span-3 italic">{errors.description.message}</span>}
                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Commit Log"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
