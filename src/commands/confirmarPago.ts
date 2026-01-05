import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Team } from '../models/Team';

export const data = new SlashCommandBuilder()
    .setName('confirmar-pago')
    .setDescription('[ADMIN] Confirma el pago de inscripción de un equipo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
        option.setName('equipo')
            .setDescription('Nombre exacto del equipo')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    console.log('=== INICIO COMANDO CONFIRMAR-PAGO ===');
    console.log('Usuario:', interaction.user.tag);
    console.log('Servidor:', interaction.guild?.name);
    
    try {
        console.log('1. Haciendo defer...');
        await interaction.deferReply();
        console.log('✓ Defer completado');
        
        const teamName = interaction.options.getString('equipo', true);
        console.log('2. Nombre de equipo recibido:', teamName);

        console.log('3. Buscando equipo en BD...');
        const team = await Team.findOne({ name: teamName });
        console.log('✓ Búsqueda completada. Equipo encontrado:', team ? 'SÍ' : 'NO');

        if (!team) {
            console.log('4. Equipo NO encontrado. Enviando respuesta...');
            await interaction.editReply(`No encontré el equipo "${teamName}".`);
            console.log('✓ Respuesta enviada');
            return;
        }

        console.log('4. Equipo encontrado:', team.name);
        console.log('   - Capitán:', team.captainName);
        console.log('   - Pagado:', team.paid);

        if (team.paid) {
            console.log('5. Equipo ya estaba pagado. Enviando respuesta...');
            await interaction.editReply(`El equipo **${team.name}** ya estaba marcado como pagado.`);
            console.log('✓ Respuesta enviada');
            return;
        }

        console.log('5. Marcando equipo como pagado...');
        team.paid = true;
        await team.save();
        console.log('✓ Equipo guardado en BD');

        console.log('6. Enviando confirmación...');
        await interaction.editReply(`**¡PAGO CONFIRMADO!**\nEl equipo **${team.name}** ahora está oficialmente inscrito en el torneo.`);
        console.log('✓ Confirmación enviada');
        console.log('=== FIN EXITOSO ===');

    } catch (error) {
        console.error('❌ ERROR CAPTURADO:');
        console.error('Tipo:', error instanceof Error ? error.name : typeof error);
        console.error('Mensaje:', error instanceof Error ? error.message : error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No disponible');
        
        try {
            console.log('Intentando enviar mensaje de error...');
            await interaction.editReply('Error al confirmar pago.');
            console.log('✓ Mensaje de error enviado');
        } catch (replyError) {
            console.error('❌ NO SE PUDO ENVIAR MENSAJE DE ERROR:');
            console.error(replyError);
        }
    }
}