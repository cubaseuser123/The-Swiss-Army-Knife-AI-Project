'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import featuresData from '@/features_data.json';
import { BackgroundGrid } from '@/components/ui/background-grid';

interface Feature {
    id: string;
    title: string;
    description: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    description: string;
    features: Feature[];
}

interface Mode {
    id: string;
    title: string;
    icon: string;
    tagline: string;
    description: string;
    features: string[];
}

export default function FeaturesPage() {
    const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

    const toggleFeature = (featureId: string) => {
        setExpandedFeatures(prev => {
            const newSet = new Set(prev);
            if (newSet.has(featureId)) {
                newSet.delete(featureId);
            } else {
                newSet.add(featureId);
            }
            return newSet;
        });
    };

    const categories: Category[] = featuresData.categories;
    const modes: Mode[] = featuresData.modes;

    return (
        <div className="min-h-screen text-landing-text-main overflow-x-hidden selection:bg-landing-primary selection:text-landing-surface font-body relative">
            <BackgroundGrid />

            {/* Hero Section */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-10 relative z-10">
                <div className="text-center mb-10">
                    <div className="mb-6 mt-11 inline-flex items-center rounded-full border border-landing-border bg-landing-surface/80 backdrop-blur-sm px-4 py-1.5 text-sm font-mono-custom text-landing-text-main shadow-sm">
                        <Sparkles className="w-4 h-4 mr-2 text-landing-primary" />
                        27+ Powerful Tools
                    </div>
                    <h1 className="font-display text-5xl sm:text-7xl font-extrabold tracking-tight text-landing-text-main mb-6 leading-[0.95]">
                        The Complete <br />
                        <span className="text-landing-primary relative inline-block">
                            Toolkit.
                            <svg className="absolute -bottom-1 left-0 w-full h-3 text-landing-primary opacity-30" preserveAspectRatio="none" viewBox="0 0 100 10">
                                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-xl text-landing-text-muted max-w-2xl mx-auto font-body leading-relaxed">
                        Discover all the powerful tools and capabilities packed into Swiss Army Knife AI
                    </p>
                </div>

                {/* Modes Section */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-landing-text-main tracking-tight">
                                Modes
                            </h2>
                            <p className="mt-2 text-landing-text-muted font-body">Select the right mode for the mission.</p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {modes.map((mode) => (
                            <div
                                key={mode.id}
                                className="group relative flex flex-col justify-between h-full bg-landing-surface border-2 border-landing-text-main p-6 rounded-xl shadow-[6px_6px_0px_0px_#121212]"
                            >
                                <div>
                                    <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-[#EAE7DE] border-2 border-landing-border text-3xl shadow-sm group-hover:border-landing-primary transition-colors">
                                        {mode.icon}
                                    </div>
                                    <h3 className="text-xl font-display font-bold text-landing-text-main mb-1">
                                        {mode.title}
                                    </h3>
                                    <p className="text-sm font-semibold text-landing-primary mb-3 font-mono-custom">
                                        {mode.tagline}
                                    </p>
                                    <p className="text-sm text-landing-text-muted mb-5 font-body leading-relaxed">
                                        {mode.description}
                                    </p>
                                    <ul className="space-y-2">
                                        {mode.features.map((feature, idx) => (
                                            <li key={idx} className="text-xs text-landing-text-muted flex items-center gap-2 font-mono-custom">
                                                <span className="w-1.5 h-1.5 rounded-full bg-landing-primary flex-shrink-0"></span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Categories with Features */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-landing-text-main tracking-tight">
                                All Features
                            </h2>
                            <p className="mt-2 text-landing-text-muted font-body">Explore every tool in the arsenal.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="bg-landing-surface rounded-xl border-2 border-landing-border overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[6px_6px_0px_0px_#121212] hover:border-landing-text-main transition-all duration-300"
                            >
                                {/* Category Header */}
                                <div className="px-6 py-5 border-b-2 border-landing-border bg-gradient-to-r from-landing-surface to-[#EAE7DE]">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-12 items-center justify-center rounded-lg bg-landing-surface border-2 border-landing-border text-2xl shadow-sm">
                                            {category.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-display font-bold text-landing-text-main">
                                                {category.name}
                                            </h3>
                                            <p className="text-sm text-landing-text-muted font-mono-custom">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="divide-y divide-landing-border">
                                    {category.features.map((feature, index) => {
                                        const isExpanded = expandedFeatures.has(feature.id);
                                        const isLast = index === category.features.length - 1;
                                        return (
                                            <div
                                                key={feature.id}
                                                className={`bg-landing-surface transition-colors duration-300 ${isExpanded ? 'bg-[#FAF8F5]' : ''}`}
                                            >
                                                <button
                                                    onClick={() => toggleFeature(feature.id)}
                                                    className={`w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-all cursor-pointer group outline-none ${isLast && !isExpanded ? 'rounded-b-xl' : ''}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isExpanded ? 'bg-landing-primary scale-125' : 'bg-landing-border group-hover:bg-landing-primary'}`}></div>
                                                        <span className="font-medium text-landing-text-main font-body text-lg">
                                                            {feature.title}
                                                        </span>
                                                    </div>
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all duration-300 ${isExpanded ? 'border-landing-primary bg-landing-primary text-landing-surface rotate-180' : 'border-landing-border bg-landing-surface text-landing-text-muted group-hover:border-landing-text-main'}`}>
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </button>
                                                <div
                                                    className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                                        }`}
                                                >
                                                    <div className="overflow-hidden">
                                                        <div className="px-6 pb-6 pt-2">
                                                            <div className="ml-5 pl-6 border-l-2 border-landing-primary/20">
                                                                <p className="text-base text-landing-text-muted font-mono-custom leading-relaxed bg-white/50 p-4 rounded-lg border border-landing-border/30 backdrop-blur-sm">
                                                                    {feature.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="relative z-10 bg-[#E0B784] border-t border-landing-border/20 mt-12">
                <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                    <p className="text-xs leading-5 text-landing-text-muted font-mono-custom text-center">
                        © 2026 Swiss Army Knife AI, Inc. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
