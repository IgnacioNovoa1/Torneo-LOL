import { createCanvas, CanvasRenderingContext2D } from 'canvas';

const THEME = {
    bgStart: '#091428',
    bgEnd: '#0a323c',
    gold: '#C8AA6E',
    goldBright: '#F0E6D2',
    blueNeon: '#00d4ff',
    redNeon: '#ff4757',
    textMain: '#F0E6D2',
    cardBg: '#1e2328'
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

    private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.fillStyle = THEME.bgStart;
        ctx.fillRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, THEME.bgStart);
        gradient.addColorStop(1, THEME.bgEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(200, 170, 110, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < width; i += 50) {
            ctx.moveTo(i, 0); ctx.lineTo(i, height);
        }
        for (let i = 0; i < height; i += 50) {
            ctx.moveTo(0, i); ctx.lineTo(width, i);
        }
        ctx.stroke();
    }

    private drawNeonBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, isWinner: boolean = false) {
        ctx.fillStyle = THEME.cardBg;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = isWinner ? 4 : 2;
        ctx.strokeRect(x, y, w, h);
    }

    async generateGroupsImage(groupData: GroupData): Promise<Buffer> {
        const width = 1200;
        const height = 800;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        this.drawBackground(ctx, width, height);

        ctx.fillStyle = THEME.gold;
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FASE DE GRUPOS - COCOSCUP', width / 2, 80);

        const startY = 150;
        const groupWidth = 500;

        this.drawGroupStyled(ctx, 'GRUPO A', groupData.A, 50, startY, groupWidth, THEME.blueNeon);
        this.drawGroupStyled(ctx, 'GRUPO B', groupData.B, width - 50 - groupWidth, startY, groupWidth, THEME.redNeon);

        return canvas.toBuffer('image/png');
    }

    private drawGroupStyled(ctx: CanvasRenderingContext2D, title: string, teams: any[], x: number, y: number, width: number, color: string) {
        ctx.fillStyle = color;
        ctx.font = 'bold 40px Arial';
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
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, x + 30, teamY);

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
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PLAYOFFS - COCOSCUP', width / 2, 80);

        const matchWidth = 320;
        const matchHeight = 120;
        
        const startX = 100;
        const midY = height / 2;

        this.drawMatchStyled(ctx, playoffData.semifinals[0], startX, 250, matchWidth, matchHeight, "SEMIFINAL 1");
        this.drawMatchStyled(ctx, playoffData.semifinals[1], startX, 650, matchWidth, matchHeight, "SEMIFINAL 2");

        ctx.strokeStyle = THEME.gold;
        ctx.lineWidth = 3;
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
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w/2, y - 10);

        this.drawNeonBox(ctx, x, y, w, h, borderColor, match.played);

        const textX = x + 20;
        const textY_A = y + h/2 - 15;
        const textY_B = y + h/2 + 25;

        const isWinnerA = match.winner === match.teamA;
        ctx.fillStyle = isWinnerA ? THEME.goldBright : '#fff';
        ctx.font = isWinnerA ? 'bold 24px Arial' : '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(match.teamA === 'TBD' ? '???' : match.teamA, textX, textY_A);
        if(isWinnerA) {
            ctx.fillStyle = '#0f0';
            ctx.fillText('👑', x + w - 40, textY_A);
        }

        const isWinnerB = match.winner === match.teamB;
        ctx.fillStyle = isWinnerB ? THEME.goldBright : '#fff';
        ctx.font = isWinnerB ? 'bold 24px Arial' : '20px Arial';
        ctx.fillText(match.teamB === 'TBD' ? '???' : match.teamB, textX, textY_B);
        if(isWinnerB) {
            ctx.fillStyle = '#0f0';
            ctx.fillText('👑', x + w - 40, textY_B);
        }

        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VS', x + w/2, y + h/2 + 5);
    }
}

export const imageGenerator = new ImageGenerator();