
import { create } from 'zustand';

// Types representing our DB tables
export interface DailyLog {
    id: string;
    created_at: string;
    focus_category: string;
    description: string;
    mood_score: number;
    duration_minutes: number;
}

export interface Milestone {
    id: string;
    title: string;
    target_date: string;
    status: 'Pending' | 'In Progress' | 'Done';
    position: number;
}

export interface Skill {
    id: string;
    category: string;
    current_score: number;
    target_score: number;
}

interface DashboardState {
    logs: DailyLog[];
    milestones: Milestone[];
    skills: Skill[];

    // Actions
    setLogs: (logs: DailyLog[]) => void;
    addLog: (log: DailyLog) => void;
    setMilestones: (milestones: Milestone[]) => void;
    setSkills: (skills: Skill[]) => void;
    updateSkill: (id: string, score: number) => void;
    removeLog: (id: string) => void;
}

export const useStore = create<DashboardState>((set) => ({
    logs: [],
    milestones: [],
    skills: [],

    setLogs: (logs) => set({ logs }),
    addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),

    setMilestones: (milestones) => set({ milestones }),

    setSkills: (skills) => set({ skills }),
    updateSkill: (id, score) => set((state) => ({
        skills: state.skills.map(s => s.id === id ? { ...s, current_score: score } : s)
    })),

    removeLog: (id) => set((state) => ({
        logs: state.logs.filter(log => log.id !== id)
    }))
}));
