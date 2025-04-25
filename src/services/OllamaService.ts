import { App, requestUrl } from "obsidian";
import { AIService, AIServiceConfig, ChatMessage } from "./AiService";

export interface OllamaMessage {
  role: string;
  content: string;
}

export interface OllamaRequestPayload {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
}

export interface OllamaResponseChunk {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
}

export class OllamaService implements AIService {
  private app: App;
  private baseUrl: string = "http://localhost:11434";
  private config: AIServiceConfig = {
    model: "gemma3:1b",
    systemCommands: [
      "You are a helpful assistant for Obsidian users.",
      "Keep your responses concise and focused on the user's query.",
    ],
  };

  constructor(app: App) {
    this.app = app;
  }

  configure(config: AIServiceConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      // Start with system messages
      const allMessages: OllamaMessage[] = [];

      // Add system commands first
      if (this.config.systemCommands && this.config.systemCommands.length > 0) {
        for (const command of this.config.systemCommands) {
          allMessages.push({
            role: "system",
            content: command,
          });
        }
        console.log(`Added ${this.config.systemCommands.length} system commands to messages`);
      }

      // Then add the user/assistant messages
      for (const msg of messages) {
        allMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // Create the payload
      const payload: OllamaRequestPayload = {
        model: this.config.model || "gemma3:1b",
        messages: allMessages,
        stream: false,
      };

      console.log("Sending request to Ollama:", `${this.baseUrl}/api/chat`, payload);

      // Make the request to Ollama
      const response = await requestUrl({
        url: `${this.baseUrl}/api/chat`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response from Ollama:", response.json);

      // Parse the response
      if (response.json && response.json.message && response.json.message.content) {
        return response.json.message.content;
      } else {
        console.error("Invalid response format from Ollama:", response.json);
        return "Sorry, I received an unexpected response format from Ollama.";
      }
    } catch (error) {
      console.error("Error calling Ollama API:", error);
      return `Sorry, I encountered an error while trying to generate a response: ${error.message}. Please ensure Ollama is running locally and the model '${this.config.model}' is available.`;
    }
  }
}
