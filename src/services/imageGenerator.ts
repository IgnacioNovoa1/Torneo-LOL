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
    magenta: '#FF1493',
    darkBg: '#0a0e1a',
    darkBg2: '#1a0b2e',
    cardBg: 'rgba(10, 14, 26, 0.85)',
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
            if (fs.existsSync(p)) {
                console.log('✅ Logo encontrado:', p);
                return p;
            }
        }
        console.warn('⚠️ Logo no encontrado en ninguna ruta');
        return null;
    }

    private async svgToPng(svg: string): Promise<Buffer> {
        return await sharp(Buffer.from(svg)).png().toBuffer();
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
            const totalH = headerH + (teams.length * rowH) + 15;

            return `
            <g transform="translate(${x}, 400)">
                <defs>
                    <linearGradient id="grad${groupName}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.2"/>
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05"/>
                    </linearGradient>
                </defs>
                
                <rect x="0" y="0" width="${w}" height="${totalH}" 
                    fill="url(#grad${groupName})" stroke="${color}" stroke-width="3" rx="10"/>
                
                <rect x="0" y="0" width="${w}" height="${headerH}" fill="${color}" rx="10"/>
                
                <text x="${w / 2}" y="48" fill="#000" font-size="38" font-weight="900" 
                    font-family="Arial" text-anchor="middle" letter-spacing="5">
                    GROUP ${groupName}
                </text>
                
                <text x="60" y="${headerH + 32}" fill="${color}" font-size="16" 
                    font-weight="bold" font-family="Arial">EQUIPO</text>
                <text x="${w - 35}" y="${headerH + 32}" fill="${color}" font-size="16" 
                    font-weight="bold" font-family="Arial" text-anchor="end">W - L</text>
                
                ${teams.map((t, i) => {
                const y = headerH + 50 + (i * rowH);
                const qualified = i < 2;
                const maxLen = 18;
                let name = t.team.toUpperCase();
                if (name.length > maxLen) {
                    name = name.substring(0, maxLen - 2) + '..';
                }

                return `
                    <g>
                        <rect x="6" y="${y - 16}" width="${w - 12}" height="${rowH - 12}" 
                            fill="#fff" fill-opacity="${i % 2 === 0 ? '0.06' : '0.02'}" rx="5"/>
                        
                        ${qualified ? `
                        <rect x="11" y="${y - 11}" width="5" height="${rowH - 22}" fill="${COLORS.success}" rx="2"/>
                        <circle cx="28" cy="${y + 6}" r="4" fill="${COLORS.success}"/>
                        ` : ''}
                        
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
                    <stop offset="0%" style="stop-color:${COLORS.darkBg}"/>
                    <stop offset="50%" style="stop-color:#0f2847"/>
                    <stop offset="100%" style="stop-color:${COLORS.darkBg2}"/>
                </linearGradient>
                <pattern id="hex" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                    <path d="M40 0 L80 20 80 60 40 80 0 60 0 20 Z" fill="none" 
                        stroke="${COLORS.border}" stroke-width="0.5" opacity="0.25"/>
                </pattern>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bg)"/>
            <rect width="100%" height="100%" fill="url(#hex)"/>
            
            <circle cx="${width / 2}" cy="110" r="80" fill="${COLORS.darkBg}" opacity="0.9"/>
            <circle cx="${width / 2}" cy="110" r="80" fill="none" stroke="${COLORS.primary}" stroke-width="4"/>
            
            <text x="${width / 2}" y="260" fill="${COLORS.textWhite}" font-size="64" 
                font-weight="900" font-family="Arial" text-anchor="middle" 
                letter-spacing="7">FASE DE GRUPOS</text>
            
            <text x="${width / 2}" y="315" fill="${COLORS.cyan}" font-size="24" 
                font-weight="600" font-family="Arial" text-anchor="middle" 
                letter-spacing="2">COCOSCUP 2026 • CLASIFICACIÓN OFICIAL</text>
            
            ${renderGroup(sortedA, 'A', 220, COLORS.cyan)}
            ${renderGroup(sortedB, 'B', 1150, COLORS.magenta)}
            
            <circle cx="${width / 2 - 300}" cy="970" r="6" fill="${COLORS.success}"/>
            <text x="${width / 2 - 280}" y="976" fill="${COLORS.textGray}" font-size="19" 
                font-family="Arial">LOS 2 MEJORES EQUIPOS DE CADA GRUPO CLASIFICAN A SEMIFINALES</text>
        </svg>`;

        const baseImage = await this.svgToPng(svg);

        if (logoPath) {
            try {
                const logo = await sharp(logoPath)
                    .resize(130, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .toBuffer();

                return await sharp(baseImage)
                    .composite([{
                        input: logo,
                        top: 45,
                        left: Math.floor(width / 2) - 65
                    }])
                    .png()
                    .toBuffer();
            } catch (err) {
                console.error('❌ Error al componer logo:', err);
                return baseImage;
            }
        }

        return baseImage;
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const width = 1920;
        const height = 1080;
        const logoPath = this.getLogoPath();

        const drawMatch = (x: number, y: number, teamA: string, teamB: string, winner: string | null, label: string, isFinal: boolean = false) => {
            const w = isFinal ? 480 : 380;
            const h = 160;
            const color = isFinal ? COLORS.primary : COLORS.cyan;

            const winA = winner === teamA;
            const winB = winner === teamB;

            const maxLen = isFinal ? 16 : 14;
            let nameA = teamA === 'TBD' ? '???' : teamA.toUpperCase();
            let nameB = teamB === 'TBD' ? '???' : teamB.toUpperCase();
            if (nameA.length > maxLen) nameA = nameA.substring(0, maxLen - 2) + '..';
            if (nameB.length > maxLen) nameB = nameB.substring(0, maxLen - 2) + '..';

            return `
            <g transform="translate(${x}, ${y})">
                <defs>
                    <linearGradient id="m${x}${y}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.15"/>
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05"/>
                    </linearGradient>
                    ${isFinal ? `
                    <filter id="fg${x}${y}">
                        <feGaussianBlur stdDeviation="4"/>
                        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>` : ''}
                </defs>
                
                <rect x="0" y="0" width="${w}" height="${h}" fill="url(#m${x}${y})" 
                    stroke="${color}" stroke-width="${isFinal ? 5 : 3}" rx="12" 
                    ${isFinal ? `filter="url(#fg${x}${y})"` : ''}/>
                
                <rect x="0" y="0" width="${w}" height="38" fill="${color}" rx="12"/>
                <text x="${w / 2}" y="26" fill="#000" font-size="${isFinal ? 19 : 17}" 
                    font-weight="bold" font-family="Arial" text-anchor="middle" 
                    letter-spacing="2">${label}</text>
                
                <rect x="6" y="42" width="${w - 12}" height="52" 
                    fill="${winA ? color : '#fff'}" fill-opacity="${winA ? '0.18' : '0.03'}" rx="8"/>
                ${winA ? `<rect x="11" y="47" width="6" height="42" fill="${COLORS.success}" rx="3"/>` : ''}
                <text x="${winA ? '32' : '20'}" y="74" fill="${winA ? COLORS.textWhite : COLORS.textGray}" 
                    font-size="${isFinal ? 25 : 23}" font-weight="${winA ? 'bold' : '600'}" 
                    font-family="Arial">${nameA}</text>
                ${winA ? `<text x="${w - 24}" y="74" font-size="22">👑</text>` : ''}
                
                <line x1="20" y1="102" x2="${w - 20}" y2="102" stroke="${color}" 
                    stroke-width="2" opacity="0.3"/>
                <circle cx="${w / 2}" cy="102" r="18" fill="${COLORS.darkBg}" 
                        stroke="${color}" stroke-width="2"/>
                <text x="${w / 2}" y="109" fill="${color}" font-size="14" font-weight="bold" 
                    font-family="Arial" text-anchor="middle">VS</text>
                
                <rect x="6" y="106" width="${w - 12}" height="52" 
                    fill="${winB ? color : '#fff'}" fill-opacity="${winB ? '0.18' : '0.03'}" rx="8"/>
                ${winB ? `<rect x="11" y="111" width="6" height="42" fill="${COLORS.success}" rx="3"/>` : ''}
                <text x="${winB ? '32' : '20'}" y="138" fill="${winB ? COLORS.textWhite : COLORS.textGray}" 
                    font-size="${isFinal ? 25 : 23}" font-weight="${winB ? 'bold' : '600'}" 
                    font-family="Arial">${nameB}</text>
                ${winB ? `<text x="${w - 24}" y="138" font-size="22">👑</text>` : ''}
            </g>`;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${COLORS.darkBg}"/>
                    <stop offset="50%" style="stop-color:${COLORS.darkBg2}"/>
                    <stop offset="100%" style="stop-color:${COLORS.darkBg}"/>
                </linearGradient>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M50 0 L0 0 0 50" fill="none" stroke="${COLORS.border}" 
                        stroke-width="0.5" opacity="0.2"/>
                </pattern>
                <radialGradient id="glow">
                    <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:0.1"/>
                    <stop offset="100%" style="stop-color:${COLORS.primary};stop-opacity:0"/>
                </radialGradient>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bg)"/>
            <rect width="100%" height="100%" fill="url(#grid)"/>
            <ellipse cx="${width / 2}" cy="${height / 2}" rx="650" ry="450" fill="url(#glow)"/>
            
            <circle cx="200" cy="90" r="65" fill="${COLORS.darkBg}" opacity="0.9"/>
            <circle cx="200" cy="90" r="65" fill="none" stroke="${COLORS.primary}" stroke-width="3"/>
            
            <text x="${width / 2}" y="100" fill="${COLORS.primary}" font-size="60" font-weight="900" 
                font-family="Arial" text-anchor="middle" letter-spacing="7">
                🏆 PLAYOFFS COCOSCUP
            </text>
            
            <text x="${width / 2}" y="145" fill="${COLORS.cyan}" font-size="22" font-weight="600" 
                font-family="Arial" text-anchor="middle" letter-spacing="2">
                SEMIFINALES BO1 • GRAN FINAL BO3
            </text>
            
            <line x1="430" y1="355" x2="680" y2="355" stroke="${COLORS.cyan}" 
                stroke-width="3" stroke-dasharray="10,5" opacity="0.5"/>
            <line x1="430" y1="625" x2="680" y2="625" stroke="${COLORS.cyan}" 
                stroke-width="3" stroke-dasharray="10,5" opacity="0.5"/>
            <line x1="680" y1="355" x2="680" y2="490" stroke="${COLORS.cyan}" 
                stroke-width="3" stroke-dasharray="10,5" opacity="0.5"/>
            <line x1="680" y1="625" x2="680" y2="490" stroke="${COLORS.cyan}" 
                stroke-width="3" stroke-dasharray="10,5" opacity="0.5"/>
            <line x1="680" y1="490" x2="1000" y2="490" stroke="${COLORS.primary}" 
                stroke-width="4" stroke-dasharray="10,5" opacity="0.6"/>
            
            ${drawMatch(50, 275, data.semifinals[0].teamA, data.semifinals[0].teamB,
            data.semifinals[0].winner, 'SEMIFINAL 1')}
            
            ${drawMatch(50, 545, data.semifinals[1].teamA, data.semifinals[1].teamB,
                data.semifinals[1].winner, 'SEMIFINAL 2')}
            
            ${drawMatch(1000, 410, data.final.teamA, data.final.teamB,
                    data.final.winner, '👑 GRAN FINAL', true)}
            
            <line x1="350" y1="940" x2="${width - 350}" y2="940" stroke="${COLORS.primary}" 
                stroke-width="2" opacity="0.3"/>
            <text x="${width / 2}" y="985" fill="#888" font-size="18" font-family="Arial" 
                text-anchor="middle" letter-spacing="1">COCOSCUP 2026 • LLAVE OFICIAL</text>
        </svg>`;

        const baseImage = await this.svgToPng(svg);

        if (logoPath) {
            try {
                const logo = await sharp(logoPath)
                    .resize(108, 108, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .toBuffer();

                return await sharp(baseImage)
                    .composite([{
                        input: logo,
                        top: 36,
                        left: 146
                    }])
                    .png()
                    .toBuffer();
            } catch (err) {
                console.error('❌ Error al componer logo:', err);
                return baseImage;
            }
        }

        return baseImage;
    }
}

export const imageGenerator = new ImageGenerator();