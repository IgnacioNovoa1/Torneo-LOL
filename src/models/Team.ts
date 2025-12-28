import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
    name: string;
    captainId: string;     
    captainName: string;   
    roleId: string;        
    categoryId: string;    
    createdAt: Date;
    stats: {
        wins: number;
        losses: number;
        points: number;
    };
}

const teamSchema = new Schema<ITeam>({
    name: { type: String, required: true, unique: true }, 
    captainId: { type: String, required: true },
    captainName: { type: String, required: true },
    roleId: { type: String, required: true },
    categoryId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
    }
});

export const Team = model<ITeam>('Team', teamSchema);