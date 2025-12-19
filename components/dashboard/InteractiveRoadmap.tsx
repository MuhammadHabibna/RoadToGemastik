"use client"

import React, { useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CheckCircle2, Circle } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import MilestoneManager from "@/components/dialogs/MilestoneManager";

export default function InteractiveRoadmap() {
    const { milestones } = useStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Default milestones if empty
    const displayMilestones = milestones.length > 0 ? milestones : [
        { id: '1', title: 'Learn Next.js', target_date: '2025-12-20', status: 'Done', position: 1 },
        { id: '2', title: 'Database Schema', target_date: '2025-12-25', status: 'In Progress', position: 2 },
        { id: '3', title: 'API Integration', target_date: '2026-01-05', status: 'Pending', position: 3 },
        { id: '4', title: 'Beta Launch', target_date: '2026-02-01', status: 'Pending', position: 4 },
        { id: '5', title: 'Gemastik Qualifiers', target_date: '2026-04-10', status: 'Pending', position: 5 },
    ];

    return (
        <Card className="flex flex-col border-secondary/20 bg-card/40 backdrop-blur-md overflow-hidden relative">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Strategic Roadmap
                </CardTitle>
                <MilestoneManager />
            </CardHeader>
            <CardContent className="flex-1 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2" />
                <div
                    ref={scrollRef}
                    className="flex items-center gap-8 overflow-x-auto pb-4 pt-8 px-4 scrollbar-thin scrollbar-thumb-secondary/20 scrollbar-track-transparent h-full"
                >
                    {displayMilestones.map((milestone, index) => {
                        const isDone = milestone.status === 'Done';
                        const isActive = milestone.status === 'In Progress';

                        return (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative flex flex-col items-center min-w-[140px] group cursor-pointer"
                            >
                                {/* Node */}
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 z-10 transition-all duration-300",
                                    isDone ? "bg-secondary border-secondary shadow-[0_0_10px_theme(colors.secondary.DEFAULT)]" :
                                        isActive ? "bg-primary border-primary shadow-[0_0_15px_theme(colors.primary.DEFAULT)] scale-125" :
                                            "bg-background border-muted-foreground"
                                )}>
                                    {isDone && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
                                </div>

                                {/* Content */}
                                <div className="mt-4 text-center">
                                    <div className={cn(
                                        "text-xs font-bold font-mono transition-colors",
                                        isActive ? "text-primary" : "text-foreground"
                                    )}>
                                        {milestone.title}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-1 bg-muted/30 px-2 py-0.5 rounded-full inline-block">
                                        {milestone.target_date}
                                    </div>
                                </div>

                                {/* Hover Effect Line */}
                                <div className="absolute top-[8px] left-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left z-0" />
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
