import mongoose, { Schema, Document } from 'mongoose';

interface IMatch {
    teamA: string;
    teamB: string;
    winner: string | null;
    scoreA: number;
    scoreB: number;
    played: boolean;
}

interface IStanding {
    team: string;
    wins: number;
    losses: number;
}

export interface ITournament extends Document {
    season: string;
    status: 'inscripciones' | 'preparacion' | 'grupos' | 'playoffs' | 'finalizado';
    groups: {
        A: string[];
        B: string[];
    };
    groupStandings: {
        A: IStanding[];
        B: IStanding[];
    };
    playoffs: {
        semifinals: IMatch[];
        final: IMatch;
    };
}

const matchSchema = new Schema({
    teamA: { type: String, required: true },
    teamB: { type: String, required: true },
    winner: { type: String, default: null },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    played: { type: Boolean, default: false }
});

const standingSchema = new Schema({
    team: { type: String, required: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
});

const tournamentSchema = new Schema({
    season: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['inscripciones', 'preparacion', 'grupos', 'playoffs', 'finalizado'], 
        default: 'inscripciones' 
    },
    groups: {
        A: [{ type: String }],
        B: [{ type: String }]
    },
    groupStandings: {
        A: [standingSchema],
        B: [standingSchema]
    },
    playoffs: {
        semifinals: [matchSchema],
        final: matchSchema
    }
}, { timestamps: true });

export const Tournament = mongoose.model<ITournament>('Tournament', tournamentSchema);