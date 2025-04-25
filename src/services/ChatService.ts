import { App, TFile, normalizePath } from "obsidian";
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
  private preserveTitle: boolean = false;
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
  startNewChat(title?: string, preserveTitle: boolean = false): void {
    this.messages = [];
    this.currentChatTitle = title || `Chat ${new Date().toLocaleString()}`;
    this.isNewChat = true;
    this.preserveTitle = preserveTitle;
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
    // Only do this if we're not explicitly preserving the current title
    if (this.messages.length === 0 && this.isNewChat && !this.preserveTitle) {
      // Use the first 30 chars of the message as the title
      this.currentChatTitle = message.length > 30 ? message.substring(0, 27) + "..." : message;
      this.isNewChat = false;
    } else if (this.messages.length === 0) {
      // If this is the first message, mark the chat as not new
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

  // Continue a chat from an existing file in the Companion Chats folder
  async continueExistingChat(file: TFile): Promise<void> {
    if (!file || !this.view) return;

    try {
      // Reset the current state
      this.messages = [];
      this.currentChatFile = file;
      this.isNewChat = false;
      this.preserveTitle = false;

      // Use the file name as the chat title (without extension)
      this.currentChatTitle = file.basename;

      // Clear the view
      this.view.clearMessages();

      // Read the content of the file
      const content = await this.app.vault.read(file);

      // Try to extract the title from the first heading
      const titleMatch = content.match(/^# (.+)$/m);
      if (titleMatch && titleMatch[1]) {
        this.currentChatTitle = titleMatch[1].trim();
      }

      // Parse the content to extract messages
      const userSections = content.split(/^## User$/m);
      const assistantSections = content.split(/^## Assistant$/m);

      // Skip the first sections which are usually empty or contain the title
      for (let i = 1; i < userSections.length; i++) {
        const userContent = userSections[i].split(/^##/m)[0].trim();
        if (userContent) {
          // Add the user message to our internal state
          this.messages.push({
            role: "user",
            content: userContent,
          });

          // Add it to the view
          this.view.addUserMessage(userContent);
        }

        // Check if there's a corresponding assistant message
        if (i < assistantSections.length) {
          const assistantContent = assistantSections[i].split(/^##/m)[0].trim();
          if (assistantContent) {
            // Add the assistant message to our internal state
            this.messages.push({
              role: "assistant",
              content: assistantContent,
            });

            // Add it to the view
            this.view.addAssistantMessage(assistantContent);
          }
        }
      }

      console.log(`Continued chat from file: ${file.path}`);
    } catch (error) {
      console.error(`Failed to continue chat from file ${file.path}:`, error);
    }
  }

  // Create a new chat from an external note
  async createChatFromNote(file: TFile): Promise<void> {
    if (!file || !this.view) return;

    try {
      // Start a new chat with "Chat: " prefix and the note's name as the title
      // Set preserveTitle to true to prevent the title from being overridden
      this.startNewChat(`Chat: ${file.basename}`, true);

      // Create a link to the original note instead of copying its content
      const linkText = `Let's discuss this note: [[${file.path}]]`;

      // Send the link as a message
      this.sendMessage(linkText);

      console.log(`Created chat with link to note: ${file.path}`);
    } catch (error) {
      console.error(`Failed to create chat from note ${file.path}:`, error);
    }
  }

  // Process the current active note
  async processCurrentNote(): Promise<void> {
    // Get the current active file
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      console.log("No active file found");
      return;
    }

    // Check if the file is in the Companion Chats folder
    const isInChatFolder = activeFile.path.startsWith(this.editorService.getChatFolderPath());

    if (isInChatFolder) {
      // Continue the existing chat
      await this.continueExistingChat(activeFile);
    } else {
      // Create a new chat from this note
      await this.createChatFromNote(activeFile);
    }
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
