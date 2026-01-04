import { GoogleGenerativeAI } from "@google/generative-ai";
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import fetch from 'node-fetch';

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
    
    async generateGroupsImage(groupData: GroupData): Promise<Buffer> {
        try {
            console.log('Generando imagen de grupos con Canvas...');

            const width = 1200;
            const height = 800;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0f1419');
            gradient.addColorStop(1, '#1a1f2e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('FASE DE GRUPOS', width / 2, 80);

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 200, 100);
            ctx.lineTo(width / 2 + 200, 100);
            ctx.stroke();

            const startY = 150;
            const groupWidth = 500;

            this.drawGroup(ctx, 'GRUPO A', groupData.A, 50, startY, groupWidth, '#00d4ff');
            this.drawGroup(ctx, 'GRUPO B', groupData.B, width - 50 - groupWidth, startY, groupWidth, '#ff4757');

            ctx.fillStyle = '#888888';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Los 2 mejores equipos de cada grupo clasifican a semifinales', width / 2, height - 30);

            return canvas.toBuffer('image/png');

        } catch (error) {
            console.error('Error generando imagen de grupos:', error);
            throw error;
        }
    }

    private drawGroup(
        ctx: CanvasRenderingContext2D, 
        title: string, 
        teams: Array<{ team: string; wins: number; losses: number }>, 
        x: number, 
        y: number, 
        width: number, 
        color: string
    ) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, 60);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, x + width / 2, y + 42);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, y + 60, width, teams.length * 70 + 20);

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, teams.length * 70 + 80);

        const sortedTeams = [...teams].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        sortedTeams.forEach((team, index) => {
            const teamY = y + 90 + (index * 70);

            ctx.fillStyle = index < 2 ? '#00ff00' : '#666666';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, x + 20, teamY);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(team.team, x + 60, teamY);

            ctx.fillStyle = color;
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${team.wins}V - ${team.losses}D`, x + width - 20, teamY);
        });
    }

    async generatePlayoffsImage(playoffData: PlayoffData): Promise<Buffer> {
        try {
            console.log('🏆 Generando imagen de playoffs con Canvas...');

            const width = 1400;
            const height = 1000;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0f1419');
            gradient.addColorStop(1, '#1a1f2e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 70px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 LLAVE DE ELIMINATORIAS', width / 2, 80);

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 250, 100);
            ctx.lineTo(width / 2 + 250, 100);
            ctx.stroke();

            const matchWidth = 350;
            const matchHeight = 100;
            const spacing = 150;

            this.drawMatch(
                ctx,
                playoffData.semifinals[0],
                150,
                250,
                matchWidth,
                matchHeight,
                'SEMIFINAL 1',
                '#ff6b6b'
            );

            this.drawMatch(
                ctx,
                playoffData.semifinals[1],
                150,
                250 + matchHeight + spacing,
                matchWidth,
                matchHeight,
                'SEMIFINAL 2',
                '#ff6b6b'
            );

            this.drawMatch(
                ctx,
                playoffData.thirdPlace,
                width - 150 - matchWidth,
                250,
                matchWidth,
                matchHeight,
                '🥉 TERCER LUGAR',
                '#cd7f32'
            );

            this.drawMatch(
                ctx,
                playoffData.final,
                width - 150 - matchWidth,
                250 + matchHeight + spacing,
                matchWidth,
                matchHeight,
                '🏅 GRAN FINAL',
                '#ffd700'
            );

            this.drawConnectors(ctx, matchWidth, matchHeight, spacing, width);

            return canvas.toBuffer('image/png');

        } catch (error) {
            console.error('Error generando imagen de playoffs:', error);
            throw error;
        }
    }

    private drawMatch(
        ctx: CanvasRenderingContext2D,
        match: { teamA: string; teamB: string; winner: string | null; played: boolean },
        x: number,
        y: number,
        width: number,
        height: number,
        label: string,
        color: string
    ) {
        ctx.fillStyle = color;
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + width / 2, y - 15);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = match.played ? '#00ff00' : color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        const isWinnerA = match.winner === match.teamA;
        ctx.fillStyle = isWinnerA ? '#00ff00' : '#ffffff';
        ctx.font = isWinnerA ? 'bold 22px sans-serif' : '20px sans-serif';
        ctx.textAlign = 'left';
        const teamAText = match.teamA === 'TBD' ? '???' : match.teamA;
        ctx.fillText(teamAText, x + 20, y + 35);

        ctx.fillStyle = '#888888';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VS', x + width / 2, y + height / 2 + 5);

        const isWinnerB = match.winner === match.teamB;
        ctx.fillStyle = isWinnerB ? '#00ff00' : '#ffffff';
        ctx.font = isWinnerB ? 'bold 22px sans-serif' : '20px sans-serif';
        ctx.textAlign = 'left';
        const teamBText = match.teamB === 'TBD' ? '???' : match.teamB;
        ctx.fillText(teamBText, x + 20, y + 75);

        if (match.played && match.winner) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('✓', x + width - 20, y + height / 2 + 10);
        }
    }

    private drawConnectors(
        ctx: CanvasRenderingContext2D, 
        matchWidth: number, 
        matchHeight: number, 
        spacing: number,
        canvasWidth: number
    ) {
        const leftX = 150 + matchWidth;
        const rightX = canvasWidth - 150 - matchWidth;
        const midX = (leftX + rightX) / 2;

        const sf1Y = 250 + matchHeight / 2;
        const sf2Y = 250 + matchHeight + spacing + matchHeight / 2;
        const thirdY = 250 + matchHeight / 2;
        const finalY = 250 + matchHeight + spacing + matchHeight / 2;

        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);

        ctx.beginPath();
        ctx.moveTo(leftX, sf1Y);
        ctx.lineTo(midX, sf1Y);
        ctx.lineTo(midX, sf2Y);
        ctx.lineTo(leftX, sf2Y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(midX, thirdY);
        ctx.lineTo(rightX, thirdY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(midX, finalY);
        ctx.lineTo(rightX, finalY);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    async generateArtisticBanner(tournamentName: string, teams: string[]): Promise<string | null> {
        try {
            console.log('Generando banner artístico con Gemini...');

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Crea una descripción visual detallada para un banner profesional de esports de League of Legends para el torneo "${tournamentName}".

El banner debe incluir:
- Estilo visual: futurista, cyberpunk, oscuro con neones azules y rojos
- Elementos: summoner's rift estilizado, nexus, cristales brillantes
- Ambiente: competitivo, épico, profesional
- Colores: principalmente negro, azul neón (#00d4ff), rojo neón (#ff4757), dorado (#ffd700)
- Texto central: "${tournamentName}"
- Equipos participantes: ${teams.join(', ')}

NO incluyas texto en la imagen, solo diseño visual puro.

Responde solo con la descripción del diseño.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const description = response.text();

            console.log('✅ Descripción generada:', description);

            // Nota: Gemini 2.0 actualmente no genera imágenes directamente
            // Solo genera descripciones. Para generar imágenes necesitarías:
            // 1. Usar Imagen 3 (requiere Vertex AI en GCP)
            // 2. O usar la descripción con otro servicio como DALL-E, Midjourney, etc.

            return description;

        } catch (error) {
            console.error('Error generando banner con Gemini:', error);
            return null;
        }
    }
}

export const imageGenerator = new ImageGenerator();