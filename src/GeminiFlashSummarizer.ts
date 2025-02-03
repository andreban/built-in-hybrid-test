import { GenerateContentRequest, GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-1.5-flash-002';
class GeminiSummarizerCapabilities implements AISummarizerCapabilities {
    readonly available: AICapabilityAvailability;

    constructor() {
        this.available = 'readily';
    }

    supportsType(_type: AISummarizerType): AICapabilityAvailability {
        return 'readily';
    }

    supportsFormat(_format: AISummarizerFormat): AICapabilityAvailability {
        return 'readily';
    }

    supportsLength(_length: AISummarizerLength): AICapabilityAvailability {
        return 'readily';
    }

    languageAvailable(_languageTag: Intl.UnicodeBCP47LocaleIdentifier): AICapabilityAvailability {
        return 'readily';
    }
}

class GeminiSummarizer extends EventTarget implements AISummarizer {
    readonly sharedContext: string;
    readonly type: AISummarizerType;
    readonly format: AISummarizerFormat;
    readonly length: AISummarizerLength;
    readonly signal?: AbortSignal;

    private gemini: GoogleGenerativeAI;
    private generativeModel: GenerativeModel;

    constructor(apiKey: string, options: AISummarizerCreateOptions = {}) {
        super();
        this.sharedContext = options.sharedContext || '';
        this.type = options.type || 'tl;dr';
        this.format = options.format || 'plain-text';
        this.length = options.length || 'medium';

        this.gemini = new GoogleGenerativeAI(apiKey);
        this.generativeModel = this.gemini.getGenerativeModel({ model: MODEL });
    }

    buildSummarizationPrompt(input: string): string {
        let prompt: string[] = [];
        switch (this.type) {
            case 'headline':
                prompt.push('You are a skilled copy editor crafting headlines to capture attention and convey the essence of the content provided in the ‘TEXT’ section.');
                break;
            default:
                prompt.push('You are a skilled assistant that accurately summarizes content provided in the \‘TEXT\’ section.');
        }
        prompt.push('\n');

        switch (this.type) {
            case 'tl;dr':
                prompt.push('Summarize the text as if explaining it to someone with a very short attention span.\n');
                break;
            case 'key-points':
                prompt.push('Extract the main points of the text and present them as a bulleted list.\n');
                break;
            case 'teaser':
                prompt.push('Craft an enticing summary that encourages the user to read the full text.\n');
                break;
            case 'headline':
                prompt.push('Generate a headline that effectively summarizes the main point of the text.\n');
                break;
            default:
                prompt.push('');
        }

        if (this.length === 'short' && this.type === 'tl;dr') {
            prompt.push('The summary must fit within one sentence.');
        } else if (this.length === 'long' && this.type === 'tl;dr') {
            prompt.push('The summary must fit within one paragraph.');
        } else if (this.length === 'short' && this.type === 'key-points') {
            prompt.push('The summary must consist of no more than 3 bullet points.');
        } else if (this.length === 'medium' && this.type === 'key-points') {
            prompt.push('The summary must consist of no more than 5 bullet points.');
        } else if (this.length === 'long' && this.type === 'key-points') {
            prompt.push('The summary must consist of no more than 7 bullet points.');
        } else if (this.length === 'short' && this.type === 'teaser') {
            prompt.push('The summary must fit within one sentence.');
        } else if (this.length === 'long' && this.type === 'teaser') {
            prompt.push('The summary must fit within one paragraph.');
        } else if (this.length === 'short' && this.type === 'headline') {
            prompt.push('The headline must be concise, using a maximum of 12 words, and capture the essence of the text.');
        } else if (this.length === 'medium' && this.type === 'headline') {
            prompt.push('The headline must be concise, using a maximum of 17 words, and capture the essence of the text.');
        } else if (this.length === 'long' && this.type === 'headline') {
            prompt.push('The headline must be detailed, using a maximum of 22 words, and comprehensively capture the key themes of the text.');
        } else {
            prompt.push('The summary must fit within one short paragraph.');
        }
        prompt.push('\n');

        switch (this.format) {
            case 'markdown':
                prompt.push('The summary must be in valid Markdown syntax.');
                break;
            case 'plain-text':
                prompt.push('The summary must not contain any formatting or markup language.');
                break;
        }

        prompt.push('TEXT:\n');
        prompt.push(input);
        return prompt.join(' ');
    }

    async summarize(input: string, options?: AISummarizerSummarizeOptions): Promise<string> {
        console.debug('Summarizing with Gemini Flash');
        const systemPrompt = this.buildSummarizationPrompt(input);
        const request: GenerateContentRequest = {
            contents: [{
                role: 'user',
                parts: [{ text: 'Please summarize.' }],
            }],
            systemInstruction: systemPrompt
        };
        const result = await this.generativeModel.generateContent(request, { signal: options?.signal });
        return result.response.text();
    }

    summarizeStreaming(input: string, options?: AISummarizerSummarizeOptions): ReadableStream {
        console.debug('Summarizing with Gemini Flash');
        const systemPrompt = this.buildSummarizationPrompt(input);
        const request: GenerateContentRequest = {
            contents: [{
                role: 'user',
                parts: [{ text: 'Please summarize.' }],
            }],
            systemInstruction: systemPrompt
        };
        const stream = new ReadableStream({
            start: async (controller) => {
                try {
                    const result = await this.generativeModel.generateContentStream(request, { signal: options?.signal });
                    for await (const chunk of result.stream) {
                        controller.enqueue(chunk.text());
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });
        return stream;
    }

    destroy(): void {
        // Do nothing.
    }
}

class GeminiSummarizerFactory {
    async create(geminiApiKey: string, options?: AISummarizerCreateOptions): Promise<AISummarizer> {
        return new GeminiSummarizer(geminiApiKey, options)
    }

    async capabilities(): Promise<AISummarizerCapabilities> {
        return GEMINI_SUMMARIZER_CAPABILITIES;
    }
}

const GEMINI_SUMMARIZER_CAPABILITIES = new GeminiSummarizerCapabilities();
const GEMINI_SUMMARIZER_FACTORY = new GeminiSummarizerFactory();

export async function create(geminiApiKey: string, options?: AISummarizerCreateOptions): Promise<AISummarizer> {
    return GEMINI_SUMMARIZER_FACTORY.create(geminiApiKey, options);
}

export async function capabilities(): Promise<AISummarizerCapabilities> {
    return GEMINI_SUMMARIZER_FACTORY.capabilities()
}
