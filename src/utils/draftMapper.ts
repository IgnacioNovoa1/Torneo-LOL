import { riotService } from '../services/riotService';

export interface DraftState {
    phase: string;
    blueTeam: TeamDraftInfo;
    redTeam: TeamDraftInfo;
    timer: number;
}

interface TeamDraftInfo {
    bans: DraftPick[];
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
    draftState.timer = (lcuData.timer?.adjustedTimeLeftInPhase || 0) / 1000; 
    const activeActionsMap = new Map();
    for (const actionRow of lcuData.actions) {
        for (const action of actionRow) {
            if (action.isInProgress) {
                activeActionsMap.set(action.actorCellId, action);
            } else if (action.completed && !activeActionsMap.has(action.actorCellId)) {
                activeActionsMap.set(action.actorCellId, action);
            }
        }
    }

    const processTeam = (teamArray: any[]) => {
        return teamArray.map(player => {
            const cellId = player.cellId;
            let champId = player.championId;
            let status: 'picking' | 'locked' | 'none' = 'locked';

            const action = activeActionsMap.get(cellId);

            if (action) {
                if (action.championId !== 0) {
                    champId = action.championId;
                }
                status = action.completed ? 'locked' : 'picking';
                
                if (action.type === 'ban') {
                    status = 'none'; 
                    if (!action.completed) champId = 0; 
                }
            }

            if (champId === 0) status = 'none';

            return {
                cellId: cellId,
                championId: champId,
                championName: riotService.getChampName(champId),
                championImg: riotService.getChampImage(champId),
                status: status
            };
        });
    };

    draftState.blueTeam.picks = processTeam(lcuData.myTeam || []);
    draftState.redTeam.picks = processTeam(lcuData.theirTeam || []);

    const mapBan = (id: number) => ({
        cellId: 0,
        championId: id,
        championName: riotService.getChampName(id),
        championImg: riotService.getChampImage(id),
        status: 'locked' as const
    });

    draftState.blueTeam.bans = (lcuData.bans?.myTeamBans || []).map(mapBan);
    draftState.redTeam.bans = (lcuData.bans?.theirTeamBans || []).map(mapBan);

    return draftState;
}