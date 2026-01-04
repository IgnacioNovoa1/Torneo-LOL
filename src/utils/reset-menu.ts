import mongoose from 'mongoose';
import { Team } from '../models/Team';
import { Tournament } from '../models/Tournament';
import dotenv from 'dotenv';

dotenv.config();

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

async function resetMenu() {
    await mongoose.connect(process.env.MONGO_URI || '');
    
    console.log('\nMENÚ DE RESET\n');
    console.log('1. Solo equipos (mantiene torneos)');
    console.log('2. Solo torneos (mantiene equipos)');
    console.log('3. Todo (equipos + torneos)');
    console.log('4. Cancelar\n');

    readline.question('Selecciona una opción (1-4): ', async (answer: string) => {
        try {
            switch(answer) {
                case '1':
                    await Team.deleteMany({});
                    console.log('Equipos eliminados');
                    break;
                case '2':
                    await Tournament.deleteMany({});
                    console.log('Torneos eliminados');
                    break;
                case '3':
                    await Team.deleteMany({});
                    await Tournament.deleteMany({});
                    console.log('Todo eliminado');
                    break;
                case '4':
                    console.log('Cancelado');
                    break;
                default:
                    console.log('Opción inválida');
            }
        } catch (error) {
            console.error('Error:', error);
        }
        
        mongoose.connection.close();
        readline.close();
    });
}

resetMenu();