import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('generar-playoffs')
    .setDescription('[ADMIN] Genera Playoffs instantáneamente')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: 'grupos' });
        if (!tournament) { await interaction.editReply('No hay fase de grupos activa.'); return; }

        const sortedA = tournament.groupStandings.A.sort((a, b) => b.wins - a.wins);
        const sortedB = tournament.groupStandings.B.sort((a, b) => b.wins - a.wins);

        if (sortedA.length < 2 || sortedB.length < 2) { await interaction.editReply('Faltan equipos.'); return; }

        tournament.playoffs.semifinals = [
            { teamA: sortedA[0].team, teamB: sortedB[1].team, winner: null, scoreA: 0, scoreB: 0, played: false },
            { teamA: sortedB[0].team, teamB: sortedA[1].team, winner: null, scoreA: 0, scoreB: 0, played: false }
        ];
        tournament.playoffs.final = { teamA: 'TBD', teamB: 'TBD', winner: null, scoreA: 0, scoreB: 0, played: false };
        tournament.playoffs.thirdPlace = { teamA: 'TBD', teamB: 'TBD', winner: null, scoreA: 0, scoreB: 0, played: false };
        
        tournament.status = 'eliminatorias';
        await tournament.save();
        
        const imageBuffer = await imageGenerator.generatePlayoffsImage(tournament.playoffs);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'bracket.png'});
        
        const embed = new EmbedBuilder()
            .setTitle('⚔️ PLAYOFFS COCOSCUP')
            .setColor(0xFF4757)
            .setImage('attachment://bracket.png')
            .setFooter({ text: 'Sistema Hextech v3.0 (SVG Engine)' })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error generando playoffs.');
    }
}