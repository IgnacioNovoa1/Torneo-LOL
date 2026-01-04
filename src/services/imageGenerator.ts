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

export class ImageGenerator {

    private getLogoBase64(): string {
        try {
            const logoPath = path.join(__dirname, '../../assets/logo.png');
            if (fs.existsSync(logoPath)) {
                const img = fs.readFileSync(logoPath);
                return `data:image/png;base64,${img.toString('base64')}`;
            }
        } catch (e) {
            console.warn('Logo no encontrado, usando placeholder');
        }
        return '';
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

        const renderGroup = (teams: any[], groupName: string, x: number, color: string, accentColor: string) => {
            const groupHeight = 80;
            const rowHeight = 70;
            const totalHeight = groupHeight + (teams.length * rowHeight);

            return `
            <g transform="translate(${x}, 380)">
                <!-- Fondo del grupo con efecto glassmorphism -->
                <defs>
                    <linearGradient id="groupGrad${groupName}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05" />
                    </linearGradient>
                    <filter id="glow${groupName}">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                <!-- Marco del grupo -->
                <rect x="0" y="0" width="750" height="${totalHeight}" 
                    fill="url(#groupGrad${groupName})" 
                    stroke="${accentColor}" 
                    stroke-width="3" 
                    rx="12" 
                    filter="url(#glow${groupName})" />
                
                <!-- Header del grupo -->
                <rect x="0" y="0" width="750" height="${groupHeight}" 
                    fill="${accentColor}" 
                    fill-opacity="0.9" 
                    rx="12" />
                <rect x="0" y="${groupHeight - 10}" width="750" height="10" 
                    fill="${accentColor}" />
                
                <!-- Título del grupo -->
                <text x="375" y="50" 
                    fill="#FFFFFF" 
                    font-size="42" 
                    font-weight="900" 
                    font-family="Arial, sans-serif" 
                    text-anchor="middle" 
                    letter-spacing="4">
                    GROUP ${groupName}
                </text>
                
                <!-- Headers de columnas -->
                <text x="80" y="${groupHeight + 40}" 
                    fill="${accentColor}" 
                    font-size="20" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif">
                    EQUIPO
                </text>
                <text x="650" y="${groupHeight + 40}" 
                    fill="${accentColor}" 
                    font-size="20" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif" 
                    text-anchor="middle">
                    W - L
                </text>
                
                <!-- Equipos -->
                ${teams.map((team, i) => {
                const y = groupHeight + 60 + (i * rowHeight);
                const isQualified = i < 2;
                const bgOpacity = i % 2 === 0 ? '0.08' : '0.03';

                return `
                    <g>
                        <!-- Fila alternada -->
                        <rect x="10" y="${y - 20}" width="730" height="${rowHeight - 10}" 
                            fill="#FFFFFF" 
                            fill-opacity="${bgOpacity}" 
                            rx="6" />
                        
                        <!-- Indicador de clasificación -->
                        ${isQualified ? `
                        <rect x="15" y="${y - 15}" width="8" height="${rowHeight - 20}" 
                            fill="#00FF88" 
                            rx="4" />
                        <circle cx="40" cy="${y + 10}" r="6" fill="#00FF88" />
                        ` : ''}
                        
                        <!-- Posición -->
                        <text x="${isQualified ? '70' : '50'}" y="${y + 15}" 
                            fill="${isQualified ? '#00FF88' : '#888888'}" 
                            font-size="32" 
                            font-weight="bold" 
                            font-family="Arial, sans-serif">
                            ${i + 1}
                        </text>
                        
                        <!-- Nombre del equipo -->
                        <text x="120" y="${y + 15}" 
                            fill="${isQualified ? '#FFFFFF' : '#CCCCCC'}" 
                            font-size="28" 
                            font-weight="${isQualified ? 'bold' : '600'}" 
                            font-family="Arial, sans-serif">
                            ${team.team.toUpperCase()}
                        </text>
                        
                        <!-- Record -->
                        <text x="650" y="${y + 15}" 
                            fill="${isQualified ? accentColor : '#999999'}" 
                            font-size="32" 
                            font-weight="bold" 
                            font-family="Arial, monospace" 
                            text-anchor="middle">
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
                <!-- Gradiente de fondo -->
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#0A1428;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#0F2847;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1A0B2E;stop-opacity:1" />
                </linearGradient>
                
                <!-- Patrón hexagonal de fondo -->
                <pattern id="hexPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 100 25 L 100 75 L 50 100 L 0 75 L 0 25 Z" 
                        fill="none" 
                        stroke="#1E3A5F" 
                        stroke-width="0.5" 
                        opacity="0.3"/>
                </pattern>
                
                <!-- Brillo superior -->
                <linearGradient id="topGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#00D9FF;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#00D9FF;stop-opacity:0" />
                </linearGradient>
            </defs>
            
            <!-- Fondo base -->
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#hexPattern)" />
            
            <!-- Brillo superior decorativo -->
            <rect x="0" y="0" width="${width}" height="300" fill="url(#topGlow)" />
            
            <!-- Líneas decorativas superiores -->
            <line x1="0" y1="280" x2="${width}" y2="280" stroke="#00D9FF" stroke-width="2" opacity="0.5"/>
            <line x1="0" y1="285" x2="${width}" y2="285" stroke="#0099CC" stroke-width="1" opacity="0.3"/>
            
            <!-- Logo del torneo -->
            ${logoB64 ? `
            <g transform="translate(${width / 2}, 100)">
                <circle cx="0" cy="0" r="90" fill="#0A1428" opacity="0.8"/>
                <circle cx="0" cy="0" r="90" fill="none" stroke="#00D9FF" stroke-width="3"/>
                <image href="${logoB64}" x="-75" y="-75" height="150" width="150" />
            </g>
            ` : ''}
            
            <!-- Título principal -->
            <text x="${width / 2}" y="250" 
                fill="#FFFFFF" 
                font-size="72" 
                font-weight="900" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="8">
                FASE DE GRUPOS
            </text>
            
            <!-- Subtítulo -->
            <text x="${width / 2}" y="310" 
                fill="#00D9FF" 
                font-size="28" 
                font-weight="600" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="3">
                COCOSCUP 2026 • CLASIFICACIÓN OFICIAL
            </text>
            
            <!-- Grupo A -->
            ${renderGroup(sortedA, 'A', 100, '#0A4D8C', '#00D9FF')}
            
            <!-- Grupo B -->
            ${renderGroup(sortedB, 'B', 1070, '#8C0A4D', '#FF0099')}
            
            <!-- Nota de clasificación -->
            <g transform="translate(${width / 2}, 980)">
                <circle cx="-200" cy="0" r="8" fill="#00FF88" />
                <text x="-180" y="6" 
                    fill="#CCCCCC" 
                    font-size="22" 
                    font-weight="500" 
                    font-family="Arial, sans-serif">
                    LOS 2 MEJORES EQUIPOS DE CADA GRUPO CLASIFICAN A SEMIFINALES
                </text>
            </g>
            
            <!-- Footer decorativo -->
            <line x1="200" y1="1040" x2="${width - 200}" y2="1040" 
                stroke="#00D9FF" 
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
            const w = isFinal ? 450 : 380;
            const h = 140;
            const color = isFinal ? '#FFD700' : '#00D9FF';

            const isWinnerA = winner === teamA;
            const isWinnerB = winner === teamB;

            return `
            <g transform="translate(${x}, ${y})">
                <!-- Fondo del match -->
                <defs>
                    <linearGradient id="matchGrad${x}${y}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.15" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05" />
                    </linearGradient>
                    ${isFinal ? `
                    <filter id="finalGlow">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
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
                    ${isFinal ? 'filter="url(#finalGlow)"' : ''}/>
                
                <!-- Label del match -->
                <rect x="0" y="0" width="${w}" height="35" 
                    fill="${color}" 
                    fill-opacity="0.9" 
                    rx="10" />
                <text x="${w / 2}" y="24" 
                    fill="#000000" 
                    font-size="${isFinal ? '20' : '18'}" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif" 
                    text-anchor="middle" 
                    letter-spacing="2">
                    ${label}
                </text>
                
                <!-- Team A -->
                <g>
                    <rect x="5" y="40" width="${w - 10}" height="45" 
                        fill="${isWinnerA ? color : '#FFFFFF'}" 
                        fill-opacity="${isWinnerA ? '0.2' : '0.03'}" 
                        rx="6" />
                    ${isWinnerA ? `
                    <rect x="10" y="45" width="6" height="35" 
                        fill="#00FF88" 
                        rx="3" />
                    ` : ''}
                    <text x="${isWinnerA ? '35' : '25'}" y="70" 
                        fill="${isWinnerA ? '#FFFFFF' : '#CCCCCC'}" 
                        font-size="${isFinal ? '26' : '24'}" 
                        font-weight="${isWinnerA ? 'bold' : '600'}" 
                        font-family="Arial, sans-serif">
                        ${teamA === 'TBD' ? '???' : teamA.toUpperCase()}
                    </text>
                    ${isWinnerA ? `
                    <text x="${w - 25}" y="70" 
                        font-size="24" 
                        text-anchor="end">
                        👑
                    </text>
                    ` : ''}
                </g>
                
                <!-- Separador VS -->
                <line x1="20" y1="92" x2="${w - 20}" y2="92" 
                    stroke="${color}" 
                    stroke-width="2" 
                    opacity="0.3"/>
                <circle cx="${w / 2}" cy="92" r="18" 
                        fill="#0A1428" 
                        stroke="${color}" 
                        stroke-width="2"/>
                <text x="${w / 2}" y="99" 
                    fill="${color}" 
                    font-size="14" 
                    font-weight="bold" 
                    font-family="Arial, sans-serif" 
                    text-anchor="middle">
                    VS
                </text>
                
                <!-- Team B -->
                <g>
                    <rect x="5" y="95" width="${w - 10}" height="45" 
                        fill="${isWinnerB ? color : '#FFFFFF'}" 
                        fill-opacity="${isWinnerB ? '0.2' : '0.03'}" 
                        rx="6" />
                    ${isWinnerB ? `
                    <rect x="10" y="100" width="6" height="35" 
                        fill="#00FF88" 
                        rx="3" />
                    ` : ''}
                    <text x="${isWinnerB ? '35' : '25'}" y="125" 
                        fill="${isWinnerB ? '#FFFFFF' : '#CCCCCC'}" 
                        font-size="${isFinal ? '26' : '24'}" 
                        font-weight="${isWinnerB ? 'bold' : '600'}" 
                        font-family="Arial, sans-serif">
                        ${teamB === 'TBD' ? '???' : teamB.toUpperCase()}
                    </text>
                    ${isWinnerB ? `
                    <text x="${w - 25}" y="125" 
                        font-size="24" 
                        text-anchor="end">
                        👑
                    </text>
                    ` : ''}
                </g>
            </g>
            `;
        };

        const drawConnector = (x1: number, y1: number, x2: number, y2: number, color: string = '#00D9FF') => {
            return `
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                stroke="${color}" 
                stroke-width="3" 
                stroke-dasharray="10,5" 
                opacity="0.6"/>
            `;
        };

        const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#0A0E1A;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#1A0B2E;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0A1428;stop-opacity:1" />
                </linearGradient>
                
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1E3A5F" stroke-width="0.5" opacity="0.2"/>
                </pattern>
                
                <radialGradient id="centerGlow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.15" />
                    <stop offset="100%" style="stop-color:#FFD700;stop-opacity:0" />
                </radialGradient>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bgGradient)" />
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <!-- Resplandor central -->
            <ellipse cx="${width / 2}" cy="${height / 2}" rx="600" ry="400" fill="url(#centerGlow)" />
            
            <!-- Logo -->
            ${logoB64 ? `
            <g transform="translate(${width / 2}, 100)">
                <circle cx="0" cy="0" r="90" fill="#0A1428" opacity="0.9"/>
                <circle cx="0" cy="0" r="90" fill="none" stroke="#FFD700" stroke-width="4"/>
                <image href="${logoB64}" x="-75" y="-75" height="150" width="150" />
            </g>
            ` : ''}
            
            <!-- Título -->
            <text x="${width / 2}" y="240" 
                fill="#FFD700" 
                font-size="68" 
                font-weight="900" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="8">
                🏆 PLAYOFFS COCOSCUP
            </text>
            
            <text x="${width / 2}" y="290" 
                fill="#00D9FF" 
                font-size="24" 
                font-weight="600" 
                font-family="Arial, sans-serif" 
                text-anchor="middle" 
                letter-spacing="2">
                SEMIFINALES BO1 • GRAN FINAL BO3
            </text>
            
            <!-- Conectores -->
            ${drawConnector(430, 470, 670, 470)}
            ${drawConnector(430, 710, 670, 710)}
            ${drawConnector(670, 470, 670, 590)}
            ${drawConnector(670, 710, 670, 590)}
            ${drawConnector(670, 590, 1030, 590)}
            
            <!-- Semifinal 1 -->
            ${drawMatch(50, 400, data.semifinals[0].teamA, data.semifinals[0].teamB, data.semifinals[0].winner, 'SEMIFINAL 1')}
            
            <!-- Semifinal 2 -->
            ${drawMatch(50, 640, data.semifinals[1].teamA, data.semifinals[1].teamB, data.semifinals[1].winner, 'SEMIFINAL 2')}
            
            <!-- Gran Final -->
            ${drawMatch(1030, 520, data.final.teamA, data.final.teamB, data.final.winner, '👑 GRAN FINAL', true)}
            
            <!-- Decoración inferior -->
            <line x1="300" y1="950" x2="${width - 300}" y2="950" 
                stroke="#FFD700" 
                stroke-width="2" 
                opacity="0.3"/>
            
            <text x="${width / 2}" y="1000" 
                fill="#888888" 
                font-size="20" 
                font-family="Arial, sans-serif" 
                text-anchor="middle">
                COCOSCUP 2026 • LLAVE OFICIAL
            </text>
        </svg>`;

        return await this.svgToPng(svg);
    }
}

export const imageGenerator = new ImageGenerator();