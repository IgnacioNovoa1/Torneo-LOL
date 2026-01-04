import mongoose from 'mongoose';
import { Team } from '../models/Team';
import { Tournament } from '../models/Tournament';
import dotenv from 'dotenv';

dotenv.config();

async function resetDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Conectado a MongoDB\n');

        const teams = await Team.countDocuments();
        const tournaments = await Tournament.countDocuments();

        console.log(`Datos actuales:`);
        console.log(`  - Equipos: ${teams}`);
        console.log(`  - Torneos: ${tournaments}\n`);

        console.log('Eliminando datos...');
        
        await Team.deleteMany({});
        await Tournament.deleteMany({});

        console.log('Base de datos limpiada\n');
        console.log('NOTA: Los roles y canales en Discord NO fueron eliminados.');
        console.log('Usa el script completo si quieres limpiar Discord también.\n');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

resetDB();