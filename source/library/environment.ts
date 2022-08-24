import 'dotenv/config';

export const REQUIRED_ENVIRONMENT_VARIABLE_NAMES = ['TOKEN', 'PREFIX', 'DATABASE_URL', 'EMBED_COLOR'] as const;

for(let i = 0; i < REQUIRED_ENVIRONMENT_VARIABLE_NAMES['length']; i++) {
	if(typeof(process['env'][REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i]]) === 'undefined') {
		throw new Error('Unconfigured environment variable(' + REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i] + ')');
	} else if((process['env'][REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i]].charCodeAt(0) & process['env'][REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i]].charCodeAt(process['env'][REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i]]['length'] - 1)) === 34) {
		process['env'][REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i]] = process['env'][REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i]].slice(1, -1);
	}
}

process['env']['TZ'] = 'UTC';