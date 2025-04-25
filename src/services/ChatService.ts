import { App, TFile } from "obsidian";
import { SidebarView } from "../views/SidebarView";
import { EditorService } from "./EditorService";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class ChatService {
  private app: App;
  private view: SidebarView | null = null;
  private editorService: EditorService;
  private messages: ChatMessage[] = [];
  private currentChatTitle: string = "";
  private isNewChat: boolean = true;
  private currentChatFile: TFile | null = null;

  constructor(app: App) {
    this.app = app;
    this.editorService = new EditorService(app);
  }

  // Register the view that will display messages
  setView(view: SidebarView): void {
    this.view = view;

    // Set up the new chat handler
    view.setNewChatHandler(() => this.startNewChat());
  }

  // Set or update the chat title
  setChatTitle(title: string): void {
    this.currentChatTitle = title || "Untitled Chat";
  }

  // Start a new chat
  startNewChat(title?: string): void {
    this.messages = [];
    this.currentChatTitle = title || `Chat ${new Date().toLocaleString()}`;
    this.isNewChat = true;
    this.currentChatFile = null;

    if (this.view) {
      this.view.clearMessages();
    }

    console.log(`Started new chat: ${this.currentChatTitle}`);
  }

  // Handle sending a user message
  sendMessage(message: string): void {
    if (!this.view || !message.trim()) return;

    // If this is the first message and no title has been set, use it as title
    if (this.messages.length === 0 && this.isNewChat) {
      // Use the first 30 chars of the message as the title
      this.currentChatTitle = message.length > 30 ? message.substring(0, 27) + "..." : message;
      this.isNewChat = false;
    }

    // Create and store the user message
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
    };
    this.messages.push(userMessage);

    // Display the user message
    this.view.addUserMessage(message);

    // In a real implementation, this would send the message to an API
    // For now, simulate a response
    this.simulateResponse(message);
  }

  // Save the current chat to a markdown file
  async saveCurrentChat(): Promise<void> {
    if (this.messages.length === 0) return;

    // Save chat and keep track of the file
    const savedFile = await this.editorService.saveChat(this.currentChatTitle, this.messages, this.currentChatFile);

    if (savedFile) {
      this.currentChatFile = savedFile;
    }
  }

  // Temporary method to simulate a response
  private simulateResponse(userMessage: string): void {
    if (!this.view) return;

    // Simulate a delay for the response
    setTimeout(() => {
      if (this.view) {
        const response = `I received your message: "${userMessage}". How can I help you with your vault?`;

        // Create and store the assistant message
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response,
        };
        this.messages.push(assistantMessage);

        // Display the message
        this.view.addAssistantMessage(response);

        // Save the chat after each assistant response
        this.saveCurrentChat();
      }
    }, 1000);
  }
}
