import { Command } from "@library/framework";

export default new Command('<디스코드_이모지>', function (): void {
	return;
}, {
	description: '디스코드 이모지 사용\n(기본 이모지, 서버 이모지 모두 가능)',
	guildOnly: true
});