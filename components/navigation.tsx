import {
    SignOutButton,
    SignedIn,
} from '@clerk/nextjs';
import { Button } from './ui/button';

export const Navigation = () => {
    return (
        <nav className='border-b border-[var(--foreground)]/10"'>
            <div className='flex container h-16 items-center justify-between px-4 mx-auto'>
                <div className='text-xl font-semibold'>Rag Chatbot</div>

                <div className='flex gap-2'>
                    {/* SignedOut buttons removed as they are on the landing page */}

                    <SignedIn>
                        <SignOutButton>
                            <Button variant='outline'>Sign out</Button>
                        </SignOutButton>
                    </SignedIn>
                </div>

            </div>
        </nav>
    )
}