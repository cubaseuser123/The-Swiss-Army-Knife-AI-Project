'use client';

export function BackgroundGrid() {
    return (
        <div className="fixed inset-0 -z-10 h-full w-full bg-landing-background">
            <div
                className="absolute bottom-0 left-0 right-0 top-0"
                style={{
                    backgroundImage: `linear-gradient(to right, #CDA575 1px, transparent 1px), linear-gradient(to bottom, #CDA575 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            ></div>

            {/* Kept the blur orbs as they add to the aesthetic, but adjusted opacity */}
            <div className="absolute top-20 right-0 w-64 h-64 bg-landing-primary/10 opacity-40 blur-3xl rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-40 left-0 w-96 h-96 bg-landing-primary/10 opacity-40 blur-3xl rounded-full pointer-events-none animate-pulse delay-700" />
        </div>
    );
}
