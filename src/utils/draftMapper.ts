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
        if (a.type === 'pick') {
            active.set(a.actorCellId, a);
        }
    });

    const buildPicks = (team: any[]): DraftPick[] =>
        team.map(player => {
            const act = active.get(player.cellId);
            let champId = 0;
            let status: DraftPick['status'] = 'none';

            if (act) {
                champId = act.championId > 0 ? act.championId : 0;
                status = act.completed ? 'locked' : (champId > 0 ? 'picking' : 'none');
            } else if (player.championId > 0) {
                champId = player.championId;
                status = 'locked';
            } else if (player.championPickIntent > 0) {
                champId = player.championPickIntent;
                status = 'picking';
            }

            return {
                cellId: player.cellId,
                championId: champId,
                championName: champId > 0 ? riotService.getChampName(champId) : '',
                championImg: champId > 0 ? riotService.getChampImage(champId) : '',
                status
            };
        });

    const buildBans = (teamCellIds: number[]): DraftPick[] => {
        const bans: DraftPick[] = [];
        const banActions = lcu.actions
            .flat()
            .filter((a: any) =>
                a.type === 'ban' &&
                teamCellIds.includes(a.actorCellId)
            )
            .sort((a: any, b: any) => a.id - b.id);

        console.log('Bans encontrados para equipo:', banActions);

        for (let i = 0; i < 5; i++) {
            const action = banActions[i];
            const champId = action?.championId > 0 && action?.completed ? action.championId : 0;
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

    console.log('BLUE BANS:', state.blueTeam.bans);
    console.log('RED BANS:', state.redTeam.bans);

    return state;
}