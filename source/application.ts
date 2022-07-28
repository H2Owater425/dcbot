import '@library/environment';
import { Client } from '@library/framework';
import { join } from 'path';

export const client: Client = new Client(process['env']['TOKEN'], {
	intents: ['guilds', 'guildEmojisAndStickers', 'guildMessages', 'guildMessageReactions'],
	prefix: process['env']['PREFIX'],
	defaultHelpCommand: true,
	restMode: true
});

client.loadCommand(join(__dirname, 'command'));

client.loadEvent(join(__dirname, 'event'));

client.connect();

// TODO: I think we can just remove id from tabel