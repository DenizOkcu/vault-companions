import { App, WorkspaceLeaf, Workspace } from "obsidian";
import { VIEW_TYPE_SIDEBAR, SidebarView } from "../views/SidebarView";

export class SidebarService {
  private sidebarLeaf: WorkspaceLeaf | null = null;
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  async toggleSidebar(): Promise<void> {
    const workspace = this.app.workspace as Workspace & { rightSplit?: any };
    const rightSplit = workspace.rightSplit;

    // Get any existing vault-companion leaves
    const companionLeaves = workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR);

    // Case 1: Sidebar is closed - open it with our companion leaf
    if (rightSplit?.collapsed) {
      rightSplit.expand();
      await this.getOrCreateSidebarLeaf();
      this.focusInputInSidebarView();
      return;
    }

    // Sidebar is open at this point

    // Get the currently active sidebar leaf, if any
    const activeLeaf = workspace.activeLeaf;

    // Check if a companion leaf is both in the sidebar and active
    const isCompanionLeafActive = activeLeaf?.view.getViewType() === VIEW_TYPE_SIDEBAR;
    const isCompanionLeafInSidebar = !!this.findCompanionLeafInRightSidebar();

    // Case 2: Companion leaf is visible and active - close the sidebar
    if (isCompanionLeafActive && isCompanionLeafInSidebar) {
      rightSplit.collapse();
      return;
    }

    // Case 3: Companion leaf is visible but not active - close the sidebar
    if (isCompanionLeafInSidebar && !isCompanionLeafActive) {
      // First make the companion leaf active
      const companionLeaf = this.findCompanionLeafInRightSidebar();
      if (companionLeaf) {
        workspace.setActiveLeaf(companionLeaf);
        this.focusInputInSidebarView();
      }
      // Then collapse the sidebar
      rightSplit.collapse();
      return;
    }

    // Case 4: Another leaf is visible in sidebar - keep sidebar open and switch to companion leaf
    // First check if a companion leaf exists somewhere
    if (companionLeaves.length > 0) {
      this.sidebarLeaf = companionLeaves[0];
      workspace.revealLeaf(this.sidebarLeaf);
      // Make sure the sidebar stays open
      if (rightSplit.collapsed) rightSplit.expand();
      this.focusInputInSidebarView();
      return;
    }

    // Case 5: No companion leaf exists - create one while keeping sidebar open
    await this.getOrCreateSidebarLeaf();
    // Ensure sidebar remains expanded
    if (rightSplit.collapsed) rightSplit.expand();
    this.focusInputInSidebarView();
  }

  // Helper method to focus the input in the sidebar view
  private focusInputInSidebarView(): void {
    if (this.sidebarLeaf && this.sidebarLeaf.view instanceof SidebarView) {
      const view = this.sidebarLeaf.view as SidebarView;
      // Use setTimeout to ensure the DOM is fully rendered
      setTimeout(() => {
        view.focusInput();
      }, 50);
    }
  }

  // Find a companion leaf in the right sidebar (active or not)
  private findCompanionLeafInRightSidebar(): WorkspaceLeaf | null {
    try {
      const workspace = this.app.workspace;
      const rightSplit = workspace.rightSplit;

      // If sidebar is collapsed, no leaves are visible
      if (!rightSplit || rightSplit.collapsed) return null;

      // Get all leaves of our type
      const companionLeaves = workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR);
      if (!companionLeaves.length) return null;

      // Check each companion leaf to see if it's in the right sidebar
      for (const leaf of companionLeaves) {
        // Check if this leaf is in the right sidebar
        if (this.isLeafInRightSidebar(leaf)) {
          return leaf;
        }
      }

      return null;
    } catch (error) {
      console.error("Error finding companion leaf:", error);
      return null;
    }
  }

  // Helper method to check if a leaf is in the right sidebar
  private isLeafInRightSidebar(leaf: WorkspaceLeaf): boolean {
    try {
      // Get the parent split of the leaf
      const parentSplit = (leaf as any).parent;
      if (!parentSplit) return false;

      // Check if the parent is the right split or a child of the right split
      const rightSplit = this.app.workspace.rightSplit;
      return parentSplit === rightSplit || (parentSplit.parent && parentSplit.parent === rightSplit);
    } catch (error) {
      console.error("Error checking if leaf is in right sidebar:", error);
      return false;
    }
  }

  // Get existing leaf or create a new one if needed
  async getOrCreateSidebarLeaf(): Promise<void> {
    const workspace = this.app.workspace;

    // Check if we already have our leaf
    if (this.sidebarLeaf) {
      // Check if it still exists in the workspace
      const stillExists = workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR).contains(this.sidebarLeaf);

      if (stillExists) {
        // Leaf exists, just reveal it
        workspace.revealLeaf(this.sidebarLeaf);
        this.focusInputInSidebarView();
        return;
      }
    }

    // We need to create a new leaf
    const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR);

    // Use an existing leaf if available to avoid duplicates
    if (existingLeaves.length > 0) {
      this.sidebarLeaf = existingLeaves[0];
      workspace.revealLeaf(this.sidebarLeaf);
      this.focusInputInSidebarView();
      return;
    }

    // Create a new leaf if none exists
    const leaf = workspace.getRightLeaf(false);
    if (!leaf) return;

    await leaf.setViewState({ type: VIEW_TYPE_SIDEBAR, active: true });
    this.sidebarLeaf = leaf;
    workspace.revealLeaf(this.sidebarLeaf);
    this.focusInputInSidebarView();
  }

  // Ensure the sidebar is open without toggling it closed
  async ensureSidebarOpen(): Promise<void> {
    const workspace = this.app.workspace as Workspace & { rightSplit?: any };
    const rightSplit = workspace.rightSplit;

    // Only open the sidebar if it's collapsed
    if (rightSplit?.collapsed) {
      rightSplit.expand();
    }

    // Make sure our view is visible and active
    await this.getOrCreateSidebarLeaf();
  }
}
