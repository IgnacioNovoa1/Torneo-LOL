import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { consultAdminAI } from '../services/aiService';

export const data = new SlashCommandBuilder()
    .setName('duda')
    .setDescription('Consulta administrativa sobre el torneo (Horarios, Premios, Reglas)')
    .addStringOption(option =>
        option.setName('pregunta')
            .setDescription('Ej: ¿Cuándo es la final? / ¿Cuáles son los premios?')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply(); 

    const question = interaction.options.getString('pregunta', true);
    const answer = await consultAdminAI(question);

    await interaction.editReply(`**Pregunta:** ${question}\n\n**Respuesta:** ${answer}`);
}