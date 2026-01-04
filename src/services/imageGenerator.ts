import sharp from 'sharp';

const STYLE = {
    bg: '#091428',
    cardBg: '#101624',
    gold: '#C8AA6E',
    blue: '#00D4FF',
    red: '#FF4757',
    text: '#F0E6D2',
    font: 'sans-serif'
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

    private async svgToPng(svg: string): Promise<Buffer> {
        return await sharp(Buffer.from(svg)).png().toBuffer();
    }

    async generateGroupsImage(data: GroupData): Promise<Buffer> {
        const width = 1000;
        const height = 600;

        const renderRows = (teams: any[], color: string) => {
            return teams.map((t, i) => {
                const y = 80 + (i * 60);
                const isTop = i < 2;
                const rowColor = isTop ? STYLE.gold : '#888';
                const bgHighlight = isTop ? `fill="${color}" fill-opacity="0.1"` : '';
                
                return `
                <g transform="translate(0, ${y})">
                    <rect x="0" y="-35" width="400" height="50" ${bgHighlight} rx="5" />
                    <text x="20" y="0" fill="${rowColor}" font-size="28" font-weight="bold" font-family="${STYLE.font}">${i + 1}.</text>
                    <text x="60" y="0" fill="${STYLE.text}" font-size="26" font-family="${STYLE.font}" font-weight="bold">${t.team}</text>
                    <text x="380" y="0" fill="${isTop ? STYLE.text : '#666'}" font-size="26" font-family="${STYLE.font}" text-anchor="end">${t.wins}W - ${t.losses}L</text>
                    <line x1="20" y1="20" x2="380" y2="20" stroke="#333" stroke-width="1" />
                </g>
                `;
            }).join('');
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${STYLE.bg}" />
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${STYLE.gold}" stroke-width="0.5" stroke-opacity="0.1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <text x="${width/2}" y="60" fill="${STYLE.gold}" font-size="40" font-family="${STYLE.font}" font-weight="bold" text-anchor="middle" style="text-shadow: 0 0 10px ${STYLE.gold}">FASE DE GRUPOS - COCOSCUP</text>

            <g transform="translate(50, 150)">
                <text x="200" y="-20" fill="${STYLE.blue}" font-size="30" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle">GRUPO A</text>
                <rect x="0" y="0" width="400" height="400" fill="${STYLE.cardBg}" stroke="${STYLE.blue}" stroke-width="2" rx="10" />
                <g transform="translate(0, 20)">
                    ${renderRows(data.A, STYLE.blue)}
                </g>
            </g>

            <g transform="translate(550, 150)">
                <text x="200" y="-20" fill="${STYLE.red}" font-size="30" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle">GRUPO B</text>
                <rect x="0" y="0" width="400" height="400" fill="${STYLE.cardBg}" stroke="${STYLE.red}" stroke-width="2" rx="10" />
                <g transform="translate(0, 20)">
                    ${renderRows(data.B, STYLE.red)}
                </g>
            </g>
        </svg>`;

        return await this.svgToPng(svg);
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const width = 1200;
        const height = 800;

        const drawMatch = (x: number, y: number, w: number, teamA: string, teamB: string, winner: string | null, label: string, color: string) => {
            const isWinA = winner === teamA;
            const isWinB = winner === teamB;
            
            return `
            <g transform="translate(${x}, ${y})">
                <rect x="${w/2 - 60}" y="-15" width="120" height="30" fill="${STYLE.bg}" />
                <text x="${w/2}" y="5" fill="${color}" font-size="16" font-weight="bold" font-family="${STYLE.font}" text-anchor="middle">${label}</text>
                
                <rect x="0" y="10" width="${w}" height="100" fill="${STYLE.cardBg}" stroke="${color}" stroke-width="2" rx="5" />
                
                <text x="20" y="50" fill="${isWinA ? STYLE.gold : '#fff'}" font-size="22" font-family="${STYLE.font}" font-weight="${isWinA ? 'bold' : 'normal'}">
                    ${teamA === 'TBD' ? '???' : teamA} ${isWinA ? '👑' : ''}
                </text>
                
                <text x="${w/2}" y="65" fill="#555" font-size="12" font-family="${STYLE.font}" text-anchor="middle">VS</text>
                
                <text x="20" y="85" fill="${isWinB ? STYLE.gold : '#fff'}" font-size="22" font-family="${STYLE.font}" font-weight="${isWinB ? 'bold' : 'normal'}">
                    ${teamB === 'TBD' ? '???' : teamB} ${isWinB ? '👑' : ''}
                </text>
            </g>
            `;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${STYLE.bg}" />
            <text x="${width/2}" y="60" fill="${STYLE.gold}" font-size="45" font-family="${STYLE.font}" font-weight="bold" text-anchor="middle">PLAYOFFS BRACKET</text>

            <path d="M 420 260 L 600 260 L 600 400" stroke="${STYLE.gold}" stroke-width="2" fill="none" />
            <path d="M 420 560 L 600 560 L 600 400" stroke="${STYLE.gold}" stroke-width="2" fill="none" />
            <line x1="600" y1="400" x2="780" y2="400" stroke="${STYLE.gold}" stroke-width="2" />

            ${drawMatch(100, 200, 320, data.semifinals[0].teamA, data.semifinals[0].teamB, data.semifinals[0].winner, "SEMIFINAL 1", STYLE.blue)}

            ${drawMatch(100, 500, 320, data.semifinals[1].teamA, data.semifinals[1].teamB, data.semifinals[1].winner, "SEMIFINAL 2", STYLE.blue)}

            ${drawMatch(780, 350, 350, data.final.teamA, data.final.teamB, data.final.winner, "GRAN FINAL", STYLE.gold)}

            ${drawMatch(800, 650, 300, data.thirdPlace.teamA, data.thirdPlace.teamB, data.thirdPlace.winner, "3er LUGAR", '#cd7f32')}
        </svg>`;

        return await this.svgToPng(svg);
    }
}

export const imageGenerator = new ImageGenerator();