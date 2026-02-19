import { eq } from "drizzle-orm";
import { aiProviderSettings } from "../db/schema";
import { BaseRepository } from "./base-repository";
import type {
  AiProviderSettings,
  UpdateAiProviderSettingsInput,
} from "../../../models";

const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => typeof item === 'string');
};

const parseModels = (value: string): string[] => {
	try {
		return toStringArray(JSON.parse(value));
	} catch {
		return [];
	}
};

const toModelsJson = (value?: string[]) => JSON.stringify(Array.isArray(value) ? value : []);

const mapSettings = (row: typeof aiProviderSettings.$inferSelect): AiProviderSettings => ({
	...row,
	preconfiguredModels: parseModels(row.preconfiguredModelsJson)
});

export class AiProviderSettingsRepository extends BaseRepository {
	async getByUserId(userId: string) {
		const [result] = await this.db
			.select()
			.from(aiProviderSettings)
			.where(eq(aiProviderSettings.userId, userId))
			.limit(1);

		if (!result) {
			const [created] = await this.db.insert(aiProviderSettings).values({ userId }).returning();
			return mapSettings(created);
		}

		return mapSettings(result);
	}

	async update(userId: string, data: UpdateAiProviderSettingsInput) {
		const updatePayload = { ...data } as UpdateAiProviderSettingsInput & {
			preconfiguredModelsJson?: string;
		};

		if (data.preconfiguredModels) {
			updatePayload.preconfiguredModelsJson = toModelsJson(data.preconfiguredModels);
			delete updatePayload.preconfiguredModels;
		}

		const [result] = await this.db
			.update(aiProviderSettings)
			.set({
				...updatePayload,
				updatedAt: Math.floor(Date.now() / 1000)
			})
			.where(eq(aiProviderSettings.userId, userId))
			.returning();
		return result ? mapSettings(result) : result;
	}
}
