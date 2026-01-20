'use server';

import { PDFParse } from 'pdf-parse';
import { db } from '@/lib/db-config';
import { documents } from '@/lib/db-schema';
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";

export async function processPdfFile(formData: FormData) {
    try {
        const file = formData.get("pdf") as File;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();

        if (!data.text || data.text.trim().length === 0) {
            return {
                success: false,
                error: "No text is found in the pdf",
            }
        }

        const chunks = await chunkContent(data.text);
        const embeddings = await generateEmbeddings(chunks);

        const records = chunks.map((chunk, index) => {
            return {
                content: chunk,
                embedding: embeddings[index],
            }
        })
        await db.insert(documents).values(records);

        return {
            success: true,
            message: `Created ${records.length} searchable chunks`
        }

    } catch (error) {
        console.error("Pdf Processing error", error);
        return {
            sucess: false,
            error: "Failed to process PDF"
        }
    }
}