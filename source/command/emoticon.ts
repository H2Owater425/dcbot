import { Command } from "@library/framework";

export default new Command('<디시콘|아카콘>', function (): void {
	return;
}, {
	usage: '**`순서(숫자)|이름`**',
	description: '디시콘 및 아카콘 사용\n(디시콘 1순위, 아카콘 2순위, 동일 이름 존재시 디시콘 사용)',
	guildOnly: true
});