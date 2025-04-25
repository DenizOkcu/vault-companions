import { App } from "obsidian";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIServiceConfig {
  systemCommands?: string[];
  model?: string;
}

export interface AIService {
  /**
   * Generate a response to the given messages
   */
  generateResponse(messages: ChatMessage[]): Promise<string>;

  /**
   * Set configuration for the AI service
   */
  configure(config: AIServiceConfig): void;

  /**
   * Get the current service configuration
   */
  getConfig(): AIServiceConfig;
}
