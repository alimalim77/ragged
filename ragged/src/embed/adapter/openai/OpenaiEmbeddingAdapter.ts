import { ApiClient } from "../../../support/ApiClient";
import { ParameterValidationError } from "../../../support/CustomErrors";
import { Logger } from "../../../support/logger/Logger";
import { BaseEmbeddingAdapter, EmbeddingRequest, EmbeddingResponse as Embedding } from "../../Embed.types";
import { OpenaiEmbeddingResponse } from "./OpenaiEmbeddingTypes";

type OpenaiEmbeddingAdapterConstructorParams = {
    apiKey: string;
    apiClient: ApiClient;
}

/**
 * Adapter to get embeddings from OpenAI.
 */
export class OpenaiEmbeddingAdapter implements BaseEmbeddingAdapter {
    private static logger: Logger = new Logger('OpenaiEmbeddingAdapter');
    constructor(private params: OpenaiEmbeddingAdapterConstructorParams) { }

    async embed(request: EmbeddingRequest): Promise<Embedding> {
        const response: OpenaiEmbeddingResponse = await this.params.apiClient.post('https://api.openai.com/v1/embeddings', {
            body: {
                input: request.text,
                model: request.model || "text-embedding-3-small"
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.params.apiKey}`
            }
        });

        if (response.data.length > 1) {
            OpenaiEmbeddingAdapter.logger.warn('Recived more than one embedding from OpenAI. This is not currently supported. Returning only the first one.');
        }

        const responseObj: Embedding = {
            model: response.model,
            provider: 'openai',
            embedding: response.data[0].embedding
        }


        return responseObj;
    }

    cosineSimilarity(embedding1: Embedding, embedding2: Embedding): number {
        if (embedding1.embedding.length !== embedding2.embedding.length) {
            throw new ParameterValidationError('Embeddings must be of the same length to calculate cosine similarity');
        }

        if (embedding1.model !== embedding2.model || embedding1.provider !== embedding2.provider) {
            // log a warnign if the embeddings are from different models or providers
            OpenaiEmbeddingAdapter.logger.warn('Calculating cosine similarity between embeddings from different models or providers may not be meaningful. We hope you know what you are doing.');
        }

        return OpenaiEmbeddingAdapter.cosinesim(embedding1.embedding, embedding2.embedding);
    }

    private static cosinesim(A: number[], B: number[]): number {
        let dotproduct = 0;
        let mA = 0;
        let mB = 0;

        for (let i = 0; i < A.length; i++) {
            dotproduct += A[i] * B[i];
            mA += A[i] * A[i];
            mB += B[i] * B[i];
        }

        mA = Math.sqrt(mA);
        mB = Math.sqrt(mB);
        const normProduct = mA * mB;

        /**
         * If the normProduct is 0, then the cosine similarity is 0.
         * This could happen if one of the embeddings is all zeros.
         */
        if (normProduct === 0) {
            return 0;
        }
        const similarity = dotproduct / normProduct;

        return similarity;
    }
}
