"use client"

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Rocket, Moon, Sun } from 'lucide-react';
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

const quotes = [
    "Code is poetry written for machines.",
    "The only way to do great work is to love what you do.",
    "It always seems impossible until it's done.",
    "Talk is cheap. Show me the code.",
    "Stay hungry, stay foolish."
];

export default function MissionHeader() {
    const [quote, setQuote] = useState("");
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }
        getUser();

        // Target Date: Oct 1, 2026
        const targetDate = new Date('2026-10-01T00:00:00');

        const interval = setInterval(() => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft({ days, hours, minutes, seconds });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    return (
        <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-background border-b border-border">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Rocket className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">GEMASTIK 2026 PREP</h1>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase">Mission Control Center</p>
                </div>
            </div>

            {/* Center: Quote */}
            <div className="hidden md:flex flex-1 justify-center mx-4">
                <div className="px-6 py-2 bg-secondary/10 backdrop-blur-sm border border-secondary/20 rounded-full text-secondary-foreground text-sm italic">
                    "{quote}"
                </div>
            </div>

            {/* Theme Toggle & Countdown */}
            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                    {user && <span className="text-xs font-mono text-muted-foreground">{user.email}</span>}
                </div>
                {user && (
                    <Button variant="destructive" size="sm" onClick={handleLogout} className="h-8 bg-[#E62727] hover:bg-red-700">
                        Logout
                    </Button>
                )}
                <ThemeToggle />
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground uppercase">Time to Launch</p>
                    <div className="text-3xl font-mono font-bold text-primary flex items-baseline gap-2">
                        <span>{timeLeft.days}d</span>
                        <span className="text-xl">{timeLeft.hours}h</span>
                        <span className="text-xl">{timeLeft.minutes}m</span>
                        <span className="text-lg text-primary/60">{timeLeft.seconds}s</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
