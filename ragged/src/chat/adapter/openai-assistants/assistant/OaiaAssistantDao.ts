import { ApiClient } from "../../../../support/ApiClient";
import { OaiaAssistantCreateRequestBody, OaiaAssistant } from "./OaiaAssistantDaoTypes"

export class OaiaAssistantDao {
    constructor(private apiClient: ApiClient) { }

    createAssistant(apiKey: string, body: OaiaAssistantCreateRequestBody): Promise<OaiaAssistant> {
        return this.apiClient.post("https://api.openai.com/v1/assistants", {
            body: body,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "OpenAI-Beta": "assistants=v2"
            }
        });
    }
}