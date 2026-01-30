import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import Papa from 'papaparse';

export async function parseFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (file.type === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        return data.text;
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = buffer.toString('utf-8');
        const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
        return JSON.stringify(data, null, 2);
    }

    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type ${file.type}`);
}
