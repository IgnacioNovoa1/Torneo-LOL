import mongoose, { Schema, Document } from 'mongoose';

export interface IMember {
    id: string;
    name: string;
    role: string;
}

export interface ITeam extends Document {
    name: string;
    captainId: string;
    captainName: string;
    roleId: string;
    categoryId: string;
    paid: boolean;
    members: IMember[];
    stats: {
        wins: number;
        losses: number;
    };
    active: boolean;
}

const teamSchema = new Schema({
    name: { type: String, required: true, unique: true },
    captainId: { type: String, required: true },
    captainName: { type: String, required: true },
    roleId: { type: String, required: true },
    categoryId: { type: String, required: true },
    paid: { type: Boolean, default: false },
    members: [{
        id: String,
        name: String,
        role: String
    }],
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }
    },
    active: { type: Boolean, default: true }
}, { timestamps: true });

export const Team = mongoose.model<ITeam>('Team', teamSchema);