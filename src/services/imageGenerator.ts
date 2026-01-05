import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface GroupData {
    A: { team: string; wins: number; losses: number }[];
    B: { team: string; wins: number; losses: number }[];
}

interface PlayoffData {
    semifinals: Array<{ teamA: string; teamB: string; winner: string | null; played: boolean }>;
    final: { teamA: string; teamB: string; winner: string | null; played: boolean };
    thirdPlace?: { teamA: string; teamB: string; winner: string | null; played: boolean };
}

const COLORS = {
    primary: '#FFD700',
    cyan: '#00D9FF',
    darkBg: '#0a0e1a',
    darkBg2: '#1a0b2e',
    textWhite: '#FFFFFF',
    textGray: '#CCCCCC',
    success: '#00FF88',
    border: '#1E3A5F'
};

export class ImageGenerator {

    private getLogoPath(): string | null {
        const paths = [
            path.join(__dirname, '../../assets/logo.png'),
            path.join(__dirname, '../assets/logo.png'),
            path.join(process.cwd(), 'src/assets/logo.png'),
            path.join(process.cwd(), 'dist/assets/logo.png')
        ];

        for (const p of paths) {
            if (fs.existsSync(p)) return p;
        }
        return null;
    }

    private async svgToPng(svg: string): Promise<Buffer> {
        return sharp(Buffer.from(svg)).png().toBuffer();
    }

    async generateGroupsImage(data: GroupData): Promise<Buffer> {
        const width = 1920;
        const height = 1080;
        const logoPath = this.getLogoPath();

        const sortedA = [...data.A].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
        const sortedB = [...data.B].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        const renderGroup = (teams: any[], groupName: string, x: number, color: string) => {
            const w = 550;
            const headerH = 75;
            const rowH = 65;
            const totalH = headerH + teams.length * rowH + 15;

            return `
            <g transform="translate(${x}, 400)">
                <defs>
                    <linearGradient id="grad${groupName}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.2"/>
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05"/>
                    </linearGradient>
                </defs>

                <rect width="${w}" height="${totalH}" fill="url(#grad${groupName})"
                    stroke="${color}" stroke-width="3" rx="10"/>

                <rect width="${w}" height="${headerH}" fill="${color}" rx="10"/>

                <text x="${w / 2}" y="48" fill="#000" font-size="38" font-weight="900"
                    font-family="Arial" text-anchor="middle" letter-spacing="5">
                    GROUP ${groupName}
                </text>

                ${teams.map((t, i) => {
                    const y = headerH + 50 + i * rowH;
                    const qualified = i < 2;
                    let name = t.team.toUpperCase();
                    if (name.length > 18) name = name.substring(0, 16) + '..';

                    return `
                    <g>
                        <rect x="6" y="${y - 16}" width="${w - 12}" height="${rowH - 12}"
                            fill="#fff" fill-opacity="${i % 2 === 0 ? '0.06' : '0.02'}" rx="5"/>

                        ${qualified ? `<rect x="11" y="${y - 11}" width="5" height="${rowH - 22}"
                            fill="${COLORS.success}" rx="2"/>` : ''}

                        <text x="${qualified ? '48' : '28'}" y="${y + 11}"
                            fill="${qualified ? COLORS.success : '#888'}"
                            font-size="26" font-weight="bold" font-family="Arial">${i + 1}</text>

                        <text x="${qualified ? '85' : '65'}" y="${y + 11}"
                            fill="${qualified ? COLORS.textWhite : COLORS.textGray}"
                            font-size="22" font-weight="${qualified ? 'bold' : '600'}"
                            font-family="Arial">${name}</text>

                        <text x="${w - 35}" y="${y + 11}" fill="${qualified ? color : '#999'}"
                            font-size="26" font-weight="bold" font-family="monospace"
                            text-anchor="end">${t.wins} - ${t.losses}</text>
                    </g>`;
                }).join('')}
            </g>`;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${COLORS.darkBg2}"/>
                    <stop offset="100%" style="stop-color:${COLORS.darkBg}"/>
                </linearGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#bg)"/>

            <text x="${width / 2}" y="220" fill="${COLORS.textWhite}" font-size="64"
                font-weight="900" font-family="Arial" text-anchor="middle"
                letter-spacing="7">FASE DE GRUPOS</text>

            <text x="${width / 2}" y="275" fill="${COLORS.cyan}" font-size="24"
                font-weight="600" font-family="Arial" text-anchor="middle"
                letter-spacing="2">COCOSCUP 2026 • CLASIFICACIÓN OFICIAL</text>

            ${renderGroup(sortedA, 'A', 220, COLORS.cyan)}
            ${renderGroup(sortedB, 'B', 1150, COLORS.primary)}
        </svg>`;

        const baseImage = await this.svgToPng(svg);

        if (!logoPath) return baseImage;

        const logo = await sharp(logoPath)
            .resize(130, 130, { fit: 'contain' })
            .png()
            .toBuffer();

        return sharp(baseImage)
            .composite([{ input: logo, top: 80, left: width / 2 - 65 }])
            .png()
            .toBuffer();
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const width = 1920;
        const height = 1080;
        const logoPath = this.getLogoPath();

        const drawMatch = (x: number, y: number, a: string, b: string, w: string | null, label: string, isFinal = false) => {
            const widthBox = isFinal ? 480 : 380;
            const color = isFinal ? COLORS.primary : COLORS.cyan;

            return `
            <g transform="translate(${x}, ${y})">
                <rect width="${widthBox}" height="160" rx="12"
                    fill="rgba(255,255,255,0.03)" stroke="${color}" stroke-width="${isFinal ? 5 : 3}"/>

                <rect width="${widthBox}" height="38" rx="12" fill="${color}"/>
                <text x="${widthBox / 2}" y="26" fill="#000" font-size="18"
                    font-weight="bold" font-family="Arial" text-anchor="middle">${label}</text>

                <text x="24" y="78" fill="${w === a ? COLORS.textWhite : COLORS.textGray}"
                    font-size="24" font-weight="bold">${a.toUpperCase()}</text>

                <text x="24" y="138" fill="${w === b ? COLORS.textWhite : COLORS.textGray}"
                    font-size="24" font-weight="bold">${b.toUpperCase()}</text>
            </g>`;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${COLORS.darkBg}"/>

            <text x="${width / 2}" y="110" fill="${COLORS.primary}" font-size="60"
                font-weight="900" font-family="Arial" text-anchor="middle"
                letter-spacing="7">PLAYOFFS COCOSCUP</text>

            <text x="${width / 2}" y="155" fill="${COLORS.cyan}" font-size="22"
                font-weight="600" font-family="Arial" text-anchor="middle"
                letter-spacing="2">SEMIFINALES BO1 • GRAN FINAL BO3</text>

            ${drawMatch(80, 300, data.semifinals[0].teamA, data.semifinals[0].teamB, data.semifinals[0].winner, 'SEMIFINAL 1')}
            ${drawMatch(80, 560, data.semifinals[1].teamA, data.semifinals[1].teamB, data.semifinals[1].winner, 'SEMIFINAL 2')}
            ${drawMatch(1020, 430, data.final.teamA, data.final.teamB, data.final.winner, 'GRAN FINAL', true)}
        </svg>`;

        const baseImage = await this.svgToPng(svg);

        if (!logoPath) return baseImage;

        const logo = await sharp(logoPath)
            .resize(110, 110, { fit: 'contain' })
            .png()
            .toBuffer();

        return sharp(baseImage)
            .composite([{ input: logo, top: 55, left: width / 2 - 380 }])
            .png()
            .toBuffer();
    }
}

export const imageGenerator = new ImageGenerator();
