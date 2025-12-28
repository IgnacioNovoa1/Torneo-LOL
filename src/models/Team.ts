import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
    name: { type: String, required: true, unique: true },
    captainId: { type: String, required: true },
    roleId: { type: String, required: true },    
    channelCategoryId: { type: String },
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
    }
});

export const Team = model('Team', teamSchema);