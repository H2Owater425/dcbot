export const enum SettingIndexes {
	isEmojiEnabled = 0,
	emojiBannedChannelIds = 1,
	isHotPostEnabled = 2,
	hotPostCriteriaCount = 3,
	hotPostChannelId = 4,
	hotPostBannedChannelIds = 5
};

export const SettingNames = ['isEmojiEnabled', 'emojiBannedChannelIds', 'isHotPostEnabled', 'hotPostCriteriaCount', 'hotPostChannelId', 'hotPostBannedChannelIds'] as const;