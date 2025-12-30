import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    teamA: { type: String, required: true },
    teamB: { type: String, required: true },
    winner: { type: String, default: null },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    played: { type: Boolean, default: false }
});

const tournamentSchema = new mongoose.Schema({
    season: { type: String, required: true, unique: true },
    status: { type: String, enum: ['inscripciones', 'grupos', 'eliminatorias', 'finalizado'], default: 'inscripciones' },
    groups: {
        A: [{ type: String }],
        B: [{ type: String }]
    },
    groupStandings: {
        A: [{
            team: String,
            wins: { type: Number, default: 0 },
            losses: { type: Number, default: 0 }
        }],
        B: [{
            team: String,
            wins: { type: Number, default: 0 },
            losses: { type: Number, default: 0 }
        }]
    },
    playoffs: {
        semifinals: [matchSchema],
        final: matchSchema,
        thirdPlace: matchSchema
    }
}, { timestamps: true });

export const Tournament = mongoose.model('Tournament', tournamentSchema);