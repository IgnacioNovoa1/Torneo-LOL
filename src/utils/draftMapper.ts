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

            if (act) status = act.completed ? 'locked' : 'picking';
            else if (champId > 0) status = 'locked';

            return {
                cellId: player.cellId,
                championId: champId > 0 ? champId : 0,
                championName: champId > 0 ? riotService.getChampName(champId) : '',
                championImg: champId > 0 ? riotService.getChampImage(champId) : '',
                status
            };
        });

    const normalizeBans = (bans: any[]): DraftPick[] => {
        const result: DraftPick[] = [];

        for (let i = 0; i < 5; i++) {
            const id = bans?.[i];
            const champId = typeof id === 'number' && id > 0 ? id : 0;

            result.push({
                cellId: 0,
                championId: champId,
                championName: champId ? riotService.getChampName(champId) : '',
                championImg: champId ? riotService.getChampImage(champId) : '',
                status: champId ? 'locked' : 'none'
            });
        }

        return result;
    };

    state.blueTeam.picks = buildPicks(lcu.myTeam || []);
    state.redTeam.picks = buildPicks(lcu.theirTeam || []);
    state.blueTeam.bans = normalizeBans(lcu.bans?.myTeamBans || []);
    state.redTeam.bans = normalizeBans(lcu.bans?.theirTeamBans || []);

    return state;
}
