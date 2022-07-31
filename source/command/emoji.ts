import { Command } from "@library/framework";

export default new Command('<emoji>', function (): void {
	return;
}, {
	guildOnly: true
});