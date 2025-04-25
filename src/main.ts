import { Plugin } from "obsidian";
import { SidebarView, VIEW_TYPE_SIDEBAR } from "./views/SidebarView";
import { SidebarService } from "./services/SidebarService";

export default class SidebarPlugin extends Plugin {
  private sidebarService: SidebarService;

  async onload() {
    // Initialize services
    this.sidebarService = new SidebarService(this.app);

    // Register the sidebar view
    this.registerView(VIEW_TYPE_SIDEBAR, (leaf) => new SidebarView(leaf));

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
