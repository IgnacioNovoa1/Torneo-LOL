import { riotService } from '../services/riotService';

export interface DraftState {
    phase: string;
    timeLeft: number;
    blueTeam: TeamState;
    redTeam: TeamState;
}

interface TeamState {
    picks: DraftAction[];
    bans: DraftAction[];
}

interface DraftAction {
    championId: number;
    championName: string;
    championImg: string; 
    isActive: boolean;   
}

export function mapLcuToDraft(lcuData: any): DraftState {
    if (!lcuData || !lcuData.myTeam) return null as any;

    const mapActions = (actions: any[]) => {
        return []; 
    };

    const enrich = (id: number) => ({
        championId: id,
        championName: riotService.getChampName(id),
        championImg: riotService.getChampImage(id),
        isActive: false
    });

    return {
        phase: lcuData.timer?.phase || 'UNKNOWN',
        timeLeft: lcuData.timer?.adjustedTimeLeftInPhase || 0,
        blueTeam: { picks: [], bans: [] }, 
        redTeam: { picks: [], bans: [] }
    };
}