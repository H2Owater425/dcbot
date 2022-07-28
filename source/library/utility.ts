import { ClientRequest, IncomingMessage } from "http";
import { request } from "https";
import logger from "./logger";

export function isValidName(name: string, options: { length?: number; } = {}): boolean {
	if(typeof(options['length']) !== 'number') {
		options['length'] = Infinity;
	}

	if(name['length'] <= options['length']) {
		let nameLength: number = 0;

		for(let i: number = 0; i < name['length']; i++) {
			const currentCharacterCode: number = name.charCodeAt(i);
			
			if(12593 <= currentCharacterCode && currentCharacterCode <= 55203) {
				nameLength += 2;
			} else if(currentCharacterCode === 33 || 42 <= currentCharacterCode && currentCharacterCode <= 43 || 48 <= currentCharacterCode && currentCharacterCode <= 57 || 65 <= currentCharacterCode && currentCharacterCode <= 90 || 97 <= currentCharacterCode && currentCharacterCode <= 122) {
				nameLength++;
			} else {
				nameLength = 0;

				break;
			}
		}

		if(1 <= nameLength && nameLength <= (options as Required<typeof options>)['length']) {
			return true;
		}
	}

	return false;
}

export function fetchBuffer(url: string, options: {
	header?: Record<string, string>;
	body?: any;
} = {}): Promise<Buffer> {
	return new Promise<Buffer>(function (resolve: (value: Buffer) => void, reject: (reason?: any) => void): void {
		const _url: URL = new URL(url);

		const clientRequest: ClientRequest = request({
			hostname: _url['hostname'],
			path: _url['pathname'],
			method: 'GET',
			port: 443,
			headers: options['header']
		}, function (response: IncomingMessage): void {
			const buffers: Buffer[] = [];
			let bufferLength: number = 0;

			if(response['statusCode'] === 200) {
				response.on('data', function (chunk: any): void {
					buffers.push(chunk);
					bufferLength += chunk['byteLength'];

					return;
				})
				.on('error', reject)
				.on('end', function (): void {
					resolve(Buffer.concat(buffers, bufferLength));

					return;
				});
			} else {
				reject(new Error('Invalid response status code'));
			}

			return;
		});

		if(typeof(options['body']) !== 'undefined') {
			clientRequest.write(options['body']);
		}

		clientRequest.end();

		return;
	});
}

export function getEmojiCodepoint(input: string): string {
	if(input['length'] === 1) {
			return input.charCodeAt(0).toString();
	} else if(input['length'] > 1) {
			const codepoints: string[] = [];

			for (let i: number = 0; i < input['length']; i++) {
					if(input.charCodeAt(i) >= 2048 && input.charCodeAt(i) <= 56319) {
							if(input.charCodeAt(i + 1) >= 56320 && input.charCodeAt(i + 1) <= 57343) {
									codepoints.push(((input.charCodeAt(i) - 2048) * 1024 + (input.charCodeAt(i + 1) - 56320) + 65536).toString(16));
							}
					} else if(input.charCodeAt(i) < 2048 || input.charCodeAt(i) > 57343) {
							codepoints.push(input.charCodeAt(i).toString(16));
					}
			}

			return codepoints.join('-');
	} else {
		logger.error(input);
	
		return 'error';
	}
}

/*
TODO: Refactor legacy code
export function getDcConInformation(name: string): Promise<DcConInformation> {
	return new Promise<DcConInformation>(function (resolve: (value: DcConInformation | PromiseLike<DcConInformation>) => void, reject: (reason?: any) => void): void {
		fetch(`https://dccon.dcinside.com/hot/1/title/${encodeURIComponent(name)}`)
		.then(function (value: Response): void {
			value.text().then(function (_value: string): void {
				let packageIndex: number = NaN;

				let slicedNameList: string[] = [name];

				for(let i: number = name.length - 1; i > 8; i--) {
					slicedNameList.push(name.slice(0, i));
				}

				_value.split('package_idx='').forEach(function (__value: string, index: number, array: string[]): void {
					if(index !== 0 && slicedNameList.includes(__value.split('dcon_name'>')[1].split('<')[0].match(/[A-z0-9ㄱ-ㅎㅏ-ㅣ가-힣*^!~+\s]+/g)?.join('') || '')) {
						packageIndex = Number(__value.split(''')[0]);
					}
				});

				if(!Number.isNaN(packageIndex)) {
					let cookie: string = '';

					value['headers'].forEach(function (__value: string, _name: string): void {
						if(name === 'set-cookie') {
							cookie = `PHPSESSID=${__value.split('PHPSESSID=')[1].split(';')[0]}; ci_c=${__value.split('ci_c=')[1].split(';')[0]}`;
						}

						return;
					});

					fetch('https://dccon.dcinside.com/index/package_detail', {
						method: 'POST',
						headers: {
							Cookie: cookie,
							'Content-Type': 'application/x-www-form-urlencoded',
							'X-Requested-With': 'XMLHttpRequest'
						},
						body: `package_idx=${packageIndex}`
					})
					.then(function (__value: Response): void {
						__value.json().then(function (___value: LooseObject): void {
							let dcConInformation: DcConInformation = {
								title: ___value['info']['title'],
								index: ___value['info']['package_idx'],
								imageCount: ___value['info']['icon_cnt'],
								imageList: []
							};

							for(let i: number = 0; i < ___value['info']['icon_cnt']; i++) {
								dcConInformation['imageList'].push({
									title: ___value['detail'][i]['title'],
									path: ___value['detail'][i]['path'],
									extension: ___value['detail'][i]['ext']
								});
							}

							resolve(dcConInformation);

							return;
						})
						.catch((error: any) => {reject('CONVERSION_ERROR'); console.log(error)});

						return;
					})
					.catch((error: any) => reject('API_ERROR'));

					return;
				} else {
					reject('NAME_ERROR');

					return;
				}
			})
			.catch((error: any) => {reject('CONVERSION_ERROR'); console.log(error)});

			return;
		})
		.catch((error: any) => reject('API_ERROR'));

		return;
	});
*/