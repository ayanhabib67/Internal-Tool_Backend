import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
});

export async function main(userPrompt) {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userPrompt,
    });

    return response.text;
}
