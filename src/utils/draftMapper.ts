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

    const allActions = lcuData.actions.flat();

    const processTeam = (teamArray: any[]) => {
        return teamArray.map(player => {
            let champId = player.championId;
            let status: 'picking' | 'locked' | 'none' = 'locked';

            if (champId === 0) {
                const activeAction = allActions.find((a: any) => a.actorCellId === player.cellId);
                if (activeAction && activeAction.championId !== 0) {
                    champId = activeAction.championId;
                    status = activeAction.completed ? 'locked' : 'picking';
                } else {
                    status = 'none';
                }
            }

            return {
                championId: champId,
                championName: riotService.getChampName(champId),
                championImg: riotService.getChampImage(champId),
                status: status
            };
        });
    };

    draftState.blueTeam.picks = processTeam(lcuData.myTeam || []);
    draftState.redTeam.picks = processTeam(lcuData.theirTeam || []);
    const processBans = (banIds: number[]) => {
        return banIds.map(id => ({
            championId: id,
            championName: riotService.getChampName(id),
            championImg: riotService.getChampImage(id),
            status: 'locked' as const
        }));
    };

    draftState.blueTeam.bans = processBans(lcuData.bans?.myTeamBans || []);
    draftState.redTeam.bans = processBans(lcuData.bans?.theirTeamBans || []);

    return draftState;
}