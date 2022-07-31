export const enum SettingIndexes {
	isEmoticonEnabled = 0,
	emoticonBannedChannelIds = 1,
	isHotPostEnabled = 2,
	hotPostCriteriaCount = 3,
	hotPostChannelId = 4,
	hotPostBannedChannelIds = 5
};

export const SettingNames = ['isEmoticonEnabled', 'emoticonBannedChannelIds', 'isHotPostEnabled', 'hotPostCriteriaCount', 'hotPostChannelId', 'hotPostBannedChannelIds'] as const;

export const pageSize: number = 3 as const;