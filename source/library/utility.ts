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