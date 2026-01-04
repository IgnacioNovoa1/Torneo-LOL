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
    secondary: '#00D9FF', 
    accent: '#FF1493',  
    darkBg: '#0A0E1A',  
    darkBg2: '#1A0B2E', 
    textLight: '#FFFFFF', 
    textDim: '#CCCCCC', 
    success: '#00FF88',
    border: '#1E3A5F'        
};

export class ImageGenerator {

    private getLogoBase64(): string {
        try {
            const possiblePaths = [
                path.join(__dirname, '../../assets/logo.png'),
                path.join(__dirname, '../assets/logo.png'),
                path.join(process.cwd(), 'assets/logo.png'),
                path.join(process.cwd(), 'src/assets/logo.png'),
                path.join(process.cwd(), 'dist/assets/logo.png')
            ];

            for (const logoPath of possiblePaths) {
                if (fs.existsSync(logoPath)) {
                    const img = fs.readFileSync(logoPath);
                    console.log('✅ Logo cargado desde:', logoPath);
                    return `data:image/png;base64,${img.toString('base64')}`;
                }
            }
            
            console.warn('Logo no encontrado en ninguna ruta. Buscado en:', possiblePaths);
        } catch (e) {
            console.error('Error cargando logo:', e);
        }
        return '';
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    private async svgToPng(svg: string): Promise<Buffer> {
        return await sharp(Buffer.from(svg)).png().toBuffer();
    }

    async generateGroupsImage(data: GroupData): Promise<Buffer> {
        const width = 1920;
        const height = 1080;
        const logoB64 = this.getLogoBase64();

        // Ordenar equipos por victorias
        const sortedA = [...data.A].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
        const sortedB = [...data.B].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        const renderGroup = (teams: any[], groupName: string, x: number, primaryColor: string, accentColor: string) => {
            const groupWidth = 570;
            const groupHeight = 80;
            const rowHeight = 70;
            const totalHeight = groupHeight + (teams.length * rowHeight) + 10;
            
            return `
            <g transform="translate(${x}, 380)">
                <defs>
                    <linearGradient id="groupGrad${groupName}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.25" />
                        <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.05" />
                    </linearGradient>
                    <filter id="glow${groupName}">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                <!-- Marco del grupo -->
                <rect x="0" y="0" width="${groupWidth}" height="${totalHeight}" 
                    fill="url(#groupGrad${groupName})" 
                    stroke="${accentColor}" 
                    stroke-width="3" 
                    rx="12" 
                    filter="url(#glow${groupName})" />
                
                <!-- Header del grupo -->
                <rect x="0" y="0" width="${groupWidth}" height="${groupHeight}" 
                    fill="${accentColor}" 
                    fill-opacity="0.95" 
                    rx="12" />
                
                <!-- Título del grupo -->
                <text x="${groupWidth/2}" y="52" 
                    fill="${COLORS.textLight}" 
                    font-size="42" 
                    font-weight="900" 
                    font-family="Arial, sans-serif" 
                    text-anchor="middle" 
                    letter-spacing="6">
                    GROUP ${groupName}
                </text>
                
                <!-- Headers de columnas -->
                <text x="70" y="${groupHeight + 35}" 
                    fill="${accentColor}" 
                    font-size="18" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif">
                    EQUIPO
                </text>
                <text x="${groupWidth - 40}" y="${groupHeight + 35}" 
                    fill="${accentColor}" 
                    font-size="18" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif" 
                    text-anchor="end">
                    W - L
                </text>
                
                <!-- Equipos -->
                ${teams.map((team, i) => {
                    const y = groupHeight + 55 + (i * rowHeight);
                    const isQualified = i < 2;
                    const bgOpacity = i % 2 === 0 ? '0.08' : '0.03';
                    const teamName = this.truncateText(team.team.toUpperCase(), 20);
                    
                    return `
                    <g>
                        <!-- Fila alternada -->
                        <rect x="8" y="${y - 18}" width="${groupWidth - 16}" height="${rowHeight - 15}" 
                            fill="${COLORS.textLight}" 
                            fill-opacity="${bgOpacity}" 
                            rx="6" />
                        
                        <!-- Indicador de clasificación -->
                        ${isQualified ? `
                        <rect x="13" y="${y - 13}" width="6" height="${rowHeight - 25}" 
                            fill="${COLORS.success}" 
                            rx="3" />
                        <circle cx="33" cy="${y + 8}" r="5" fill="${COLORS.success}" />
                        ` : ''}
                        
                        <!-- Posición -->
                        <text x="${isQualified ? '58' : '38'}" y="${y + 13}" 
                            fill="${isQualified ? COLORS.success : '#888888'}" 
                            font-size="28" 
                            font-weight="bold" 
                            font-family="Arial, sans-serif">
                            ${i + 1}
                        </text>
                        
                        <!-- Nombre del equipo (con límite de caracteres) -->
                        <text x="${isQualified ? '100' : '80'}" y="${y + 13}" 
                            fill="${isQualified ? COLORS.textLight : COLORS.textDim}" 
                            font-size="24" 
                            font-weight="${isQualified ? 'bold' : '600'}" 
                            font-family="Arial, sans-serif">
                            ${teamName}
                        </text>
                        
                        <!-- Record -->
                        <text x="${groupWidth - 40}" y="${y + 13}" 
                            fill="${isQualified ? accentColor : '#999999'}" 
                            font-size="28" 
                            font-weight="bold" 
                            font-family="Arial, monospace" 
                            text-anchor="end">
                            ${team.wins} - ${team.losses}
                        </text>
                    </g>
                    `;
                }).join('')}
            </g>
            `;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${COLORS.darkBg};stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#0F2847;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${COLORS.darkBg2};stop-opacity:1" />
                </linearGradient>
                
                <pattern id="hexPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 100 25 L 100 75 L 50 100 L 0 75 L 0 25 Z" 
                        fill="none" 
                        stroke="${COLORS.border}" 
                        stroke-width="0.5" 
                        opacity="0.3"/>
                </pattern>
                
                <linearGradient id="topGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${COLORS.secondary};stop-opacity:0.25" />
                    <stop offset="100%" style="stop-color:${COLORS.secondary};stop-opacity:0" />
                </linearGradient>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#hexPattern)" />
            <rect x="0" y="0" width="${width}" height="300" fill="url(#topGlow)" />
            
            <line x1="0" y1="280" x2="${width}" y2="280" stroke="${COLORS.secondary}" stroke-width="2" opacity="0.4"/>
            
            <!-- Logo del torneo -->
            ${logoB64 ? `
            <g transform="translate(${width/2}, 100)">
                <circle cx="0" cy="0" r="85" fill="${COLORS.darkBg}" opacity="0.9"/>
                <circle cx="0" cy="0" r="85" fill="none" stroke="${COLORS.primary}" stroke-width="4"/>
                <image href="${logoB64}" x="-70" y="-70" height="140" width="140" />
            </g>
            ` : `
            <!-- Placeholder si no hay logo -->
            <g transform="translate(${width/2}, 100)">
                <circle cx="0" cy="0" r="85" fill="${COLORS.darkBg}" opacity="0.9"/>
                <circle cx="0" cy="0" r="85" fill="none" stroke="${COLORS.primary}" stroke-width="4"/>
                <text x="0" y="15" fill="${COLORS.primary}" font-size="48" font-weight="bold" 
                    font-family="Arial" text-anchor="middle">CC</text>
            </g>
            `}
            
            <!-- Título principal -->
            <text x="${width/2}" y="250" 
                fill="${COLORS.textLight}" 
                font-size="68" 
                font-weight="900" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="8">
                FASE DE GRUPOS
            </text>
            
            <text x="${width/2}" y="310" 
                fill="${COLORS.secondary}" 
                font-size="26" 
                font-weight="600" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="3">
                COCOSCUP 2026 • CLASIFICACIÓN OFICIAL
            </text>
            
            <!-- Grupo A (Cyan) -->
            ${renderGroup(sortedA, 'A', 200, COLORS.secondary, COLORS.secondary)}
            
            <!-- Grupo B (Rosa/Magenta) -->
            ${renderGroup(sortedB, 'B', 1150, COLORS.accent, COLORS.accent)}
            
            <!-- Nota de clasificación -->
            <g transform="translate(${width/2}, 980)">
                <circle cx="-330" cy="0" r="7" fill="${COLORS.success}" />
                <text x="-310" y="6" 
                    fill="${COLORS.textDim}" 
                    font-size="20" 
                    font-weight="500" 
                    font-family="Arial, sans-serif">
                    LOS 2 MEJORES EQUIPOS DE CADA GRUPO CLASIFICAN A SEMIFINALES
                </text>
            </g>
            
            <line x1="200" y1="1040" x2="${width - 200}" y2="1040" 
                stroke="${COLORS.secondary}" 
                stroke-width="1" 
                opacity="0.3"/>
        </svg>`;

        return await this.svgToPng(svg);
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const width = 1920;
        const height = 1080;
        const logoB64 = this.getLogoBase64();

        const drawMatch = (x: number, y: number, teamA: string, teamB: string, winner: string | null, label: string, isFinal: boolean = false) => {
            const w = isFinal ? 380 : 320;
            const h = 130;
            const color = isFinal ? COLORS.primary : COLORS.secondary;
            
            const isWinnerA = winner === teamA;
            const isWinnerB = winner === teamB;
            
            // Truncar nombres largos
            const displayTeamA = this.truncateText(teamA === 'TBD' ? '???' : teamA.toUpperCase(), 15);
            const displayTeamB = this.truncateText(teamB === 'TBD' ? '???' : teamB.toUpperCase(), 15);
            
            return `
            <g transform="translate(${x}, ${y})">
                <defs>
                    <linearGradient id="matchGrad${x}${y}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.15" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05" />
                    </linearGradient>
                    ${isFinal ? `
                    <filter id="finalGlow${x}${y}">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    ` : ''}
                </defs>
                
                <!-- Box principal -->
                <rect x="0" y="0" width="${w}" height="${h}" 
                    fill="url(#matchGrad${x}${y})" 
                    stroke="${color}" 
                    stroke-width="${isFinal ? '4' : '3'}" 
                    rx="10" 
                    ${isFinal ? `filter="url(#finalGlow${x}${y})"` : ''}/>
                
                <!-- Label del match -->
                <rect x="0" y="0" width="${w}" height="32" 
                    fill="${color}" 
                    fill-opacity="0.95" 
                    rx="10" />
                <text x="${w/2}" y="22" 
                    fill="${isFinal ? '#000000' : '#000000'}" 
                    font-size="${isFinal ? '17' : '16'}" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif" 
                    text-anchor="middle" 
                    letter-spacing="2">
                    ${label}
                </text>
                
                <!-- Team A -->
                <g>
                    <rect x="4" y="36" width="${w-8}" height="42" 
                        fill="${isWinnerA ? color : COLORS.textLight}" 
                        fill-opacity="${isWinnerA ? '0.2' : '0.03'}" 
                        rx="6" />
                    ${isWinnerA ? `
                    <rect x="9" y="41" width="5" height="32" 
                        fill="${COLORS.success}" 
                        rx="2.5" />
                    ` : ''}
                    <text x="${isWinnerA ? '28' : '18'}" y="63" 
                        fill="${isWinnerA ? COLORS.textLight : COLORS.textDim}" 
                        font-size="${isFinal ? '22' : '20'}" 
                        font-weight="${isWinnerA ? 'bold' : '600'}" 
                        font-family="Arial, sans-serif">
                        ${displayTeamA}
                    </text>
                    ${isWinnerA ? `
                    <text x="${w - 20}" y="63" 
                        font-size="20" 
                        text-anchor="end">
                        👑
                    </text>
                    ` : ''}
                </g>
                
                <!-- Separador VS -->
                <line x1="18" y1="85" x2="${w-18}" y2="85" 
                    stroke="${color}" 
                    stroke-width="2" 
                    opacity="0.3"/>
                <circle cx="${w/2}" cy="85" r="16" 
                        fill="${COLORS.darkBg}" 
                        stroke="${color}" 
                        stroke-width="2"/>
                <text x="${w/2}" y="91" 
                    fill="${color}" 
                    font-size="13" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif" 
                    text-anchor="middle">
                    VS
                </text>
                
                <!-- Team B -->
                <g>
                    <rect x="4" y="88" width="${w-8}" height="42" 
                        fill="${isWinnerB ? color : COLORS.textLight}" 
                        fill-opacity="${isWinnerB ? '0.2' : '0.03'}" 
                        rx="6" />
                    ${isWinnerB ? `
                    <rect x="9" y="93" width="5" height="32" 
                        fill="${COLORS.success}" 
                        rx="2.5" />
                    ` : ''}
                    <text x="${isWinnerB ? '28' : '18'}" y="115" 
                        fill="${isWinnerB ? COLORS.textLight : COLORS.textDim}" 
                        font-size="${isFinal ? '22' : '20'}" 
                        font-weight="${isWinnerB ? 'bold' : '600'}" 
                        font-family="Arial, sans-serif">
                        ${displayTeamB}
                    </text>
                    ${isWinnerB ? `
                    <text x="${w - 20}" y="115" 
                        font-size="20" 
                        text-anchor="end">
                        👑
                    </text>
                    ` : ''}
                </g>
            </g>
            `;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${COLORS.darkBg};stop-opacity:1" />
                    <stop offset="50%" style="stop-color:${COLORS.darkBg2};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${COLORS.darkBg};stop-opacity:1" />
                </linearGradient>
                
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="${COLORS.border}" stroke-width="0.5" opacity="0.2"/>
                </pattern>
                
                <radialGradient id="centerGlow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:0.12" />
                    <stop offset="100%" style="stop-color:${COLORS.primary};stop-opacity:0" />
                </radialGradient>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#grid)" />
            <ellipse cx="${width/2}" cy="${height/2}" rx="600" ry="400" fill="url(#centerGlow)" />
            
            <!-- Logo -->
            ${logoB64 ? `
            <g transform="translate(160, 80)">
                <circle cx="0" cy="0" r="60" fill="${COLORS.darkBg}" opacity="0.9"/>
                <circle cx="0" cy="0" r="60" fill="none" stroke="${COLORS.primary}" stroke-width="3"/>
                <image href="${logoB64}" x="-50" y="-50" height="100" width="100" />
            </g>
            ` : `
            <g transform="translate(160, 80)">
                <circle cx="0" cy="0" r="60" fill="${COLORS.darkBg}" opacity="0.9"/>
                <circle cx="0" cy="0" r="60" fill="none" stroke="${COLORS.primary}" stroke-width="3"/>
                <text x="0" y="15" fill="${COLORS.primary}" font-size="32" font-weight="bold" 
                    font-family="Arial" text-anchor="middle">CC</text>
            </g>
            `}
            
            <!-- Título -->
            <text x="960" y="100" 
                fill="${COLORS.primary}" 
                font-size="64" 
                font-weight="900" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="8">
                🏆 PLAYOFFS COCOSCUP
            </text>
            
            <text x="960" y="145" 
                fill="${COLORS.secondary}" 
                font-size="22" 
                font-weight="600" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="2">
                SEMIFINALES BO1 • GRAN FINAL BO3
            </text>
            
            <!-- Conectores -->
            <line x1="370" y1="330" x2="600" y2="330" stroke="${COLORS.secondary}" stroke-width="3" stroke-dasharray="8,4" opacity="0.5"/>
            <line x1="370" y1="560" x2="600" y2="560" stroke="${COLORS.secondary}" stroke-width="3" stroke-dasharray="8,4" opacity="0.5"/>
            <line x1="600" y1="330" x2="600" y2="445" stroke="${COLORS.secondary}" stroke-width="3" stroke-dasharray="8,4" opacity="0.5"/>
            <line x1="600" y1="560" x2="600" y2="445" stroke="${COLORS.secondary}" stroke-width="3" stroke-dasharray="8,4" opacity="0.5"/>
            <line x1="600" y1="445" x2="970" y2="445" stroke="${COLORS.primary}" stroke-width="3" stroke-dasharray="8,4" opacity="0.6"/>
            
            <!-- Semifinal 1 -->
            ${drawMatch(50, 265, data.semifinals[0].teamA, data.semifinals[0].teamB, data.semifinals[0].winner, 'SEMIFINAL 1')}
            
            <!-- Semifinal 2 -->
            ${drawMatch(50, 495, data.semifinals[1].teamA, data.semifinals[1].teamB, data.semifinals[1].winner, 'SEMIFINAL 2')}
            
            <!-- Gran Final -->
            ${drawMatch(970, 380, data.final.teamA, data.final.teamB, data.final.winner, '👑 GRAN FINAL', true)}
            
            <!-- Footer -->
            <line x1="300" y1="920" x2="${width - 300}" y2="920" stroke="${COLORS.primary}" stroke-width="2" opacity="0.3"/>
            <text x="${width/2}" y="965" 
                fill="#888888" 
                font-size="18" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="1">
                COCOSCUP 2026 • LLAVE OFICIAL
            </text>
        </svg>`;

        return await this.svgToPng(svg);
    }
}

export const imageGenerator = new ImageGenerator();