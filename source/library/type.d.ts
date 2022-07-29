import { REQUIRED_ENVIRONMENT_VARIABLE_NAMES } from '@library/environment';
import { Client as _Client } from '@library/framework';
import { ClientEvents } from 'eris';
import { IncomingHttpHeaders } from 'http';

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Record<typeof REQUIRED_ENVIRONMENT_VARIABLE_NAMES[number], string> {
			NODE_ENV: 'development' | 'production';
		}
	}
}

export type ResolveFunction<T = void> = (value: T | PromiseLike<T>) => void;

export type RejectFunction = (reason?: any) => void;

export type EventHandler<K extends keyof ClientEvents> = (..._arguments: ClientEvents[K]) => void;

export interface DcinsideEmoticon {
	title: string;
	index: number;
	images: { sort: string, title: string, path: string, extension: 'png' | 'gif' }[];
}

export interface Response {
	buffer: Buffer;
	header: IncomingHttpHeaders;
}