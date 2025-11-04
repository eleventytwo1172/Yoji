/**
 * Vercel Serverless Function to securely call the Gemini API.
 * * This file should be placed in the /api directory of your Vercel project.
 * It uses the GEMINI_API_KEY environment variable defined in Vercel.
 */

const { GoogleGenAI } = require('@google/genai');

// Ensure the GoogleGenAI instance uses the secret key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System instruction to guide the model's behavior
const systemPrompt = "You are a helpful assistant. Your only job is to suggest a single, short, common to-do list item. Make it a simple action. Examples: 'Buy milk', 'Walk the dog', 'Pay electricity bill', 'Call mom'. Do not add any preamble or extra text. Just return the task text.";

/**
 * Main handler function for the Vercel serverless endpoint.
 * @param {object} req - The incoming request object.
 * @param {object} res - The outgoing response object.
 */
module.exports = async (req, res) => {
    // 1. Check for valid request method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Check for API key existence
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is not set.' });
    }

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
