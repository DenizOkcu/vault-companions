import { Plugin } from "obsidian";
import { SidebarView, VIEW_TYPE_SIDEBAR } from "./views/SidebarView";
import { SidebarService } from "./services/SidebarService";
import { ChatService } from "./services/ChatService";
import { EditorService } from "./services/EditorService";
import { OllamaService } from "./services/OllamaService";

export default class SidebarPlugin extends Plugin {
  private sidebarService: SidebarService;
  private chatService: ChatService;
  private editorService: EditorService;

  async onload() {
    // Initialize services
    this.sidebarService = new SidebarService(this.app);
    this.chatService = new ChatService(this.app);
    this.editorService = new EditorService(this.app);

    // Initialize the editor service and create chat folder if needed
    await this.editorService.onload();

    // Register the sidebar view with a factory that configures the view
    this.registerView(VIEW_TYPE_SIDEBAR, (leaf) => {
      const view = new SidebarView(leaf);

      // Connect the view to the chat service
      view.setMessageHandler((message) => this.chatService.sendMessage(message));
      this.chatService.setView(view);

      return view;
    });

    // Add the toggle sidebar command
    this.addCommand({
      id: "toggle-sidebar",
      name: "Toggle Sidebar",
      callback: () => this.sidebarService.toggleSidebar(),
    });

    // Add command to start a new chat
    this.addCommand({
      id: "start-new-chat",
      name: "Start New Chat",
      callback: async () => {
        // Ensure sidebar is open without toggling it closed if it's already open
        await this.sidebarService.ensureSidebarOpen();

        // Start a new chat
        this.chatService.startNewChat();
      },
    });

    // Add command to use current note as chat
    this.addCommand({
      id: "use-current-note-as-chat",
      name: "Use Current Note as Chat",
      checkCallback: (checking) => {
        // Make sure we have an active file
        const activeFile = this.app.workspace.getActiveFile();

        if (checking) {
          // If just checking, return true if there's an active file
          return !!activeFile;
        }

        // Ensure sidebar is open
        this.sidebarService.ensureSidebarOpen().then(() => {
          // Process the current note
          this.chatService.processCurrentNote();
        });

        return true;
      },
    });

    // Add ribbon icon for quick access
    this.addRibbonIcon("message-circle", "Toggle Sidebar", () => this.sidebarService.toggleSidebar());

    console.log("Vault Companions plugin loaded with Ollama integration");
  }
}
