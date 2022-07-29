import { PossiblyUncachedMessage } from "eris";

export class ReplyableError extends Error {
	public discordMessage: PossiblyUncachedMessage;

	constructor(discordMessage: ReplyableError['discordMessage'], message?: string) {
		super(message);

		this['discordMessage'] = discordMessage;
	}
}