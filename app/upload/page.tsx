'use client';

import { useState } from 'react';
import { processPdfFile } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';


import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function pdfUpload() {
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<{
        type: "error" | "success";
        text: string;
    } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        setMessages(null);

        try {
            const formData = new FormData();
            formData.append("pdf", file);

            const result = await processPdfFile(formData)
            if (result.success) {
                setMessages({
                    type: "success",
                    text: result.message || "Pdf processed successfullly",
                });
                e.target.value = "";
            } else {
                setMessages({
                    type: "error",
                    text: result.message || "Failed to process pdf"
                })
            }


        } catch (err) {
            setMessages({
                type: "error",
                text: "An error has occured during file upload"
            })
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 py-12 px-4'>
            <div className='max-w-4xl mx-auto'>
                <h1 className='text-3xl font-bold text-gray-900 mb-8 text-center'>Pdf Upload</h1>
                <Card className='mb-6'>
                    <CardContent className='pt-6'>
                        <div className='space-y-4'>
                            <div className="flex items-center justify-between">
                                <Label htmlFor='pdf-upload'>Upload Pdf</Label>
                                <Link href="/">
                                    <Button variant="ghost" size="sm">
                                        Go Back
                                    </Button>
                                </Link>
                            </div>
                            <Input type='file' id='pdf-upload' accept='.pdf' onChange={handleFileUpload} disabled={isLoading} className='mt-2' />
                            {isLoading && (
                                <div className='flex items-center gap-2'>
                                    <Loader2 className='h-5 w-5 animate-spin'>
                                        <span className='text-muted-foreground'>Processing pdf........</span>
                                    </Loader2>
                                </div>
                            )}

                            {messages && (
                                <Alert variant={messages.type === "error" ? "destructive" : "default"}>
                                    <AlertTitle>
                                        {messages.type === "error" ? "Error" : "Success!"}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {messages.text}
                                    </AlertDescription>
                                </Alert>
                            )}


                        </div>

                    </CardContent>

                </Card>

            </div>
        </div>
    )
}