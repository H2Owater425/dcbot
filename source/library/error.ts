class ChannelError extends Error {
	public channelId: string;

	constructor(channelId: string, message?: string) {
		super(message);

		this['channelId'] = channelId;
	}
}

export class InvalidUsage extends ChannelError {};

export class InternalError extends ChannelError {};