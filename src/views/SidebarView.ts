import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_SIDEBAR = "modern-sidebar-view";

export class SidebarView extends ItemView {
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

  // Public method to focus the input
  focusInput(): void {
    if (this.chatInputEl) {
      this.chatInputEl.focus();
    }
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
