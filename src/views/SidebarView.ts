import { ItemView, WorkspaceLeaf, setIcon, MarkdownView, MarkdownRenderer } from "obsidian";

export const VIEW_TYPE_SIDEBAR = "modern-sidebar-view";

export class SidebarView extends ItemView {
  private messageContentEl: HTMLElement;
  private markdownViewContainer: HTMLElement;
  private markdownContent: string = "";
  private chatInputEl: HTMLTextAreaElement;
  private loadingEl: HTMLElement | null = null;
  private onMessageSubmit: ((message: string) => void) | null = null;
  private onNewChat: (() => void) | null = null;

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

  // Set the message handler callback
  setMessageHandler(handler: (message: string) => void): void {
    this.onMessageSubmit = handler;
  }

  // Set the new chat handler callback
  setNewChatHandler(handler: () => void): void {
    this.onNewChat = handler;
  }

  // Public method to focus the input
  focusInput(): void {
    if (this.chatInputEl) {
      this.chatInputEl.focus();
    }
  }

  // Show/hide loading indicator
  setLoading(isLoading: boolean): void {
    if (isLoading) {
      // Create loading indicator if it doesn't exist
      if (!this.loadingEl && this.messageContentEl) {
        this.loadingEl = this.messageContentEl.createDiv({
          cls: "companion-loading",
        });

        // Style the loading indicator
        this.loadingEl.style.textAlign = "left";
        this.loadingEl.style.marginBottom = "8px";
        this.loadingEl.style.padding = "8px 12px";
        this.loadingEl.style.backgroundColor = "var(--background-modifier-form-field)";
        this.loadingEl.style.color = "var(--text-muted)";
        this.loadingEl.style.borderRadius = "12px 12px 12px 0";
        this.loadingEl.style.maxWidth = "80%";
        this.loadingEl.style.display = "flex";
        this.loadingEl.style.alignItems = "center";

        // Create the dots animation
        const dotsContainer = this.loadingEl.createSpan();
        dotsContainer.textContent = "Thinking";

        const dots = this.loadingEl.createSpan({
          cls: "loading-dots",
        });
        dots.textContent = "...";

        // Append a temporary indicator to the markdown content
        this.markdownContent += "\n\n> [!info] Thinking...\n";
        this.renderMarkdown();
      }
    } else {
      // Remove loading indicator if it exists
      if (this.loadingEl) {
        this.loadingEl.remove();
        this.loadingEl = null;

        // Remove the thinking indicator from markdown
        this.markdownContent = this.markdownContent.replace("\n\n> [!info] Thinking...\n", "");
        this.renderMarkdown();
      }
    }
  }

  // Clear all messages from the conversation
  clearMessages(): void {
    this.markdownContent = "# New Chat\n\n";
    this.renderMarkdown();
  }

  // Add a user message to the conversation
  addUserMessage(message: string): void {
    this.markdownContent += `## User\n${message}\n\n<hr class="user-separator">\n\n`;
    this.renderMarkdown();
  }

  // Add an assistant message to the conversation
  addAssistantMessage(message: string): void {
    this.markdownContent += `## Assistant\n${message}\n\n<hr class="assistant-separator">\n\n`;
    this.renderMarkdown();
  }

  // Helper to render markdown content in the view
  private async renderMarkdown(): Promise<void> {
    if (!this.markdownViewContainer) return;

    // Clear the container
    this.markdownViewContainer.empty();

    // Render markdown
    await MarkdownRenderer.renderMarkdown(this.markdownContent, this.markdownViewContainer, "", this);

    // Add minimal styling for readability
    this.applyMinimalStyling();

    // Scroll to the bottom
    this.scrollToBottom();
  }

  // Apply minimal styling to the rendered markdown elements
  private applyMinimalStyling(): void {
    if (!this.markdownViewContainer) return;

    // Style the title
    const titleEl = this.markdownViewContainer.querySelector("h1") as HTMLElement;
    if (titleEl) {
      titleEl.style.marginTop = "0";
      titleEl.style.marginBottom = "16px";
      titleEl.style.fontSize = "1.5em";
      titleEl.style.textAlign = "center";
    }

    // Style role headings
    const headings = this.markdownViewContainer.querySelectorAll("h2") as NodeListOf<HTMLElement>;
    headings.forEach((heading) => {
      heading.style.marginTop = "1em";
      heading.style.marginBottom = "0.5em";
      heading.style.fontSize = "0.9em";
      heading.style.fontWeight = "bold";
      heading.style.color = "var(--text-normal)";
    });

    // Style horizontal rules for clean separation
    const hrs = this.markdownViewContainer.querySelectorAll("hr") as NodeListOf<HTMLElement>;
    hrs.forEach((hr) => {
      hr.style.margin = "1em 0";
      hr.style.border = "none";
      hr.style.height = "1px";
      hr.style.backgroundColor = "var(--background-modifier-border)";
    });
  }

  // Helper to scroll to the bottom of the conversation
  scrollToBottom(): void {
    this.messageContentEl.scrollTop = this.messageContentEl.scrollHeight;
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

    // Create header with new chat button
    const headerContainer = mainContainer.createDiv({
      cls: "companion-header",
    });

    // Style the header
    headerContainer.style.display = "flex";
    headerContainer.style.justifyContent = "space-between";
    headerContainer.style.alignItems = "center";
    headerContainer.style.padding = "8px 12px";
    headerContainer.style.borderBottom = "1px solid var(--background-modifier-border)";

    // Add title to the header
    const titleEl = headerContainer.createDiv({
      cls: "companion-title",
    });
    titleEl.style.fontWeight = "bold";
    titleEl.textContent = "Vault Companions";

    // Add new chat button
    const newChatButton = headerContainer.createDiv({
      cls: "companion-new-chat-button clickable-icon",
    });
    setIcon(newChatButton, "plus");
    newChatButton.style.cursor = "pointer";
    newChatButton.setAttribute("aria-label", "New Chat");

    // Add click event to the new chat button
    newChatButton.addEventListener("click", () => {
      if (this.onNewChat) {
        this.onNewChat();
      }
    });

    // Create content area (will hold messages later)
    this.messageContentEl = mainContainer.createDiv({
      cls: "companion-content",
    });

    // Style the content area
    this.messageContentEl.style.flexGrow = "1";
    this.messageContentEl.style.overflow = "auto";
    this.messageContentEl.style.padding = "10px";

    // Create a container for the markdown view
    this.markdownViewContainer = this.messageContentEl.createDiv({
      cls: "markdown-view-container",
    });

    // Style the markdown view container
    this.markdownViewContainer.style.width = "100%";
    this.markdownViewContainer.style.padding = "0 10px";

    // Initialize with empty markdown content
    this.markdownContent = "# New Chat\n\n";
    this.renderMarkdown();

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
        event.preventDefault();
        const message = this.chatInputEl.value.trim();

        if (message && this.onMessageSubmit) {
          this.onMessageSubmit(message);
          this.chatInputEl.value = "";
          this.autoResizeTextarea();
        }
      }
    });

    // Auto-resize the textarea when content changes
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

  private autoResizeTextarea() {
    if (this.chatInputEl) {
      // Reset height to auto to get the real scrollHeight
      this.chatInputEl.style.height = "auto";

      // Calculate new height (clamped to max height)
      const newHeight = Math.min(this.chatInputEl.scrollHeight, 120);

      // Set new height
      this.chatInputEl.style.height = `${newHeight}px`;
    }
  }

  async onClose() {
    // Clean up any event listeners or resources if needed
  }
}
