import { GoogleGenerativeAI } from "@google/generative-ai";
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const THEME = {
    bgStart: '#091428',
    bgEnd: '#0a323c',
    gold: '#C8AA6E',
    goldBright: '#F0E6D2',
    blueNeon: '#00d4ff',
    redNeon: '#ff4757',
    textMain: '#F0E6D2',
    cardBg: 'rgba(30, 35, 40, 0.7)'
};

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

    async generateAICommentary(context: string, data: string): Promise<string> {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `
                Eres el narrador oficial (Caster) del torneo de League of Legends "CocosCup".
                Tu tono es épico, profesional y emocionante.
                
                CONTEXTO: ${context}
                DATOS ACTUALES: ${data}
                
                Genera un comentario corto (máximo 3 frases) analizando la situación actual, destacando a los líderes o los enfrentamientos clave. Usa emojis de esports.
            `;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error("Gemini Error:", error);
            return "¡La Grieta del Invocador nos espera! 🔥";
        }
    }

    private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, THEME.bgStart);
        gradient.addColorStop(1, THEME.bgEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(200, 170, 110, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }
        for (let i = 0; i < height; i += 40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        }
    }

    private drawNeonBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, isWinner: boolean = false) {
        ctx.shadowBlur = isWinner ? 20 : 0;
        ctx.shadowColor = color;
        
        ctx.fillStyle = THEME.cardBg;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = isWinner ? 3 : 1;
        ctx.strokeRect(x, y, w, h);
        
        ctx.shadowBlur = 0;
    }

    async generateGroupsImage(groupData: GroupData): Promise<Buffer> {
        const width = 1200;
        const height = 800;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        this.drawBackground(ctx, width, height);

        ctx.fillStyle = THEME.gold;
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = THEME.gold;
        ctx.shadowBlur = 15;
        ctx.fillText('FASE DE GRUPOS - COCOSCUP', width / 2, 80);
        ctx.shadowBlur = 0;

        const startY = 150;
        const groupWidth = 500;

        this.drawGroupStyled(ctx, 'GRUPO A', groupData.A, 50, startY, groupWidth, THEME.blueNeon);
        this.drawGroupStyled(ctx, 'GRUPO B', groupData.B, width - 50 - groupWidth, startY, groupWidth, THEME.redNeon);

        return canvas.toBuffer('image/png');
    }

    private drawGroupStyled(ctx: CanvasRenderingContext2D, title: string, teams: any[], x: number, y: number, width: number, color: string) {
        ctx.fillStyle = color;
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, x + width / 2, y - 20);

        this.drawNeonBox(ctx, x, y, width, teams.length * 80 + 20, color);

        const sortedTeams = [...teams].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        sortedTeams.forEach((team, index) => {
            const teamY = y + 50 + (index * 80);
            
            if (index < 2) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
                ctx.fillRect(x + 5, teamY - 35, width - 10, 60);
            }

            ctx.fillStyle = index < 2 ? THEME.gold : '#888';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}`, x + 30, teamY);

            ctx.fillStyle = THEME.textMain;
            ctx.fillText(team.team, x + 80, teamY);

            ctx.fillStyle = index < 2 ? THEME.goldBright : '#aaa';
            ctx.textAlign = 'right';
            ctx.fillText(`${team.wins}W - ${team.losses}L`, x + width - 30, teamY);
            
            if (index < teams.length - 1) {
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.moveTo(x + 20, teamY + 25);
                ctx.lineTo(x + width - 20, teamY + 25);
                ctx.stroke();
            }
        });
    }

    async generatePlayoffsImage(playoffData: PlayoffData): Promise<Buffer> {
        const width = 1400;
        const height = 900;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        this.drawBackground(ctx, width, height);

        ctx.fillStyle = THEME.gold;
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.fillText('PLAYOFFS - COCOSCUP', width / 2, 80);
        ctx.shadowBlur = 0;

        const matchWidth = 320;
        const matchHeight = 120;
        
        const startX = 100;
        const midY = height / 2;

        this.drawMatchStyled(ctx, playoffData.semifinals[0], startX, 250, matchWidth, matchHeight, "SEMIFINAL 1");
        this.drawMatchStyled(ctx, playoffData.semifinals[1], startX, 650, matchWidth, matchHeight, "SEMIFINAL 2");

        ctx.strokeStyle = THEME.gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        ctx.moveTo(startX + matchWidth, 250 + matchHeight/2);
        ctx.lineTo(width/2 - 160, 250 + matchHeight/2);
        ctx.lineTo(width/2 - 160, midY);
        
        ctx.moveTo(startX + matchWidth, 650 + matchHeight/2);
        ctx.lineTo(width/2 - 160, 650 + matchHeight/2);
        ctx.lineTo(width/2 - 160, midY); 
        ctx.stroke();

        this.drawMatchStyled(ctx, playoffData.final, width/2 - matchWidth/2 + 200, midY - matchHeight/2, matchWidth, matchHeight, "GRAN FINAL", true);

        this.drawMatchStyled(ctx, playoffData.thirdPlace, width - 350, height - 150, 250, 80, "3er LUGAR");

        return canvas.toBuffer('image/png');
    }

    private drawMatchStyled(ctx: CanvasRenderingContext2D, match: any, x: number, y: number, w: number, h: number, label: string, isFinal: boolean = false) {
        const borderColor = isFinal ? THEME.gold : THEME.blueNeon;
        
        ctx.fillStyle = borderColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w/2, y - 10);

        this.drawNeonBox(ctx, x, y, w, h, borderColor, match.played);

        const textX = x + 20;
        const textY_A = y + h/2 - 15;
        const textY_B = y + h/2 + 25;

        const isWinnerA = match.winner === match.teamA;
        ctx.fillStyle = isWinnerA ? THEME.goldBright : '#fff';
        ctx.font = isWinnerA ? 'bold 24px sans-serif' : '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(match.teamA === 'TBD' ? '???' : match.teamA, textX, textY_A);
        if(isWinnerA) {
            ctx.fillStyle = '#0f0';
            ctx.fillText('👑', x + w - 30, textY_A);
        }

        const isWinnerB = match.winner === match.teamB;
        ctx.fillStyle = isWinnerB ? THEME.goldBright : '#fff';
        ctx.font = isWinnerB ? 'bold 24px sans-serif' : '20px sans-serif';
        ctx.fillText(match.teamB === 'TBD' ? '???' : match.teamB, textX, textY_B);
        if(isWinnerB) {
            ctx.fillStyle = '#0f0';
            ctx.fillText('👑', x + w - 30, textY_B);
        }

        ctx.fillStyle = '#555';
        ctx.font = '12px sans-serif';
        ctx.fillText('VS', x + w/2, y + h/2 + 5);
    }
}

export const imageGenerator = new ImageGenerator();