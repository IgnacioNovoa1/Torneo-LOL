import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const STYLE = {
    font: 'sans-serif',
    colors: {
        bgGradientStart: '#051923',
        bgGradientEnd: '#003544',
        cardBg: 'rgba(6, 26, 33, 0.9)', 
        borderGold: '#C8AA6E',
        borderBlue: '#00C8C8',
        textGold: '#F0E6D2',
        textHighlight: '#FFD700',
        accentRed: '#FF4655'
    }
};

interface GroupData {
    A: { team: string; wins: number; losses: number }[];
    B: { team: string; wins: number; losses: number }[];
}

interface PlayoffData {
    semifinals: Array<{ teamA: string; teamB: string; winner: string | null; played: boolean }>;
    final: { teamA: string; teamB: string; winner: string | null; played: boolean };
}

export class ImageGenerator {

    private getLogoBase64(): string {
        try {
            const logoPath = path.join(__dirname, '../assets/logo.png');
            if (fs.existsSync(logoPath)) {
                const img = fs.readFileSync(logoPath);
                return `data:image/png;base64,${img.toString('base64')}`;
            }
        } catch (e) {
            console.error(e);
        }
        return '';
    }

    private async svgToPng(svg: string): Promise<Buffer> {
        return await sharp(Buffer.from(svg)).png().toBuffer();
    }

    async generateGroupsImage(data: GroupData): Promise<Buffer> {
        const width = 1200;
        const height = 650;
        const logoB64 = this.getLogoBase64();

        const renderRows = (teams: any[]) => {
            return teams.map((t, i) => {
                const y = 60 + (i * 55);
                const isTop = i < 2;
                const rowBg = i % 2 === 0 ? 'fill="#ffffff" fill-opacity="0.05"' : 'fill="none"';
                
                return `
                <g transform="translate(0, ${y})">
                    <rect x="0" y="0" width="450" height="50" ${rowBg} />
                    <rect x="0" y="0" width="40" height="50" fill="${isTop ? STYLE.colors.borderGold : '#333'}" />
                    <text x="20" y="33" fill="${isTop ? '#000' : '#888'}" font-size="24" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle">${i + 1}</text>
                    <text x="60" y="33" fill="${STYLE.colors.textGold}" font-size="22" font-weight="bold" font-family="${STYLE.font}">${t.team}</text>
                    <text x="430" y="33" fill="${isTop ? STYLE.colors.textHighlight : '#aaa'}" font-size="22" font-family="${STYLE.font}" text-anchor="end" font-weight="bold">${t.wins} - ${t.losses}</text>
                </g>
                `;
            }).join('');
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${STYLE.colors.bgGradientStart};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${STYLE.colors.bgGradientEnd};stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bgGrad)" />
            
            <image href="${logoB64}" x="${width/2 - 50}" y="20" height="100" width="100" />
            <text x="${width/2}" y="150" fill="${STYLE.colors.textHighlight}" font-size="40" font-family="${STYLE.font}" font-weight="bold" text-anchor="middle" letter-spacing="4">FASE DE GRUPOS</text>

            <g transform="translate(100, 200)">
                <path d="M 0 0 L 450 0 L 450 40 L 0 40 Z" fill="none" stroke="${STYLE.colors.borderBlue}" stroke-width="2" />
                <rect x="0" y="0" width="450" height="40" fill="${STYLE.colors.borderBlue}" fill-opacity="0.2" />
                <text x="225" y="28" fill="${STYLE.colors.borderBlue}" font-size="24" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle">GRUPO A</text>
                <rect x="0" y="50" width="450" height="250" fill="none" stroke="${STYLE.colors.borderBlue}" stroke-width="1" />
                ${renderRows(data.A)}
            </g>

            <g transform="translate(650, 200)">
                <path d="M 0 0 L 450 0 L 450 40 L 0 40 Z" fill="none" stroke="${STYLE.colors.borderGold}" stroke-width="2" />
                <rect x="0" y="0" width="450" height="40" fill="${STYLE.colors.borderGold}" fill-opacity="0.2" />
                <text x="225" y="28" fill="${STYLE.colors.borderGold}" font-size="24" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle">GRUPO B</text>
                <rect x="0" y="50" width="450" height="250" fill="none" stroke="${STYLE.colors.borderGold}" stroke-width="1" />
                ${renderRows(data.B)}
            </g>
        </svg>`;

        return await this.svgToPng(svg);
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const width = 1200;
        const height = 700;
        const logoB64 = this.getLogoBase64();

        const drawMatchBox = (x: number, y: number, w: number, teamA: string, teamB: string, winner: string | null, isFinal: boolean = false) => {
            const h = 90;
            const color = isFinal ? STYLE.colors.borderGold : STYLE.colors.borderBlue;
            const glow = isFinal ? 'filter="url(#glow)"' : '';
            
            const isWinA = winner && winner === teamA;
            const isWinB = winner && winner === teamB;

            return `
            <g transform="translate(${x}, ${y})">
                <rect x="0" y="0" width="${w}" height="${h}" fill="${STYLE.colors.cardBg}" stroke="${color}" stroke-width="2" ${glow} rx="4" />
                
                <rect x="2" y="2" width="${w-4}" height="${h/2 - 2}" fill="${isWinA ? 'rgba(255, 215, 0, 0.15)' : 'none'}" />
                <text x="15" y="30" fill="${isWinA ? STYLE.colors.textHighlight : '#fff'}" font-size="20" font-weight="${isWinA ? 'bold' : 'normal'}" font-family="${STYLE.font}">
                    ${teamA === 'TBD' ? '???' : teamA}
                </text>
                ${isWinA ? `<text x="${w-25}" y="30" font-size="18">👑</text>` : ''}
                
                <line x1="10" y1="${h/2}" x2="${w-10}" y2="${h/2}" stroke="#444" stroke-width="1" />

                <rect x="2" y="${h/2}" width="${w-4}" height="${h/2 - 2}" fill="${isWinB ? 'rgba(255, 215, 0, 0.15)' : 'none'}" />
                <text x="15" y="75" fill="${isWinB ? STYLE.colors.textHighlight : '#fff'}" font-size="20" font-weight="${isWinB ? 'bold' : 'normal'}" font-family="${STYLE.font}">
                    ${teamB === 'TBD' ? '???' : teamB}
                </text>
                ${isWinB ? `<text x="${w-25}" y="75" font-size="18">👑</text>` : ''}
            </g>
            `;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#020b14;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0a1e2b;stop-opacity:1" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bgGrad)" />

            <image href="${logoB64}" x="${width/2 - 60}" y="30" height="120" width="120" />
            
            <text x="250" y="200" fill="#888" font-size="18" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle" letter-spacing="2">SEMIFINALES</text>
            <text x="250" y="225" fill="${STYLE.colors.borderBlue}" font-size="14" font-family="${STYLE.font}" text-anchor="middle">MEJOR DE 1 (BO1)</text>

            <text x="900" y="280" fill="#888" font-size="24" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle" letter-spacing="2">GRAN FINAL</text>
            <text x="900" y="310" fill="${STYLE.colors.textHighlight}" font-size="16" font-family="${STYLE.font}" text-anchor="middle">MEJOR DE 3 (BO3)</text>

            <path d="M 420 305 L 500 305 L 500 450 L 730 450" stroke="#555" stroke-width="2" fill="none" />
            <path d="M 420 545 L 500 545 L 500 450" stroke="#555" stroke-width="2" fill="none" />

            ${drawMatchBox(80, 260, 340, data.semifinals[0].teamA, data.semifinals[0].teamB, data.semifinals[0].winner)}
            
            ${drawMatchBox(80, 500, 340, data.semifinals[1].teamA, data.semifinals[1].teamB, data.semifinals[1].winner)}

            ${drawMatchBox(730, 380, 380, data.final.teamA, data.final.teamB, data.final.winner, true)}

        </svg>`;

        return await this.svgToPng(svg);
    }
}

export const imageGenerator = new ImageGenerator();