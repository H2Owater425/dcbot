import '@library/environment';
import { Client } from '@library/framework';
import { join } from 'path';
import { ClientOptions } from 'eris';

export const client: Client = new Client(process['env']['TOKEN'], Object.assign({
	intents: ['guilds', 'guildEmojisAndStickers', 'guildMessages', 'guildMessageReactions'],
	prefix: process['env']['PREFIX'],
	defaultHelpCommand: true
}, typeof(process['env']['MAXIMUM_SHARD']) === 'string' && /^[1-9][0-9]*$/.test(process['env']['MAXIMUM_SHARD']) ? { maxShards: Number.parseInt(process['env']['MAXIMUM_SHARD'], 10) } : undefined) as ClientOptions);

client.loadCommand(join(__dirname, 'command'));

client.loadEvent(join(__dirname, 'event'));

client.connect();