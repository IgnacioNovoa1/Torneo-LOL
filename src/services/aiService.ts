import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { tournamentData } from '../data/tournamentInfo';
import { Team } from '../models/Team';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function consultAdminAI(userQuestion: string) {
    const infoContext = JSON.stringify(tournamentData, null, 2);
    const teams = await Team.find({}, 'name captainName stats');
    const dbContext = teams.map (t => 
            `- Equipo: ${t.name} | Capitán: ${t.captainName} | Victorias: ${t.stats.wins}`
        ).join('\n');
    const prompt = `
    Eres el ASISTENTE ADMINISTRATIVO oficial del torneo de League of Legends llamado "${tournamentData.nombre}".
    
    TU BASE DE CONOCIMIENTO (ESTRICTA):
    ${infoContext}
    DATOS EN TIEMPO REAL DEL TORNEO (Extra+idos de la Base de Datos):
    ${dbContext}
    
    INSTRUCCIONES:
    1. Responde dudas sobre horarios, reglas, premios o equipos basándote ÚNICAMENTE en la información de arriba.
    2. Si te preguntan algo que no está en la lista (como "¿Quién ganará?"), di que no tienes esa información o que eres imparcial.
    3. Tu tono es profesional, servicial y directo.
    4. NO inventes fechas ni premios.
    5. Si preguntan por un datos o equipos inexistentes, indica que el equipo no existe.
    
    PREGUNTA DEL USUARIO: "${userQuestion}"
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Ha ocurrido un error inesperado.";
    }
}