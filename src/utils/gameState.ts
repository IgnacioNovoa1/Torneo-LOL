export interface TournamentState {
    phase: string;
    blueTeam: {
        name: string;
        bans: string[];
        picks: string[];
    };
    redTeam: {
        name: string;
        bans: string[];
        picks: string[];
    };
    timer: number;
    lastUpdate: Date;
}

let currentState: TournamentState = {
    phase: 'Esperando',
    blueTeam: { name: 'Equipo Azul', bans: [], picks: [] },
    redTeam: { name: 'Equipo Rojo', bans: [], picks: [] },
    timer: 0,
    lastUpdate: new Date()
};

export const getGameState = () => currentState;

export const updateGameState = (newData: Partial<TournamentState>) => {
    currentState = { ...currentState, ...newData, lastUpdate: new Date() };
};