"use client"

import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose
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

    const [success, setSuccess] = useState(false);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setSuccess(false);

        // 1. Optimistic Update (Zustand)
        const newLog = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            focus_category: data.category,
            description: data.description,
            mood_score: data.mood,
            duration_minutes: data.duration
        };
        addLog(newLog);

        // 2. Supabase Insert
        const { error } = await supabase.from('daily_logs').insert({
            focus_category: data.category,
            description: data.description,
            mood_score: data.mood,
            duration_minutes: data.duration
        });

        setLoading(false);
        if (!error) {
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                reset();
                setSuccess(false);
            }, 1000); // Close after 1s success message
        } else {
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
                            <option value="NLP">NLP & Text Mining</option>
                            <option value="CV">Computer Vision</option>
                            <option value="ML">Machine Learning (Tabular)</option>
                            <option value="Stats">Statistical Foundation</option>
                            <option value="DE">Data Engineering</option>
                            <option value="MLOps">Model Deployment (MLOps)</option>
                        </select>
                        {errors.category && <span className="text-xs text-red-500 col-start-2 italic">{errors.category.message}</span>}
                    </div>
                    {/* ... fields ... */}
                </form>
                <DialogFooter>
                    <Button type="submit" disabled={loading || success} className={success ? "bg-green-600 hover:bg-green-700 w-full" : "w-full"}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : success ? "Log Saved! 🚀" : "Commit Log"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
