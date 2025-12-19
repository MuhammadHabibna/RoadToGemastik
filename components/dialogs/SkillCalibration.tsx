"use client"

import React, { useState } from 'react';
import {
    Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToastStore } from "@/lib/toast-store";
// Native range input is easier than shadcn slider manual wiring without full component
// but we'll try native input range for simplicity and "Writer Mode" speed.

export default function SkillCalibration() {
    const { skills, updateSkill } = useStore();
    const [loading, setLoading] = useState(false);

    const { addToast } = useToastStore();

    const handleUpdate = async (id: string, val: number, category?: string) => {
        try {
            // Optimistic update - Update Store (Target only)
            // updateSkill(id, val); // We need a updateTarget method in store or similar? 
            // Actually, the store `skills` object has `target_score`. Let's assume we update that.
            // For now, let's just do the DB update and refresh or let Realtime handle it.

            // Database update (Upsert to handle new skills)
            if (id.startsWith('temp-') && category) {
                const { data, error } = await supabase
                    .from('skills')
                    .upsert({
                        category: category,
                        target_score: val, // Updating TARGET now
                        user_id: (await supabase.auth.getUser()).data.user?.id
                    }, { onConflict: 'user_id, category' }) // Fixed constraint
                    .select()
                    .single();

                if (error) throw error;

            } else {
                const { error } = await supabase.from('skills').update({ target_score: val }).eq('id', id);
                if (error) throw error;
            }
        } catch (error: any) {
            console.error("Error updating skill:", error.message || error);
            addToast(`Failed to update skill: ${error.message}`, 'error');
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100 transition-opacity">
                    <Settings2 className="w-4 h-4 text-primary" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background/95 backdrop-blur border-primary/20">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none text-primary">Set Targets</h4>
                        <p className="text-sm text-muted-foreground">
                            Adjust your learning goals (Red Line).
                        </p>
                    </div>
                    <div className="grid gap-4">
                        {skills.length === 0 && <p className="text-xs">No skills loaded.</p>}
                        {skills.map((skill) => (
                            <div key={skill.id} className="grid grid-cols-3 items-center gap-4">
                                <Label className="text-xs truncate">{skill.category}</Label>
                                <input
                                    type="range"
                                    min="0" max="100" // Target cap at 100? Or more? standard is 100.
                                    className="col-span-2 accent-red-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    value={skill.target_score}
                                    onChange={(e) => handleUpdate(skill.id, parseInt(e.target.value), skill.category)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
