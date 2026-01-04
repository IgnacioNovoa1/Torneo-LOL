import puppeteer from 'puppeteer';

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
        const html = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8"/>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet">
            <style>
                body { margin:0; padding: 40px; background: ${THEME.bg}; font-family: 'Oswald', sans-serif; color: ${THEME.text}; }
                .title { text-align: center; font-size: 60px; color: ${THEME.gold}; margin-bottom: 40px; }
                .container { display: flex; gap: 40px; }
                .group { flex: 1; background: ${THEME.cardBg}; border-radius: 10px; padding: 20px; }
                .group-header { text-align: center; font-size: 40px; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; font-size: 30px; padding: 10px; }
                .top-2 { color: ${THEME.gold}; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="title">Fase de Grupos - CocosCup</div>
            <div class="container">
                <div class="group">
                    <div class="group-header">GRUPO A</div>
                    ${this.renderGroupRows(data.A)}
                </div>
                <div class="group">
                    <div class="group-header">GRUPO B</div>
                    ${this.renderGroupRows(data.B)}
                </div>
            </div>
        </body>
        </html>`;

        return this.renderHTMLToImage(html, 1200, 800);
    }

    async generatePlayoffsImage(data: PlayoffData): Promise<Buffer> {
        const html = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8"/>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet">
            <style>
                body { background: ${THEME.bg}; color: ${THEME.text}; font-family: 'Oswald'; padding: 40px; }
                .title { text-align: center; font-size: 50px; color: ${THEME.gold}; margin-bottom: 40px; }
                .match { border: 2px solid ${THEME.gold}; padding: 15px; margin-bottom: 30px; }
                .winner { color: #00ff00; }
            </style>
        </head>
        <body>
            <div class="title">PLAYOFFS - COCOSCUP</div>
            ${this.renderMatch(data.semifinals[0], 'SEMIFINAL 1')}
            ${this.renderMatch(data.semifinals[1], 'SEMIFINAL 2')}
            ${this.renderMatch(data.final, 'FINAL')}
            ${this.renderMatch(data.thirdPlace, 'TERCER LUGAR')}
        </body>
        </html>`;

        return this.renderHTMLToImage(html, 1000, 900);
    }

    private renderGroupRows(teams: any[]) {
        return [...teams]
            .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
            .map((t, i) => `
                <div class="row ${i < 2 ? 'top-2' : ''}">
                    <span>${i + 1}. ${t.team}</span>
                    <span>${t.wins}W - ${t.losses}L</span>
                </div>
            `).join('');
    }

    private renderMatch(match: any, label: string) {
        return `
        <div class="match">
            <strong>${label}</strong>
            <div class="${match.winner === match.teamA ? 'winner' : ''}">${match.teamA}</div>
            <div class="${match.winner === match.teamB ? 'winner' : ''}">${match.teamB}</div>
        </div>`;
    }

    private async renderHTMLToImage(html: string, width: number, height: number): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        await page.setViewport({
            width,
            height,
            deviceScaleFactor: 2
        });

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const buffer = await page.screenshot({
            type: 'png',
            fullPage: true
        });

        await browser.close();
        return buffer as Buffer;
    }
}

export const imageGenerator = new ImageGenerator();