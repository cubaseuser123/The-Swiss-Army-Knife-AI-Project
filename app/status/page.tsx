import { BackgroundGrid } from "@/components/ui/background-grid";
import statusData from "@/status_data.json";
import { Check, CircleDashed, Clock } from "lucide-react";

export default function StatusPage() {
    const { roadmap } = statusData;

    return (
        <div className="min-h-screen text-landing-text-main selection:bg-landing-primary selection:text-landing-surface snap-y snap-proximity scroll-smooth relative">
            <BackgroundGrid />

            <div className="mx-auto max-w-5xl px-6 lg:px-8 pt-32 pb-20 relative z-10">

                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center rounded-full border border-landing-border bg-landing-surface px-3 py-1 text-sm font-mono-custom text-landing-text-main shadow-sm mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-landing-primary mr-2 animate-pulse" />
                        System Status: Operational
                    </div>
                    <h1 className="font-display text-5xl font-extrabold tracking-tight text-landing-text-main sm:text-7xl mb-6">
                        Mission Roadmap
                    </h1>
                    <p className="text-xl text-landing-text-muted max-w-2xl mx-auto font-light font-body">
                        Tracing the trajectory from MVP to full-scale agentic platform.
                    </p>
                </div>

                {/* Progress Bar Component */}
                <div className="mb-20 bg-landing-surface border-2 border-landing-border p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-end mb-4 font-mono-custom font-bold text-landing-text-main">
                        <span className="text-xl">Overall Completion</span>
                        <span className="text-3xl text-landing-primary">{roadmap.overallProgress}%</span>
                    </div>
                    <div className="w-full h-8 bg-landing-border/20 rounded-full overflow-hidden border border-landing-border relative">
                        {/* Striped Background Pattern for the Empty Part */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)' }}>
                        </div>

                        {/* Filled Progress Bar */}
                        <div
                            className="h-full bg-landing-primary relative transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                            style={{ width: `${roadmap.overallProgress}%` }}
                        >
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0, #fff 10px, transparent 10px, transparent 20px)' }}>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-3 text-xs font-mono-custom text-landing-text-muted uppercase tracking-wider">
                        <span>Phase 1 (Done)</span>
                        <span>Phase 5 (Goal)</span>
                    </div>
                </div>

                {/* Roadmap Phases */}
                <div className="space-y-8">
                    {roadmap.phases.map((phase, index) => {
                        const isCompleted = phase.status === "completed";
                        const isPending = phase.status === "pending";

                        return (
                            <div key={phase.id} className={`group relative bg-landing-surface border-2 ${isCompleted ? 'border-landing-primary' : 'border-landing-border'} rounded-xl p-8 transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#121212]`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-landing-border/20">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 ${isCompleted ? 'bg-landing-primary border-landing-primary text-landing-surface' : 'bg-landing-surface border-landing-border text-landing-text-muted'} font-bold text-xl`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className={`text-2xl font-display font-bold ${isCompleted ? 'text-landing-text-main' : 'text-landing-text-muted'}`}>{phase.title}</h3>
                                            <p className={`text-sm font-mono-custom ${isCompleted ? 'text-landing-primary' : 'text-landing-text-muted opacity-60'} uppercase tracking-widest mt-1`}>
                                                {isCompleted ? 'All Systems Go' : 'Awaiting Deployment'}
                                            </p>
                                        </div>
                                    </div>
                                    {isCompleted && (
                                        <div className="hidden md:flex items-center px-4 py-2 bg-green-500/10 text-green-600 rounded-full text-sm font-bold border border-green-500/20">
                                            <Check className="w-4 h-4 mr-2" />
                                            Completed
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {phase.items.map((item: any, i: number) => (
                                        <div key={i} className={`flex items-start p-3 rounded-lg border ${item.completed ? 'bg-landing-primary/5 border-landing-primary/20' : 'bg-transparent border-transparent'} transition-colors`}>
                                            <div className={`mt-0.5 mr-3 flex-shrink-0 ${item.completed ? 'text-landing-primary' : 'text-landing-text-muted/40'}`}>
                                                {item.completed ? <Check className="w-5 h-5" /> : <CircleDashed className="w-5 h-5" />}
                                            </div>
                                            <span className={`font-medium ${item.completed ? 'text-landing-text-main' : 'text-landing-text-muted/60'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
