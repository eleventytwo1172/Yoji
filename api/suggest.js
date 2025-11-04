/**
 * Vercel Serverless Function to securely call the Gemini API.
 * This file is updated to use ESM syntax (import/export) to match package.json.
 */

// 1. Use import instead of require
import { GoogleGenAI } from '@google/genai';

// System instruction to guide the model's behavior
const systemPrompt = "You are a helpful assistant. Your only job is to suggest a single, short, common to-do list item. Make it a simple action. Examples: 'Buy milk', 'Walk the dog', 'Pay electricity bill', 'Call mom'. Do not add any preamble or extra text. Just return the task text.";

// We initialize the AI client outside the handler, but since 'ai' relies on 
// an environment variable that might not be available at startup, we will 
// move the initialization *inside* the function to ensure it loads the key correctly.

/**
 * Main handler function for the Vercel serverless endpoint.
 * 2. Use export default instead of module.exports
 * @param {object} req - The incoming request object.
 * @param {object} res - The outgoing response object.
 */
export default async (req, res) => {
    // 1. Check for valid request method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Check for API key existence
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is not set.' });
    }
    
    // Initialize the AI client here to ensure GEMINI_API_KEY is loaded
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


    // 3. Extract tasks from the request body sent by the client
    let existingTasks = 'none';
    try {
        const body = req.body;
        if (body && body.existingTasks) {
            existingTasks = body.existingTasks;
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const userQuery = `My current tasks are: ${existingTasks}. Suggest one new, simple task.`;

    try {
        // 4. Call the Gemini API securely
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            config: {
                systemInstruction: systemPrompt
            }
        });

        const suggestedText = response.text.trim();

        // 5. Return the suggestion to the client
        res.status(200).json({ suggestion: suggestedText });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate content from Gemini API.',
            details: error.message 
        });
    }
};
