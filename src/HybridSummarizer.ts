import * as GeminiFlashSummarizer from './GeminiFlashSummarizer';

class HybridSummarizer extends EventTarget implements AISummarizer {
    readonly sharedContext: string;
    readonly type: AISummarizerType;
    readonly format: AISummarizerFormat;
    readonly length: AISummarizerLength;

    private geminiSummarizer: AISummarizer;
    private builtinSummarizer?: AISummarizer;
    private summarizer: AISummarizer;

    constructor(options: AISummarizerCreateOptions = {}, geminiSummarizer: AISummarizer, builtinSummarizer?: AISummarizer) {
        super();
        this.sharedContext = options.sharedContext || '';
        this.type = options.type || 'tl;dr';
        this.format = options.format || 'plain-text';
        this.length = options.length || 'medium';
        this.geminiSummarizer = geminiSummarizer;
        this.builtinSummarizer = builtinSummarizer;
        this.summarizer = builtinSummarizer || geminiSummarizer;
    }

    summarize(input: string, options?: AISummarizerSummarizeOptions): Promise<string> {
        return this.summarizer.summarize(input, options);
    }

    summarizeStreaming(input: string, options?: AISummarizerSummarizeOptions): ReadableStream<string> {
        return this.summarizer.summarizeStreaming(input, options);
    }

    destroy(): void {
        this.builtinSummarizer?.destroy();
        this.geminiSummarizer.destroy();
    }
}

class HybridSummarizerFactory {
    async create(geminiAPIKey: string, options?: AISummarizerCreateOptions): Promise<AISummarizer> {
        const geminiSummarizer = await GeminiFlashSummarizer.create(geminiAPIKey, options);
        let builtInSummarizer: AISummarizer | undefined;

        if (self.ai && self.ai.summarizer) {
            const builtInCapabilities = await self.ai.summarizer.capabilities();
            console.log('Built-in capabilities:', builtInCapabilities);
            if (builtInCapabilities.available === 'readily') {
                builtInSummarizer = await self.ai.summarizer.create(options);
            }
        }

        return new HybridSummarizer(options, geminiSummarizer, builtInSummarizer);
    }
    async capabilities(): Promise<AISummarizerCapabilities> {
        return GeminiFlashSummarizer.capabilities();
    }
}

const HYBRID_SUMMARIZER_FACTORY = new HybridSummarizerFactory();

export async function create(geminiApiKey: string, options?: AISummarizerCreateOptions): Promise<AISummarizer> {
    return HYBRID_SUMMARIZER_FACTORY.create(geminiApiKey, options);
}

export async function capabilities(): Promise<AISummarizerCapabilities> {
    return HYBRID_SUMMARIZER_FACTORY.capabilities();
}
