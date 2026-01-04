import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('generar-grupos')
    .setDescription('[ADMIN] Genera grupos instantáneamente')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const teams = await Team.find({ active: true });

        if (teams.length < 4) {
            await interaction.editReply('Se necesitan al menos 4 equipos.');
            return;
        }
        if (teams.length % 4 !== 0) {
            await interaction.editReply(`Equipos: ${teams.length}. Deben ser múltiplo de 4.`);
            return;
        }

        const shuffled = teams.sort(() => Math.random() - 0.5);
        const teamsPerGroup = teams.length / 2;
        const groupA = shuffled.slice(0, teamsPerGroup).map(t => t.name);
        const groupB = shuffled.slice(teamsPerGroup).map(t => t.name);

        let tournament = await Tournament.findOne({ status: { $in: ['inscripciones', 'grupos'] } });
        if (!tournament) {
            tournament = new Tournament({ season: 'Season 1', status: 'grupos', groups: { A: [], B: [] }, groupStandings: { A: [], B: [] } });
        }
        
        tournament.groups = { A: groupA, B: groupB };
        tournament.groupStandings = {
            A: groupA.map(team => ({ team, wins: 0, losses: 0 })),
            B: groupB.map(team => ({ team, wins: 0, losses: 0 }))
        };
        tournament.status = 'grupos';
        await tournament.save();

        const imageBuffer = await imageGenerator.generateGroupsImage({
            A: tournament.groupStandings.A,
            B: tournament.groupStandings.B
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'grupos.png'});
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 GRUPOS OFICIALES')
            .setColor(0x00D4FF)
            .setImage('attachment://grupos.png')
            .setFooter({ text: '' })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error generando grupos.');
    }
}