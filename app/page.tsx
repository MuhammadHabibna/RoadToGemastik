import React from 'react';
import MissionHeader from "@/components/dashboard/MissionHeader";
import RadarWidget from "@/components/dashboard/RadarWidget";
import HeatmapWidget from "@/components/dashboard/HeatmapWidget";
import DailyGrind from "@/components/dashboard/DailyGrind";
import InteractiveRoadmap from "@/components/dashboard/InteractiveRoadmap";
import IntegratedCalendar from "@/components/dashboard/IntegratedCalendar";

export const dynamic = 'force-dynamic'
export default function Home() {
    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-6 overflow-hidden flex flex-col gap-4">
            {/* Zone A: Header & Status (Full Width) */}
            <section className="w-full shrink-0">
                <MissionHeader />
            </section>

            {/* Main Grid: 12 Columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">

                {/* Zone B: Strategy & Stats (4 Columns) */}
                <section className="md:col-span-4 flex flex-col gap-4 min-h-[500px]">
                    <div className="flex-1 min-h-[300px]">
                        <RadarWidget />
                    </div>
                    <div className="h-[200px]">
                        <HeatmapWidget />
                    </div>
                </section>

                {/* Zone C: Execution & Timeline (5 Columns) */}
                <section className="md:col-span-5 flex flex-col gap-4">
                    {/* Top: Timeline */}
                    <div className="h-[240px]">
                        <InteractiveRoadmap />
                    </div>
                    {/* Bottom: Calendar */}
                    <div className="flex-1 min-h-[300px]">
                        <IntegratedCalendar />
                    </div>
                </section>

                {/* Zone D: The Daily Grind (3 Columns) */}
                <section className="md:col-span-3 flex flex-col gap-4 h-full">
                    <DailyGrind />
                </section>

            </div>
        </main>
    );
}
