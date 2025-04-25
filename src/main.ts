import { Plugin } from "obsidian";
import { SidebarView, VIEW_TYPE_SIDEBAR } from "./views/SidebarView";
import { SidebarService } from "./services/SidebarService";
import { ChatService } from "./services/ChatService";

export default class SidebarPlugin extends Plugin {
  private sidebarService: SidebarService;
  private chatService: ChatService;

  async onload() {
    // Initialize services
    this.sidebarService = new SidebarService(this.app);
    this.chatService = new ChatService(this.app);

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

    // Add ribbon icon for quick access
    this.addRibbonIcon("message-circle", "Toggle Sidebar", () => this.sidebarService.toggleSidebar());
  }
}
