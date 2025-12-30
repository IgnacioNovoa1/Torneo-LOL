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

    const blueTeamCellIds = (lcu.myTeam || []).map((p: any) => p.cellId);
    const redTeamCellIds = (lcu.theirTeam || []).map((p: any) => p.cellId);

    const active = new Map<number, any>();

    lcu.actions.flat().forEach((a: any) => {
        if (a.type === 'pick' && !a.completed) {
            const current = active.get(a.actorCellId);
            if (current && current.isInProgress && !a.isInProgress) {
                return;
            }
            active.set(a.actorCellId, a);
        }
    });

    const buildPicks = (team: any[]): DraftPick[] => {
        const picks: DraftPick[] = [];

        for (let i = 0; i < 5; i++) {
            const player = team[i] || { cellId: -1, championId: 0, championPickIntent: 0 };
            const act = active.get(player.cellId);

            let champId = 0;
            let status: DraftPick['status'] = 'none';

            if (player.championId > 0) {
                champId = player.championId;
                status = 'locked';
            } else if (act && act.championId > 0) {
                champId = act.championId;
                status = 'picking';
            } else if (player.championPickIntent > 0) {
                champId = player.championPickIntent;
                status = 'picking';
            }

            picks.push({
                cellId: player.cellId,
                championId: champId,
                championName: champId > 0 ? riotService.getChampName(champId) : '',
                championImg: champId > 0 ? riotService.getChampImage(champId) : '',
                status
            });
        }

        return picks;
    };

    const buildBans = (teamCellIds: number[]): DraftPick[] => {
        const bans: DraftPick[] = [];

        const banActions = lcu.actions
            .flat()
            .filter((a: any) =>
                a.type === 'ban' &&
                teamCellIds.includes(a.actorCellId) &&
                (a.completed || a.isInProgress)
            );

        for (let i = 0; i < 5; i++) {
            const action = banActions[i];
            const champId = (action?.championId > 0 && action?.completed) ? action.championId : 0;

            bans.push({
                cellId: action?.actorCellId || 0,
                championId: champId,
                championName: champId ? riotService.getChampName(champId) : '',
                championImg: champId ? riotService.getChampImage(champId) : '',
                status: champId ? 'locked' : 'none'
            });
        }
        return bans;
    };

    state.blueTeam.picks = buildPicks(lcu.myTeam || []);
    state.redTeam.picks = buildPicks(lcu.theirTeam || []);
    state.blueTeam.bans = buildBans(blueTeamCellIds);
    state.redTeam.bans = buildBans(redTeamCellIds);

    return state;
}