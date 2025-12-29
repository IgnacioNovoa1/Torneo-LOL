import { riotService } from '../services/riotService'; // Asegúrate de tener este servicio configurado

export interface DraftState {
    phase: string;
    blueTeam: TeamDraftInfo;
    redTeam: TeamDraftInfo;
    timer: number;
}

interface TeamDraftInfo {
    bans: any[];
    picks: DraftPick[];
}

interface DraftPick {
    cellId: number;
    championId: number;
    championName: string;
    championImg: string;
    status: 'picking' | 'locked' | 'none';
}

export function mapLcuToDraft(lcuData: any): DraftState {
    const draftState: DraftState = {
        phase: 'WAITING',
        timer: 0,
        blueTeam: { bans: [], picks: [] },
        redTeam: { bans: [], picks: [] }
    };

    if (!lcuData || !lcuData.actions) return draftState;

    draftState.phase = lcuData.timer?.phase || 'UNKNOWN';
    draftState.timer = lcuData.timer?.adjustedTimeLeftInPhase || 0;
    draftState.blueTeam.bans = lcuData.bans?.myTeamBans || [];
    draftState.redTeam.bans = lcuData.bans?.theirTeamBans || [];

    const myTeam = lcuData.myTeam || [];
    const theirTeam = lcuData.theirTeam || [];
    const mapPlayerToPick = (player: any): DraftPick => {
        const champId = player.championId || 0;
        return {
            cellId: player.cellId,
            championId: champId,
            championName: riotService.getChampName(champId),
            championImg: riotService.getChampImage(champId),
            status: champId === 0 ? 'picking' : 'locked'
        };
    };

    draftState.blueTeam.picks = myTeam.map(mapPlayerToPick);
    draftState.redTeam.picks = theirTeam.map(mapPlayerToPick);

    return draftState;
}