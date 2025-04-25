import { Plugin } from "obsidian";
import { SidebarView, VIEW_TYPE_SIDEBAR } from "./views/SidebarView";
import { SidebarService } from "./services/SidebarService";
import { ChatService } from "./services/ChatService";
import { EditorService } from "./services/EditorService";

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

    // Add ribbon icon for quick access
    this.addRibbonIcon("message-circle", "Toggle Sidebar", () => this.sidebarService.toggleSidebar());
  }
}
