import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GroupData {
    A: { team: string; wins: number; losses: number }[];
    B: { team: string; wins: number; losses: number }[];
}

interface PlayoffData {
    semifinals: Array<{ teamA: string; teamB: string; winner: string | null; played: boolean }>;
    final: { teamA: string; teamB: string; winner: string | null; played: boolean };
    thirdPlace: { teamA: string; teamB: string; winner: string | null; played: boolean };
}

export class ImageGenerator {

    private async svgToPng(svg: string): Promise<Buffer> {
        try {
            return await sharp(Buffer.from(svg))
                .png()
                .toBuffer();
        } catch (error) {
            console.error(error);
            throw new Error("Fallo en renderizado de imagen");
        }
    }

    private cleanGeminiOutput(text: string): string {
        return text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    }

    async generateGroupsImage(data: GroupData): Promise<Buffer> {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
        Genera CÓDIGO SVG puro para una tabla de posiciones de torneo.
        Dimensiones: 1000x600.
        Tema: League of Legends Hextech (Fondo #091428, Textos #F0E6D2, Bordes #C8AA6E).
        Título centrado: "FASE DE GRUPOS - COCOSCUP".
        DATOS:
        Grupo A: ${JSON.stringify(data.A)}
        Grupo B: ${JSON.stringify(data.B)}
        REGLAS:
        1. Dos contenedores lado a lado.
        2. Resalta los 2 primeros de cada grupo.
        3. Fuente sans-serif.
        4. Retorna SOLO el código SVG sin markdown.
        `;

        try {
            const result = await model.generateContent(prompt);
            const svgCode = this.cleanGeminiOutput(result.response.text());
            return await this.svgToPng(svgCode);
        } catch (error) {
            console.error(error);
            return await this.svgToPng(`<svg width="800" height="200"><rect width="100%" height="100%" fill="black"/><text x="10" y="50" fill="white" font-size="30">Error generando imagen</text></svg>`);
        }
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
        Genera CÓDIGO SVG puro para un Bracket de Playoffs (Semifinales y Final).
        Dimensiones: 1200x800.
        Tema: Cyberpunk Dark (#0a0a12, #FF4757, #FFD700).
        ESTRUCTURA:
        - Izquierda: Dos cajas (Semifinales).
        - Centro/Derecha: Una caja (Final).
        - Abajo Derecha: Una caja (3er Lugar).
        DATOS:
        Semi 1: ${data.semifinals[0].teamA} vs ${data.semifinals[0].teamB} (Winner: ${data.semifinals[0].winner || '-'})
        Semi 2: ${data.semifinals[1].teamA} vs ${data.semifinals[1].teamB} (Winner: ${data.semifinals[1].winner || '-'})
        Final: ${data.final.teamA} vs ${data.final.teamB} (Winner: ${data.final.winner || '-'})
        3rd: ${data.thirdPlace.teamA} vs ${data.thirdPlace.teamB}
        REGLAS:
        1. Si hay ganador, pon un icono o marca.
        2. Retorna SOLO el código SVG sin markdown.
        `;

        try {
            const result = await model.generateContent(prompt);
            const svgCode = this.cleanGeminiOutput(result.response.text());
            return await this.svgToPng(svgCode);
        } catch (error) {
            console.error(error);
            return await this.svgToPng(`<svg width="800" height="200"><rect width="100%" height="100%" fill="black"/><text x="10" y="50" fill="white" font-size="30">Error generando imagen</text></svg>`);
        }
    }
}

export const imageGenerator = new ImageGenerator();