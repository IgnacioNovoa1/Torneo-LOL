import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('generar-playoffs')
    .setDescription('[ADMIN] Genera las llaves de eliminatorias')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: 'grupos' });

        if (!tournament) {
            await interaction.editReply('No hay un torneo en fase de grupos activa.');
            return;
        }

        const sortedA = tournament.groupStandings.A.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
        const sortedB = tournament.groupStandings.B.sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        if (sortedA.length < 2 || sortedB.length < 2) {
            await interaction.editReply('Cada grupo debe tener al menos 2 equipos.');
            return;
        }

        const firstA = sortedA[0].team;
        const secondA = sortedA[1].team;
        const firstB = sortedB[0].team;
        const secondB = sortedB[1].team;

        tournament.playoffs.semifinals = [
            { teamA: firstA, teamB: secondB, winner: null, scoreA: 0, scoreB: 0, played: false },
            { teamA: firstB, teamB: secondA, winner: null, scoreA: 0, scoreB: 0, played: false }
        ];

        tournament.playoffs.final = { teamA: 'TBD', teamB: 'TBD', winner: null, scoreA: 0, scoreB: 0, played: false };
        tournament.playoffs.thirdPlace = { teamA: 'TBD', teamB: 'TBD', winner: null, scoreA: 0, scoreB: 0, played: false };

        tournament.status = 'eliminatorias';
        await tournament.save();
        
        const imageBuffer = await imageGenerator.generatePlayoffsImage({
            semifinals: tournament.playoffs.semifinals,
            final: tournament.playoffs.final,
            thirdPlace: tournament.playoffs.thirdPlace
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'playoffs.png'});
        
        const embed = new EmbedBuilder()
            .setTitle('⚔️ FASE ELIMINATORIA')
            .setColor(0xFF4757)
            .setImage('attachment://playoffs.png')
            .setFooter({ text: 'CocosCup Oficial' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error al generar playoffs.');
    }
}