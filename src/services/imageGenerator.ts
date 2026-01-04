import axios from 'axios';

const THEME = {
    bg: '#091428',
    cardBg: 'rgba(30, 35, 40, 0.9)',
    gold: '#C8AA6E',
    blue: '#00d4ff',
    red: '#ff4757',
    text: '#F0E6D2'
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

    async generateGroupsImage(data: GroupData): Promise<Buffer> {
        const html = `
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet">
            <style>
                body { margin:0; padding: 40px; background: ${THEME.bg}; font-family: 'Oswald', sans-serif; color: ${THEME.text}; }
                .title { text-align: center; font-size: 60px; color: ${THEME.gold}; text-transform: uppercase; margin-bottom: 40px; text-shadow: 0 0 20px rgba(200,170,110,0.5); }
                .container { display: flex; justify-content: space-between; gap: 40px; }
                .group { flex: 1; background: ${THEME.cardBg}; border: 2px solid #333; padding: 20px; border-radius: 10px; }
                .group-header { text-align: center; font-size: 40px; margin-bottom: 20px; border-bottom: 3px solid; padding-bottom: 10px; }
                .header-a { color: ${THEME.blue}; border-color: ${THEME.blue}; }
                .header-b { color: ${THEME.red}; border-color: ${THEME.red}; }
                .row { display: flex; justify-content: space-between; font-size: 30px; padding: 15px 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .top-2 { color: ${THEME.gold}; font-weight: bold; background: linear-gradient(90deg, transparent, rgba(200,170,110,0.1)); }
                .rank { width: 40px; }
                .wins { text-align: right; }
            </style>
        </head>
        <body>
            <div class="title">Fase de Grupos - CocosCup</div>
            <div class="container">
                <div class="group">
                    <div class="group-header header-a">GRUPO A</div>
                    ${this.renderGroupRows(data.A)}
                </div>
                <div class="group">
                    <div class="group-header header-b">GRUPO B</div>
                    ${this.renderGroupRows(data.B)}
                </div>
            </div>
        </body>
        </html>`;

        return this.fetchImageFromAPI(html, 1200, 800);
    }

    private renderGroupRows(teams: any[]) {
        const sorted = [...teams].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
        return sorted.map((t, i) => `
            <div class="row ${i < 2 ? 'top-2' : ''}">
                <span class="rank">${i + 1}.</span>
                <span class="name">${t.team}</span>
                <span class="wins">${t.wins}W - ${t.losses}L</span>
            </div>
        `).join('');
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const html = `
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet">
            <style>
                body { margin:0; padding: 20px; background: ${THEME.bg}; font-family: 'Oswald', sans-serif; color: ${THEME.text}; display: flex; flex-direction: column; align-items: center; }
                .main-title { font-size: 50px; color: ${THEME.gold}; margin-bottom: 50px; text-shadow: 0 0 20px ${THEME.gold}; }
                .bracket { display: flex; justify-content: center; align-items: center; gap: 80px; width: 100%; }
                .col { display: flex; flex-direction: column; gap: 80px; }
                .match { width: 350px; background: ${THEME.cardBg}; border: 2px solid ${THEME.gold}; padding: 15px; position: relative; }
                .match-label { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: ${THEME.bg}; padding: 0 10px; color: ${THEME.blue}; font-size: 14px; border: 1px solid ${THEME.blue}; }
                .final-label { color: ${THEME.gold}; border-color: ${THEME.gold}; }
                .team { display: flex; justify-content: space-between; font-size: 24px; padding: 5px; }
                .winner { color: #00ff00; text-shadow: 0 0 10px rgba(0,255,0,0.5); }
                .tbd { color: #555; }
                .connector { height: 2px; background: ${THEME.gold}; width: 80px; }
            </style>
        </head>
        <body>
            <div class="main-title">PLAYOFFS - COCOSCUP</div>
            <div class="bracket">
                <div class="col">
                    ${this.renderMatch(data.semifinals[0], "SEMIFINAL 1")}
                    ${this.renderMatch(data.semifinals[1], "SEMIFINAL 2")}
                </div>
                <div class="col" style="justify-content: center;">
                    ${this.renderMatch(data.final, "GRAN FINAL", true)}
                </div>
            </div>
            <div style="margin-top: 50px; transform: scale(0.8);">
                ${this.renderMatch(data.thirdPlace, "3er LUGAR")}
            </div>
        </body>
        </html>`;

        return this.fetchImageFromAPI(html, 1000, 800);
    }

    private renderMatch(match: any, label: string, isFinal = false) {
        const teamAClass = match.winner === match.teamA ? 'winner' : '';
        const teamBClass = match.winner === match.teamB ? 'winner' : '';
        const labelClass = isFinal ? 'final-label' : '';

        return `
        <div class="match" style="border-color: ${isFinal ? THEME.gold : THEME.blue}">
            <div class="match-label ${labelClass}">${label}</div>
            <div class="team ${teamAClass}">${match.teamA === 'TBD' ? '<span class="tbd">???</span>' : match.teamA} ${match.winner === match.teamA ? '👑' : ''}</div>
            <div style="height:1px; background:#444; margin: 5px 0;"></div>
            <div class="team ${teamBClass}">${match.teamB === 'TBD' ? '<span class="tbd">???</span>' : match.teamB} ${match.winner === match.teamB ? '👑' : ''}</div>
        </div>`;
    }

    private async fetchImageFromAPI(html: string, width: number, height: number): Promise<Buffer> {
        try {
            const response = await axios.post('https://quickchart.io/v2/html', {
                html: html,
                width: width,
                height: height,
                backgroundColor: THEME.bg
            }, { responseType: 'arraybuffer' });

            return Buffer.from(response.data);
        } catch (error) {
            console.error("Error QuickChart:", error);
            throw new Error("Error generando imagen externa");
        }
    }
}

export const imageGenerator = new ImageGenerator();