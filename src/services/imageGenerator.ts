import Replicate from 'replicate';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
});

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
    
    // Generar imagen de grupos con Canvas (más rápido y confiable)
    async generateGroupsImage(groupData: GroupData): Promise<Buffer> {
        const width = 1200;
        const height = 800;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Fondo degradado
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f1419');
        gradient.addColorStop(1, '#1a1f2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Título
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FASE DE GRUPOS', width / 2, 80);

        // Línea decorativa
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 200, 100);
        ctx.lineTo(width / 2 + 200, 100);
        ctx.stroke();

        // Dibujar grupos
        const startY = 150;
        const groupWidth = 500;
        const groupSpacing = 100;

        // Grupo A
        this.drawGroup(ctx, 'GRUPO A', groupData.A, 50, startY, groupWidth, '#00d4ff');

        // Grupo B
        this.drawGroup(ctx, 'GRUPO B', groupData.B, width - 50 - groupWidth, startY, groupWidth, '#ff4757');

        // Footer
        ctx.fillStyle = '#888888';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Los 2 mejores equipos de cada grupo clasifican a semifinales', width / 2, height - 30);

        return canvas.toBuffer('image/png');
    }

    private drawGroup(
        ctx: any, 
        title: string, 
        teams: Array<{ team: string; wins: number; losses: number }>, 
        x: number, 
        y: number, 
        width: number, 
        color: string
    ) {
        // Header del grupo
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, 60);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, x + width / 2, y + 42);

        // Fondo de la tabla
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, y + 60, width, teams.length * 70 + 20);

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, teams.length * 70 + 80);

        // Ordenar por victorias
        const sortedTeams = [...teams].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        // Dibujar equipos
        sortedTeams.forEach((team, index) => {
            const teamY = y + 90 + (index * 70);

            // Posición
            ctx.fillStyle = index < 2 ? '#00ff00' : '#666666';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, x + 20, teamY);

            // Nombre del equipo
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(team.team, x + 60, teamY);

            // Record
            ctx.fillStyle = color;
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${team.wins}V - ${team.losses}D`, x + width - 20, teamY);
        });
    }

    // Generar imagen de playoffs
    async generatePlayoffsImage(playoffData: PlayoffData): Promise<Buffer> {
        const width = 1400;
        const height = 1000;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Fondo
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f1419');
        gradient.addColorStop(1, '#1a1f2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Título
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 70px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 LLAVE DE ELIMINATORIAS', width / 2, 80);

        // Línea decorativa
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 250, 100);
        ctx.lineTo(width / 2 + 250, 100);
        ctx.stroke();

        const matchWidth = 350;
        const matchHeight = 100;
        const spacing = 150;

        // Semifinal 1
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

        // Semifinal 2
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

        // Tercer lugar
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

        // Final
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

        // Conectores
        this.drawConnectors(ctx, matchWidth, matchHeight, spacing);

        return canvas.toBuffer('image/png');
    }

    private drawMatch(
        ctx: any,
        match: { teamA: string; teamB: string; winner: string | null; played: boolean },
        x: number,
        y: number,
        width: number,
        height: number,
        label: string,
        color: string
    ) {
        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + width / 2, y - 15);

        // Match box background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, y, width, height);

        // Border
        ctx.strokeStyle = match.played ? '#00ff00' : color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Team A
        const isWinnerA = match.winner === match.teamA;
        ctx.fillStyle = isWinnerA ? '#00ff00' : '#ffffff';
        ctx.font = isWinnerA ? 'bold 22px Arial' : '20px Arial';
        ctx.textAlign = 'left';
        const teamAText = match.teamA === 'TBD' ? '???' : match.teamA;
        ctx.fillText(teamAText, x + 20, y + 35);

        // VS
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VS', x + width / 2, y + height / 2 + 5);

        // Team B
        const isWinnerB = match.winner === match.teamB;
        ctx.fillStyle = isWinnerB ? '#00ff00' : '#ffffff';
        ctx.font = isWinnerB ? 'bold 22px Arial' : '20px Arial';
        ctx.textAlign = 'left';
        const teamBText = match.teamB === 'TBD' ? '???' : match.teamB;
        ctx.fillText(teamBText, x + 20, y + 75);

        // Winner indicator
        if (match.played && match.winner) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('✓', x + width - 20, y + height / 2 + 10);
        }
    }

    private drawConnectors(ctx: any, matchWidth: number, matchHeight: number, spacing: number) {
        const leftX = 150 + matchWidth;
        const rightX = 1400 - 150 - matchWidth;
        const midX = (leftX + rightX) / 2;

        const sf1Y = 250 + matchHeight / 2;
        const sf2Y = 250 + matchHeight + spacing + matchHeight / 2;
        const thirdY = 250 + matchHeight / 2;
        const finalY = 250 + matchHeight + spacing + matchHeight / 2;

        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);

        // Semifinales a centro
        ctx.beginPath();
        ctx.moveTo(leftX, sf1Y);
        ctx.lineTo(midX, sf1Y);
        ctx.lineTo(midX, sf2Y);
        ctx.lineTo(leftX, sf2Y);
        ctx.stroke();

        // Centro a finales
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

    // Alternativa: Generar con Flux AI (más artístico)
    async generateGroupsImageWithAI(groupData: GroupData): Promise<string> {
        const prompt = `Professional esports tournament bracket image, modern design, dark theme with neon accents. 
        Two groups labeled "GRUPO A" and "GRUPO B". 
        Teams displayed in ranked order with win/loss records.
        Clean typography, League of Legends style, tournament quality graphics.
        NO text in image, pure visual design.`;

        try {
            const output = await replicate.run(
                "black-forest-labs/flux-schnell",
                {
                    input: {
                        prompt: prompt,
                        num_outputs: 1,
                        aspect_ratio: "16:9",
                        output_format: "png",
                        output_quality: 90
                    }
                }
            ) as string[];

            return output[0];
        } catch (error) {
            console.error('Error generando imagen con IA:', error);
            throw error;
        }
    }
}

export const imageGenerator = new ImageGenerator();