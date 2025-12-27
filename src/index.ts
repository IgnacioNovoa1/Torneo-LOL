import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import * as inscribirCommand from './commands/inscribir';
import { LeagueClientService } from './services/lcu';
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const leagueService = new LeagueClientService();

client.once(Events.ClientReady, c => {
    console.log(`🤖 Bot conectado como: ${c.user.tag}`);
    leagueService.start();
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'inscribir') {
        await inscribirCommand.execute(interaction);
    }
});
client.login(process.env.DISCORD_TOKEN);