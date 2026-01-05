import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { tournamentData } from '../data/tournamentInfo';
import { Team } from '../models/Team';
import { Tournament } from '../models/Tournament';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function consultAdminAI(userQuestion: string) {
    
    const teams = await Team.find({ active: true });
    const tournament = await Tournament.findOne({});
    const currentPhase = tournament?.status || 'No definido';

    const paidTeams = teams.filter(t => t.paid);
    const unpaidTeams = teams.filter(t => !t.paid);

    let liveContext = `
    === ESTADO EN TIEMPO REAL ===
    1. FASE ACTUAL DEL TORNEO: ${currentPhase.toUpperCase()}
    - Si es 'INSCRIPCIONES': Se aceptan nuevos equipos.
    - Si es 'GRUPOS' o 'PLAYOFFS': Las inscripciones están cerradas.

    2. ESTADÍSTICAS:
    - Total equipos registrados: ${teams.length}
    - Equipos CONFIRMADOS (Pagaron): ${paidTeams.length}
    - Equipos PENDIENTES de pago: ${unpaidTeams.length}
    - Costo de inscripción: $10.000 CLP.

    3. LISTA DE EQUIPOS:
    ${teams.map(t => `- ${t.name} (Capitán: ${t.captainName}) [Estado: ${t.paid ? '✅ CONFIRMADO' : '❌ PAGO PENDIENTE'}]`).join('\n')}
    `;

    const staticContext = JSON.stringify(tournamentData, null, 2);

    const prompt = `
    Eres el ASISTENTE ADMINISTRATIVO oficial del torneo de LoL "${tournamentData.nombre}".
    
    INFORMACIÓN OFICIAL (Reglas, Premios, Horarios):
    ${staticContext}

    INFORMACIÓN EN VIVO (Base de Datos):
    ${liveContext}

    INSTRUCCIONES:
    1. Responde basándote en la información de arriba.
    2. Si preguntan qué equipos están inscritos, menciona cuáles están confirmados (pagaron) y cuáles no.
    3. Si la fase actual es 'INSCRIPCIONES', anima a registrarse. Si es otra, indica que ya cerraron.
    4. El costo es de $10.000 pesos por equipo para confirmar inscripción.
    
    PREGUNTA DEL USUARIO: "${userQuestion}"
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error consultando la IA.";
    }
}