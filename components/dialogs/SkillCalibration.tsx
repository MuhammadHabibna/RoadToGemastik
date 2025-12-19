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
// Native range input is easier than shadcn slider manual wiring without full component
// but we'll try native input range for simplicity and "Writer Mode" speed.

export default function SkillCalibration() {
    const { skills, updateSkill } = useStore();
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (id: string, val: number) => {
        updateSkill(id, val);
        // Debounced save would be better, but simple save on change for now
        await supabase.from('skills').update({ current_score: val }).eq('id', id);
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
                        <h4 className="font-medium leading-none text-primary">Calibrate Skills</h4>
                        <p className="text-sm text-muted-foreground">
                            Adjust your self-assessment.
                        </p>
                    </div>
                    <div className="grid gap-4">
                        {skills.length === 0 && <p className="text-xs">No skills loaded.</p>}
                        {skills.map((skill) => (
                            <div key={skill.id} className="grid grid-cols-3 items-center gap-4">
                                <Label className="text-xs truncate">{skill.category}</Label>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    className="col-span-2 accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    value={skill.current_score}
                                    onChange={(e) => handleUpdate(skill.id, parseInt(e.target.value))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
