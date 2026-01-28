import { PDFParse } from 'pdf-parse';

export async function parseFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (file.type === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        return data.text;
    }
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
        return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type ${file.type}`);
}
