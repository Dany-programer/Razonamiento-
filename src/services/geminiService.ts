import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const geminiService = {
  async generateExercise(level: 'easy' | 'medium' | 'hard') {
    const prompt = `Actúa como un profesor de lógica. Genera un ejercicio interactivo de lógica proposicional para un estudiante de nivel ${level}. 
    El ejercicio debe ser de uno de estos tipos de forma aleatoria: 
    1. 'circuit': Construir un circuito lógico para una proposición.
    2. 'table': Completar una tabla de verdad para una proposición.
    3. 'simplify': Simplificar una expresión lógica (el usuario escribirá la respuesta).
    4. 'quiz': Pregunta teórica o práctica de opción múltiple.

    IMPORTANTE: Usa simbología formal (¬, ∧, ∨, →, ↔).
    
    Devuelve la respuesta en formato JSON con la siguiente estructura:
    {
      "type": "circuit" | "table" | "simplify" | "quiz",
      "question": "Pregunta del ejercicio",
      "targetExpression": "La expresión objetivo (para circuit, table o simplify)",
      "variables": ["A", "B"], // Necesario para table o circuit
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"], // Solo para quiz
      "correctAnswer": "La respuesta exacta (para simplify o el texto exacto de la opción para quiz)",
      "hint": "Una pista útil",
      "explanation": "Explicación detallada de la solución"
    }`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Error generating exercise:", error);
      return null;
    }
  },

  async explainLogic(concept: string) {
    const prompt = `Explica el concepto de lógica: "${concept}" de manera sencilla y educativa para un estudiante. Sé conciso pero claro.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error("Error explaining logic:", error);
      return "Lo siento, no pude obtener una explicación en este momento.";
    }
  },

  async simplifyExpression(expression: string) {
    const prompt = `Simplifica la siguiente expresión lógica paso a paso usando leyes de equivalencia (De Morgan, Distribución, Conmutativa, etc.):
    Expresión: ${expression}
    
    Responde en formato JSON con la siguiente estructura:
    {
      "steps": [
        { "step": 1, "description": "Aplicando la ley...", "expression": "..." }
      ],
      "finalResult": "..."
    }
    
    Usa solo símbolos ¬, ∧, ∨, →, ↔.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Error simplifying expression:", error);
      return null;
    }
  },
};
