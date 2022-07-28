export const settingIndexes = {
	isEmojiEnabled: 0,
	emojiBannedChannelIds: 1,
	isHotPostEnabled: 2,
	hotPostCriteriaCount: 3,
	hotPostChannelId: 4,
	hotPostBannedChannelIds: 5
} as const;

export const SettingNames: readonly (keyof typeof settingIndexes)[] = ['isEmojiEnabled', 'emojiBannedChannelIds', 'isHotPostEnabled', 'hotPostCriteriaCount', 'hotPostChannelId', 'hotPostBannedChannelIds'];