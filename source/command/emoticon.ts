import { Command } from "@library/framework";

export default new Command('<emoticon>', function (): void {
	return;
}, {
	usage: '<index | name>',
	guildOnly: true
});