import { GoogleGenerativeAI } from "@google/generative-ai";


const genai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI as string);
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" }})

const extractFromInput = async (input: string, history: string[], lastExtraction: string) => {

    const prompt = `You are a helpful, friendly chatbot that takes input then extract the natural language input of the user in order to provide an insurance plan lookup based on the user prefereces. You want to ask the user to ensure that all the required fields are answered, and obviously let the user know if you have all the requirements. The user's just said: ${input}. 
    Your last extraction result was: ${lastExtraction}, and the chat history is ${history}. Output the extracted base on this JSON schema:
        Information = {
            age: number, required,
            gender: boolean, required (true for male or false for female)
            weight: number, required (convert to kilograms)
            height: number, required (convert to meters)
            dependents: number, required
            income: number, required
            smoker: boolean, required
            married: boolean, optional
        }

        You do not need to ask for the optional fields when the required fields are filled, but you should prompt the user to confirm if they want to proceed without the optional fields.

        Return: Response = {
            extracted: Information,
            response: string (your response to the user, be helpful and friendly, stay aware of what they're saying),
            valid: boolean (when all the required fields are answered, it is true)
        }

    `;

    const res = await model.generateContent(prompt);

    console.log((res.response.text()));

    return JSON.parse(res.response.text());
}

export { extractFromInput }