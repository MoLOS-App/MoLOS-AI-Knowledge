import {
	AiProvider,
	HumanizationLevel,
	HumanizationTone,
	type AiProviderSettings,
	type HumanizationLevel as HumanizationLevelType,
	type HumanizationTone as HumanizationToneType
} from '$lib/models/external_modules/MoLOS-AI-Knowledge';

const LEVEL_SETTINGS: Record<
	HumanizationLevelType,
	{ temperature: number; frequencyPenalty: number }
> = {
	[HumanizationLevel.LIGHT]: { temperature: 0.7, frequencyPenalty: 0.2 },
	[HumanizationLevel.MEDIUM]: { temperature: 1.0, frequencyPenalty: 0.5 },
	[HumanizationLevel.AGGRESSIVE]: { temperature: 1.3, frequencyPenalty: 0.8 }
};

const TONE_GUIDES: Record<HumanizationToneType, string> = {
	[HumanizationTone.CONVERSATIONAL]:
		'Use contractions, occasional sentence fragments, and light idioms. Vary openers. Avoid stiff transitions.',
	[HumanizationTone.PROFESSIONAL]:
		'Keep formal grammar while avoiding repetitive sentence starters. Be crisp and precise.',
	[HumanizationTone.CASUAL]:
		'Keep it relaxed, friendly, and direct. Sprinkle informal phrasing without slang overload.',
	[HumanizationTone.ACADEMIC]:
		'Maintain academic clarity with varied sentence lengths. Avoid robotic phrasing and template transitions.',
	[HumanizationTone.CREATIVE]:
		'Lean into vivid phrasing, occasional metaphor, and rhythmic sentence variety.'
};

const AI_ISMS = [
	'in conclusion',
	'delve into',
	'unlocking potential',
	'as mentioned earlier',
	"in today's world",
	'moreover',
	'furthermore',
	'additionally'
];

const CONNECTOR_SWAPS: Array<[RegExp, string]> = [
	[/\btherefore\b/gi, "that's why"],
	[/\bfurthermore\b/gi, 'on top of that'],
	[/\bin addition\b/gi, 'plus'],
	[/\bmoreover\b/gi, "what's more"],
	[/\badditionally\b/gi, 'also'],
	[/\bhowever\b/gi, 'but']
];

const SYNONYM_POOL: Record<string, string[]> = {
	important: ['notable', 'meaningful', 'material'],
	complex: ['knotted', 'layered', 'intricate'],
	simple: ['plain', 'clean', 'straightforward'],
	improve: ['sharpen', 'elevate', 'polish'],
	use: ['apply', 'lean on', 'put to work'],
	show: ['reveal', 'surface', 'lay out'],
	make: ['craft', 'build', 'shape'],
	help: ['support', 'steady', 'back'],
	create: ['forge', 'form', 'shape']
};

const NGRAM_BREAKERS: Array<[RegExp, string]> = [
	[/\b(in conclusion)\b/gi, 'wrapping up'],
	[/\b(it is important to note that)\b/gi, 'worth noting is'],
	[/\b(as a result of)\b/gi, 'because of'],
	[/\b(in order to)\b/gi, 'to'],
	[/\b(on the other hand)\b/gi, 'by contrast']
];

const CONTRACTION_SWAPS: Array<[RegExp, string]> = [
	[/\bdo not\b/gi, "don't"],
	[/\bdoes not\b/gi, "doesn't"],
	[/\bdid not\b/gi, "didn't"],
	[/\bcan not\b/gi, "can't"],
	[/\bwill not\b/gi, "won't"],
	[/\bshould not\b/gi, "shouldn't"],
	[/\bwould not\b/gi, "wouldn't"],
	[/\bthey are\b/gi, "they're"],
	[/\bwe are\b/gi, "we're"],
	[/\bit is\b/gi, "it's"]
];

const sentenceSplit = (text: string) =>
	text
		.replace(/\s+/g, ' ')
		.trim()
		.split(/(?<=[.!?])\s+/)
		.filter(Boolean);

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const hashSeed = (text: string) => {
	let hash = 0;
	for (let i = 0; i < text.length; i += 1) {
		hash = (hash << 5) - hash + text.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
};

const seededChoice = <T>(items: T[], seed: number) => {
	if (items.length === 0) return undefined;
	const idx = seed % items.length;
	return items[idx];
};

const swapConnectors = (text: string) =>
	CONNECTOR_SWAPS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);

const breakAiNgrams = (text: string) =>
	NGRAM_BREAKERS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);

const stripAiIsms = (text: string) =>
	AI_ISMS.reduce((acc, phrase) => acc.replace(new RegExp(phrase, 'gi'), ''), text);

const injectContractions = (text: string) =>
	CONTRACTION_SWAPS.reduce(
		(acc, [pattern, replacement]) => acc.replace(pattern, replacement),
		text
	);

const randomizeSynonyms = (text: string) => {
	const seedBase = hashSeed(text);
	return text.replace(/\b([A-Za-z]{4,})\b/g, (word, raw) => {
		const lower = raw.toLowerCase();
		const options = SYNONYM_POOL[lower];
		if (!options || options.length === 0) return word;
		const choice = seededChoice(options, seedBase + lower.length + raw.charCodeAt(0));
		if (!choice) return word;
		return raw[0] === raw[0].toUpperCase()
			? choice.charAt(0).toUpperCase() + choice.slice(1)
			: choice;
	});
};

const convertPassiveToActive = (text: string) =>
	text.replace(
		/\b(\w+)\s+(was|were|is|are|been|being|be)\s+(\w+(?:ed|en))\s+by\s+([^.!?]+)([.!?])/gi,
		(_match, object, _aux, verb, agent, punct) => {
			const cleanedAgent = agent.trim();
			const cleanedObject = object.trim();
			return `${cleanedAgent} ${verb} ${cleanedObject}${punct}`;
		}
	);

const injectBurstiness = (text: string, level: HumanizationLevelType) => {
	const sentences = sentenceSplit(text);
	if (sentences.length <= 1) return text;

	const targetShort = level === HumanizationLevel.AGGRESSIVE ? 6 : 8;
	const targetLong = level === HumanizationLevel.AGGRESSIVE ? 28 : 24;

	const output: string[] = [];
	let i = 0;
	while (i < sentences.length) {
		const current = sentences[i].trim();
		const words = current.split(/\s+/);

		if (words.length > targetLong) {
			const splitIndex = words.findIndex((w, idx) => idx > 6 && /,|;/.test(w));
			if (splitIndex > 0) {
				output.push(
					words
						.slice(0, splitIndex + 1)
						.join(' ')
						.replace(/[;,]$/, '.')
				);
				output.push(words.slice(splitIndex + 1).join(' '));
			} else {
				const mid = Math.max(6, Math.floor(words.length / 2));
				output.push(words.slice(0, mid).join(' ') + '.');
				output.push(words.slice(mid).join(' '));
			}
			i += 1;
			continue;
		}

		if (words.length < targetShort && i + 1 < sentences.length) {
			const next = sentences[i + 1].trim();
			output.push(`${current} -- ${next}`);
			i += 2;
			continue;
		}

		output.push(current);
		i += 1;
	}

	return output.join(' ');
};

const shufflePunctuation = (text: string, level: HumanizationLevelType) => {
	const seedBase = hashSeed(text);
	const intensity = level === HumanizationLevel.AGGRESSIVE ? 0.35 : 0.2;
	let idx = 0;
	return text.replace(/\./g, (match) => {
		idx += 1;
		if ((seedBase + idx) % 100 < intensity * 100) return '...';
		return match;
	});
};

const applyHeuristics = (
	text: string,
	tone: HumanizationToneType,
	level: HumanizationLevelType,
	stage: 'pre' | 'post'
) => {
	let output = text;

	if (stage === 'pre') {
		output = stripAiIsms(output);
		output = breakAiNgrams(output);
		output = swapConnectors(output);
		output = convertPassiveToActive(output);
	}

	if (tone === HumanizationTone.CONVERSATIONAL || tone === HumanizationTone.CASUAL) {
		output = injectContractions(output);
	}

	if (stage === 'post') {
		output = randomizeSynonyms(output);
		output = injectBurstiness(output, level);
		output = shufflePunctuation(output, level);
	}

	return output.replace(/\s+/g, ' ').trim();
};

const buildDeoptimizerPrompt = (
	inputText: string,
	tone: HumanizationToneType,
	level: HumanizationLevelType,
	optionsText?: string
) => {
	const guidance = TONE_GUIDES[tone];
	const optionsLine = optionsText ? `User options: ${optionsText}` : '';
	return [
		'You are a human editor. Rewrite the text to sound like a real person.',
		'Avoid AI-isms and boilerplate phrasing. No generic conclusions.',
		guidance,
		level === HumanizationLevel.AGGRESSIVE
			? 'Be bold, varied, and unpredictable in rhythm while keeping meaning intact.'
			: 'Preserve meaning while sharpening tone and flow.',
		optionsLine,
		'Output only the rewritten text.',
		'Text:',
		inputText
	].join('\n');
};

const buildBurstinessPrompt = (
	inputText: string,
	tone: HumanizationToneType,
	optionsText?: string
) => {
	const guidance = TONE_GUIDES[tone];
	const optionsLine = optionsText ? `User options: ${optionsText}` : '';
	return [
		'Rewrite the text to maximize burstiness.',
		'Mix very short, punchy sentences with longer, layered ones.',
		'Vary punctuation (commas, semicolons, dashes) and sentence openings.',
		guidance,
		optionsLine,
		'Output only the rewritten text.',
		'Text:',
		inputText
	].join('\n');
};

const buildPreservationPrompt = (originalText: string, candidateText: string) =>
	[
		'Compare the original and candidate. If facts or meaning changed, say CHANGED and list the issues.',
		'If meaning is preserved, say OK.',
		'Return a short JSON object with keys: verdict (OK or CHANGED), notes.',
		'Original:',
		originalText,
		'Candidate:',
		candidateText
	].join('\n');

const parseJsonSnippet = (text: string) => {
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) return null;
	try {
		return JSON.parse(match[0]);
	} catch {
		return null;
	}
};

const estimateBurstinessScore = (text: string) => {
	const sentences = sentenceSplit(text);
	if (sentences.length === 0) return 0;
	const lengths = sentences.map((s) => wordCount(s));
	const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
	const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
	const std = Math.sqrt(variance);
	return Math.min(1, std / 12);
};

const estimateLexicalVariety = (text: string) => {
	const words = text.toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return 0;
	const unique = new Set(words);
	return Math.min(1, unique.size / words.length + 0.1);
};

const computeConfidenceScore = (text: string, detectorScore?: number) => {
	if (detectorScore !== undefined) {
		return Math.max(0, Math.min(100, Math.round((1 - detectorScore) * 100)));
	}
	const burstiness = estimateBurstinessScore(text);
	const lexical = estimateLexicalVariety(text);
	const lengthPenalty = Math.min(1, Math.max(0.5, wordCount(text) / 200));
	return Math.max(
		50,
		Math.min(100, Math.round((burstiness * 55 + lexical * 45) * lengthPenalty * 100))
	);
};

type ProviderMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ProviderResponse = {
	message: string;
};

const buildOpenAiPayload = (
	messages: ProviderMessage[],
	settings: {
		temperature?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		topP?: number;
		maxTokens?: number;
	},
	model: string
) => ({
	model,
	messages,
	temperature: settings.temperature,
	top_p: settings.topP,
	max_tokens: settings.maxTokens,
	frequency_penalty: settings.frequencyPenalty,
	presence_penalty: settings.presencePenalty
});

const buildAnthropicPayload = (
	messages: ProviderMessage[],
	settings: { temperature?: number; topP?: number; maxTokens?: number },
	model: string,
	systemPrompt?: string
) => ({
	model,
	max_tokens: settings.maxTokens ?? 2048,
	temperature: settings.temperature,
	top_p: settings.topP,
	system: systemPrompt,
	messages: messages.filter((msg) => msg.role !== 'system')
});

const parseOpenAiResponse = (data: unknown): ProviderResponse => {
	const response = data as {
		choices?: Array<{ message?: { content?: string } }>;
	};
	const message = response.choices?.[0]?.message?.content ?? '';
	return { message };
};

const parseAnthropicResponse = (data: unknown): ProviderResponse => {
	const response = data as {
		content?: Array<{ type: string; text?: string }>;
	};
	const message = response.content?.find((item) => item.type === 'text')?.text ?? '';
	return { message };
};

const callProvider = async (
	provider: AiProvider,
	apiToken: string,
	model: string,
	messages: ProviderMessage[],
	settings: {
		temperature?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		topP?: number;
		maxTokens?: number;
	}
): Promise<ProviderResponse> => {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	let endpoint = '';
	let body: Record<string, unknown> = {};

	if (provider === AiProvider.ANTHROPIC) {
		endpoint = 'https://api.anthropic.com/v1/messages';
		headers['x-api-key'] = apiToken;
		headers['anthropic-version'] = '2023-06-01';
		body = buildAnthropicPayload(messages, settings, model, messages[0]?.content);
	} else {
		if (provider === AiProvider.OPENAI) {
			endpoint = 'https://api.openai.com/v1/chat/completions';
			headers.Authorization = `Bearer ${apiToken}`;
		} else if (provider === AiProvider.OPENROUTER) {
			endpoint = 'https://openrouter.ai/api/v1/chat/completions';
			headers.Authorization = `Bearer ${apiToken}`;
			headers['HTTP-Referer'] = 'https://molos.app';
			headers['X-Title'] = 'MoLOS';
		} else if (provider === AiProvider.XAI) {
			endpoint = 'https://api.x.ai/v1/chat/completions';
			headers.Authorization = `Bearer ${apiToken}`;
		} else {
			throw new Error('Unsupported provider');
		}
		body = buildOpenAiPayload(messages, settings, model);
	}

	const res = await fetch(endpoint, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || 'AI provider request failed');
	}

	const data = await res.json();
	return provider === AiProvider.ANTHROPIC
		? parseAnthropicResponse(data)
		: parseOpenAiResponse(data);
};

const resolveModel = (
	provider: AiProvider,
	providerSettings: AiProviderSettings | null,
	stage: 'primary' | 'secondary' | 'checker',
	preferredModel?: string
) => {
	const models = providerSettings?.preconfiguredModels ?? [];
	if (preferredModel && stage !== 'checker') {
		return preferredModel;
	}
	if (stage === 'checker') {
		return (
			models[1] ||
			(provider === AiProvider.OPENAI
				? 'gpt-4o-mini'
				: provider === AiProvider.ANTHROPIC
					? 'claude-3-haiku-20240307'
					: models[0])
		);
	}
	if (stage === 'secondary') {
		return (
			models[0] || (provider === AiProvider.ANTHROPIC ? 'claude-3-5-sonnet-20240620' : 'gpt-4o')
		);
	}
	return models[0] || (provider === AiProvider.ANTHROPIC ? 'claude-3-5-sonnet-20240620' : 'gpt-4o');
};

type DetectorResult = {
	aiProbability: number;
	provider?: string;
};

const detectAiProbability = async (text: string) => {
	const endpoint = process.env.HUMANIZER_DETECTOR_URL;
	const apiKey = process.env.HUMANIZER_DETECTOR_KEY;
	if (!endpoint || !apiKey) return undefined;

	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({ text })
	});

	if (!res.ok) return undefined;
	const data = (await res.json()) as Partial<DetectorResult>;
	if (typeof data.aiProbability !== 'number') return undefined;
	return data;
};

export type HumanizerPipelineResult = {
	outputText: string;
	confidenceScore: number;
	detectorScore?: number;
	usedFallback: boolean;
};

export const runHumanizerPipeline = async ({
	inputText,
	level,
	tone,
	providerSettings,
	model,
	optionsText,
	settings: overrideSettings
}: {
	inputText: string;
	level: HumanizationLevelType;
	tone: HumanizationToneType;
	providerSettings: AiProviderSettings | null;
	model?: string;
	optionsText?: string;
	settings?: {
		temperature?: number;
		topP?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		maxTokens?: number;
	};
}): Promise<HumanizerPipelineResult> => {
	const base = inputText.trim();
	const sanitizedOptions = optionsText?.trim().slice(0, 2000);
	const settings = LEVEL_SETTINGS[level];
	const provider = providerSettings?.provider ?? AiProvider.OPENAI;
	const apiToken = providerSettings?.apiToken ?? '';
	const canCallLlm = Boolean(apiToken.trim());

	let stage1 = applyHeuristics(base, tone, level, 'pre');
	let stage2 = stage1;
	let preservationOk = true;
	let usedFallback = !canCallLlm;

	if (canCallLlm) {
		const primaryModel = resolveModel(provider, providerSettings, 'primary', model);
		const secondaryModel = resolveModel(provider, providerSettings, 'secondary', model);

		const deoptPrompt = buildDeoptimizerPrompt(stage1, tone, level, sanitizedOptions);
		const burstPrompt = buildBurstinessPrompt(stage1, tone, sanitizedOptions);

		const baseSettings = {
			temperature: overrideSettings?.temperature ?? settings.temperature,
			topP: overrideSettings?.topP,
			frequencyPenalty: overrideSettings?.frequencyPenalty ?? settings.frequencyPenalty,
			presencePenalty: overrideSettings?.presencePenalty,
			maxTokens: overrideSettings?.maxTokens
		};

		stage1 = (
			await callProvider(
				provider,
				apiToken,
				primaryModel,
				[{ role: 'user', content: deoptPrompt }],
				baseSettings
			)
		).message.trim();

		const burstSettings = {
			...baseSettings,
			temperature:
				overrideSettings?.temperature !== undefined
					? overrideSettings.temperature
					: settings.temperature + 0.1
		};

		stage2 = (
			await callProvider(
				provider,
				apiToken,
				secondaryModel,
				[{ role: 'user', content: burstPrompt }],
				burstSettings
			)
		).message.trim();

		const checkerModel = resolveModel(provider, providerSettings, 'checker');
		const checkPrompt = buildPreservationPrompt(base, stage2);
		const checkResponse = await callProvider(
			provider,
			apiToken,
			checkerModel,
			[{ role: 'user', content: checkPrompt }],
			{
				temperature: 0.2,
				frequencyPenalty: 0,
				topP: overrideSettings?.topP,
				maxTokens: overrideSettings?.maxTokens
			}
		);
		const parsed = parseJsonSnippet(checkResponse.message);
		if (parsed?.verdict && parsed.verdict !== 'OK') {
			preservationOk = false;
		}
	}

	let candidate = preservationOk ? stage2 : stage1;
	candidate = applyHeuristics(candidate, tone, level, 'post');

	let detectorScore: number | undefined;
	const detectorResult = await detectAiProbability(candidate);
	if (detectorResult?.aiProbability !== undefined) detectorScore = detectorResult.aiProbability;

	if (detectorScore !== undefined && detectorScore > 0.2) {
		const aggressive = applyHeuristics(candidate, tone, HumanizationLevel.AGGRESSIVE, 'post');
		candidate = aggressive;
		const retry = await detectAiProbability(candidate);
		if (retry?.aiProbability !== undefined) detectorScore = retry.aiProbability;
	}

	const confidenceScore = computeConfidenceScore(candidate, detectorScore);

	return {
		outputText: candidate,
		confidenceScore,
		detectorScore,
		usedFallback
	};
};
