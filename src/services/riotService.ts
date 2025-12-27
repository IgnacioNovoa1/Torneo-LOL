import fetch from 'node-fetch';

interface ChampionMap {
    [key: string]: string;
}

class RiotStaticService {
    private champions: ChampionMap = {};
    private version: string = '13.24.1'; 

    constructor() {
        this.init();
    }

    private async init() {
        try {
            const versionData = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
            const versions = await versionData.json() as string[];
            this.version = versions[0];
            console.log(`📚 DataDragon actualizado a la versión: ${this.version}`);

            const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${this.version}/data/es_ES/champion.json`);
            const data = await response.json() as any;
            Object.values(data.data).forEach((champ: any) => {
                this.champions[champ.key] = champ.name;
            });
            
            console.log(`${Object.keys(this.champions).length} campeones cargados en memoria.`);

        } catch (error) {
            console.error('Error cargando DataDragon:', error);
        }
    }

    public getChampName(id: number | string): string {
        if (id === 0 || id === '0') return 'Ninguno';
        return this.champions[id.toString()] || `ID Desconocido (${id})`;
    }
    
    public getChampImage(id: number | string): string {
        const name = this.getChampName(id);
        return `https://ddragon.leagueoflegends.com/cdn/${this.version}/img/champion/${name}.png`; 
    }
}

export const riotService = new RiotStaticService();