import { Plugin, WorkspaceLeaf, ItemView, Workspace } from "obsidian";

const VIEW_TYPE_SIDEBAR = "modern-sidebar-view";

export default class SidebarPlugin extends Plugin {
  // Keep track of our sidebar leaf to ensure we only have one
  private sidebarLeaf: WorkspaceLeaf | null = null;

  async onload() {
    this.registerView(VIEW_TYPE_SIDEBAR, (leaf) => new SidebarView(leaf));

    const toggleSidebar = async () => {
      const workspace = this.app.workspace as Workspace & { rightSplit?: any };
      const rightSplit = workspace.rightSplit;

      // Get any existing vault-companion leaves
      const companionLeaves = workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR);

      // Case 1: Sidebar is closed - open it with our companion leaf
      if (rightSplit?.collapsed) {
        rightSplit.expand();
        await this.getOrCreateSidebarLeaf();
        return;
      }

      // Sidebar is open at this point

      // Get the currently active sidebar leaf, if any
      const activeLeaf = workspace.activeLeaf;

      // Check if a companion leaf is both in the sidebar and active
      const isCompanionLeafActive = activeLeaf?.view instanceof SidebarView;
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
        return;
      }

      // Case 5: No companion leaf exists - create one while keeping sidebar open
      await this.getOrCreateSidebarLeaf();
      // Ensure sidebar remains expanded
      if (rightSplit.collapsed) rightSplit.expand();
    };

    this.addCommand({
      id: "toggle-sidebar",
      name: "Toggle Sidebar",
      callback: toggleSidebar,
    });

    this.addRibbonIcon("message-circle", "Toggle Sidebar", toggleSidebar);
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
        return;
      }
    }

    // We need to create a new leaf
    const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR);

    // Use an existing leaf if available to avoid duplicates
    if (existingLeaves.length > 0) {
      this.sidebarLeaf = existingLeaves[0];
      workspace.revealLeaf(this.sidebarLeaf);
      return;
    }

    // Create a new leaf if none exists
    const leaf = workspace.getRightLeaf(false);
    if (!leaf) return;

    await leaf.setViewState({ type: VIEW_TYPE_SIDEBAR, active: true });
    this.sidebarLeaf = leaf;
    workspace.revealLeaf(this.sidebarLeaf);
  }
}

class SidebarView extends ItemView {
  private messageContentEl: HTMLElement;
  private chatInputEl: HTMLTextAreaElement;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_SIDEBAR;
  }

  getDisplayText(): string {
    return "Vault Companions";
  }

  getIcon(): string {
    return "message-circle";
  }

  async onOpen() {
    this.containerEl.empty();

    // Create main container with flex layout
    const mainContainer = this.containerEl.createDiv({
      cls: "companion-container",
    });

    // Add some basic styling to the container
    mainContainer.style.display = "flex";
    mainContainer.style.flexDirection = "column";
    mainContainer.style.height = "100%";

    // Create content area (will hold messages later)
    this.messageContentEl = mainContainer.createDiv({
      cls: "companion-content",
    });

    // Style the content area
    this.messageContentEl.style.flexGrow = "1";
    this.messageContentEl.style.overflow = "auto";
    this.messageContentEl.style.padding = "10px";

    // Add a welcome message
    const welcomeEl = this.messageContentEl.createDiv({
      text: "Welcome to Vault Companions!",
      cls: "companion-welcome",
    });
    welcomeEl.style.marginBottom = "10px";

    // Create input container for the bottom
    const inputContainer = mainContainer.createDiv({
      cls: "companion-input-container",
    });

    // Style the input container
    inputContainer.style.borderTop = "1px solid var(--background-modifier-border)";
    inputContainer.style.padding = "10px";
    inputContainer.style.display = "flex";

    // Create the textarea field instead of input
    this.chatInputEl = inputContainer.createEl("textarea", {
      cls: "companion-input",
      attr: {
        placeholder: "Type a message...",
        rows: "2", // Initial height of 2 rows
      },
    });

    // Style the textarea field
    this.chatInputEl.style.flexGrow = "1";
    this.chatInputEl.style.padding = "8px";
    this.chatInputEl.style.borderRadius = "4px";
    this.chatInputEl.style.border = "1px solid var(--background-modifier-border)";
    this.chatInputEl.style.resize = "none"; // Disable manual resizing
    this.chatInputEl.style.minHeight = "36px";
    this.chatInputEl.style.maxHeight = "120px"; // Limit maximum height
    this.chatInputEl.style.overflow = "auto"; // Add scrollbar when content overflows

    // Add event listener for the Enter key (Enter sends, Shift+Enter for new line)
    this.chatInputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent default Enter behavior
        const message = this.chatInputEl.value.trim();
        if (message) {
          // In the future, this will handle sending messages
          console.log("Message entered:", message);

          // For now, just clear the input
          this.chatInputEl.value = "";
        }
      }
    });

    // Auto-resize textarea based on content
    this.chatInputEl.addEventListener("input", () => {
      this.autoResizeTextarea();
    });

    // Set focus on the input field when opening the leaf
    // Use setTimeout to ensure the DOM is fully rendered
    setTimeout(() => {
      this.chatInputEl.focus();
    }, 50);

    // Also focus when the leaf becomes active
    this.registerDomEvent(document, "visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.chatInputEl.focus();
      }
    });

    // Focus input when the view becomes active in the workspace
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf && leaf.view === this) {
          this.chatInputEl.focus();
        }
      })
    );
  }

  // Auto-resize the textarea based on content
  private autoResizeTextarea() {
    // Reset height to auto to get the correct scrollHeight
    this.chatInputEl.style.height = "auto";

    // Set the height to match content (with min and max limits)
    const newHeight = Math.min(120, Math.max(36, this.chatInputEl.scrollHeight));
    this.chatInputEl.style.height = newHeight + "px";
  }

  async onClose() {
    this.containerEl.empty();
  }
}
