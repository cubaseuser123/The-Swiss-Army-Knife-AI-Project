import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
    separators: ["\n\n", "\n", ". ", " ", ""],
});

export async function chunkContent(content: string) {
    return await textSplitter.splitText(content.trim());
}