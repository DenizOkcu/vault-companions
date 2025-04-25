import { App } from "obsidian";
import { SidebarView } from "../views/SidebarView";

export class ChatService {
  private app: App;
  private view: SidebarView | null = null;

  constructor(app: App) {
    this.app = app;
  }

  // Register the view that will display messages
  setView(view: SidebarView): void {
    this.view = view;
  }

  // Handle sending a user message
  sendMessage(message: string): void {
    if (!this.view || !message.trim()) return;

    // Display the user message
    this.view.addUserMessage(message);

    // Log the message (for now)
    console.log("Message sent:", message);

    // In a real implementation, this would send the message to an API
    // For now, simulate a response
    this.simulateResponse(message);
  }

  // Temporary method to simulate a response
  private simulateResponse(userMessage: string): void {
    if (!this.view) return;

    // Simulate a delay for the response
    setTimeout(() => {
      if (this.view) {
        const response = `I received your message: "${userMessage}". How can I help you with your vault?`;
        this.view.addAssistantMessage(response);
      }
    }, 1000);
  }
}
