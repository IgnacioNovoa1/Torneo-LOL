import { riotService } from '../services/riotService';

export interface DraftState {
    phase: string;
    timer: number;
    blueTeam: TeamDraftInfo;
    redTeam: TeamDraftInfo;
}

interface TeamDraftInfo {
    picks: DraftPick[];
    bans: DraftPick[];
}

interface DraftPick {
    cellId: number;
    championId: number;
    championName: string;
    championImg: string;
    status: 'picking' | 'locked' | 'none';
}

export function mapLcuToDraft(lcu: any): DraftState {
    const state: DraftState = {
        phase: lcu?.timer?.phase || 'UNKNOWN',
        timer: Math.floor((lcu?.timer?.adjustedTimeLeftInPhase || 0) / 1000),
        blueTeam: { picks: [], bans: [] },
        redTeam: { picks: [], bans: [] }
    };

    if (!lcu?.actions) return state;

    const active = new Map<number, any>();

    lcu.actions.flat().forEach((a: any) => {
        if (a.type === 'pick') {
            active.set(a.actorCellId, a);
        }
    });

    const buildPicks = (team: any[]): DraftPick[] =>
        team.map(player => {
            const act = active.get(player.cellId);
            const champId = act ? act.championId : player.championId;

            let status: DraftPick['status'] = 'none';

            if (act) {
                status = act.completed ? 'locked' : 'picking';
            } else if (champId !== 0) {
                status = 'locked';
            }

            return {
                cellId: player.cellId,
                championId: champId,
                championName: riotService.getChampName(champId),
                championImg: riotService.getChampImage(champId),
                status
            };
        });

    const mapBan = (id: number): DraftPick => ({
        cellId: 0,
        championId: id,
        championName: riotService.getChampName(id),
        championImg: riotService.getChampImage(id),
        status: 'locked'
    });

    state.blueTeam.picks = buildPicks(lcu.myTeam || []);
    state.redTeam.picks = buildPicks(lcu.theirTeam || []);
    state.blueTeam.bans = (lcu.bans?.myTeamBans || []).map(mapBan);
    state.redTeam.bans = (lcu.bans?.theirTeamBans || []).map(mapBan);

    return state;
}
