"use client"

import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { useToastStore } from "@/lib/toast-store";
import { FOCUS_CATEGORIES } from "@/lib/constants";

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

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "NLP",
            description: "",
            duration: 30,
            mood: 4
        }
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);

        const xp = Math.round(data.duration * (data.mood / 3));

        // 1. Optimistic Update (Zustand)
        // We set ID to a temp one, it will be refetched or we accept it's temporary in UI
        const newLog = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            focus_category: data.category,
            description: data.description,
            mood_score: data.mood,
            duration_minutes: data.duration,
            xp_value: xp
        };

        // 2. Supabase Insert
        const { error } = await supabase.from('daily_logs').insert({
            focus_category: data.category,
            description: data.description,
            mood_score: data.mood,
            duration_minutes: data.duration,
            xp_value: xp
        });

        setLoading(false);
        if (!error) {
            addToast(`Successfully logged ${data.category} activity! (+${xp} XP)`, 'success');
            addLog(newLog); // Update local store
            setOpen(false);
            reset();
        } else {
            addToast(`Failed to save log: ${error.message}`, 'error');
            console.error(error);
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
                        {errors.category && <span className="text-xs text-red-500 col-start-2 italic">{errors.category.message}</span>}
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
