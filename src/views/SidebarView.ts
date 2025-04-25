import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";

export const VIEW_TYPE_SIDEBAR = "modern-sidebar-view";

export class SidebarView extends ItemView {
  private messageContentEl: HTMLElement;
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

        // Scroll to show the loading indicator
        this.scrollToBottom();
      }
    } else {
      // Remove loading indicator if it exists
      if (this.loadingEl) {
        this.loadingEl.remove();
        this.loadingEl = null;
      }
    }
  }

  // Clear all messages from the conversation
  clearMessages(): void {
    if (this.messageContentEl) {
      // Keep only elements that aren't messages
      const nonMessageElements = Array.from(this.messageContentEl.children).filter(
        (el) => !el.classList.contains("companion-message")
      );

      // Clear the container
      this.messageContentEl.empty();

      // Re-add non-message elements like welcome message
      nonMessageElements.forEach((el) => {
        this.messageContentEl.appendChild(el);
      });
    }
  }

  // Add a user message to the conversation - view only
  addUserMessage(message: string): void {
    const messageEl = this.messageContentEl.createDiv({
      cls: "companion-message user-message",
    });

    // Style the user message
    messageEl.style.textAlign = "right";
    messageEl.style.marginBottom = "8px";
    messageEl.style.padding = "8px 12px";
    messageEl.style.backgroundColor = "var(--interactive-accent)";
    messageEl.style.color = "var(--text-on-accent)";
    messageEl.style.borderRadius = "12px 12px 0 12px";
    messageEl.style.maxWidth = "80%";
    messageEl.style.marginLeft = "auto";
    messageEl.style.wordBreak = "break-word";

    messageEl.textContent = message;

    // Scroll to the bottom of the conversation
    this.scrollToBottom();
  }

  // Add an assistant message to the conversation - view only
  addAssistantMessage(message: string): void {
    const messageEl = this.messageContentEl.createDiv({
      cls: "companion-message assistant-message",
    });

    // Style the assistant message
    messageEl.style.textAlign = "left";
    messageEl.style.marginBottom = "8px";
    messageEl.style.padding = "8px 12px";
    messageEl.style.backgroundColor = "var(--background-modifier-form-field)";
    messageEl.style.color = "var(--text-normal)";
    messageEl.style.borderRadius = "12px 12px 12px 0";
    messageEl.style.maxWidth = "80%";
    messageEl.style.wordBreak = "break-word";

    messageEl.textContent = message;

    // Scroll to the bottom of the conversation
    this.scrollToBottom();
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

    // Create content area (will hold messages later)
    this.messageContentEl = mainContainer.createDiv({
      cls: "companion-content",
    });

    // Style the content area
    this.messageContentEl.style.flexGrow = "1";
    this.messageContentEl.style.overflow = "auto";
    this.messageContentEl.style.padding = "10px";

    // Explicitly set the flex direction to ensure correct message ordering
    this.messageContentEl.style.display = "flex";
    this.messageContentEl.style.flexDirection = "column";
    this.messageContentEl.style.justifyContent = "flex-start";

    // Create a header container for welcome message and new chat button
    const headerContainer = this.messageContentEl.createDiv({
      cls: "companion-header",
    });
    headerContainer.style.display = "flex";
    headerContainer.style.justifyContent = "space-between";
    headerContainer.style.alignItems = "center";
    headerContainer.style.marginBottom = "10px";
    headerContainer.style.backgroundColor = "var(--background-modifier-form-field)";
    headerContainer.style.borderRadius = "12px";
    headerContainer.style.padding = "8px 12px";

    // Add welcome message to the header
    const welcomeEl = headerContainer.createDiv({
      cls: "companion-welcome",
    });
    welcomeEl.style.color = "var(--text-normal)";
    welcomeEl.style.textAlign = "center";
    welcomeEl.style.flexGrow = "1";
    welcomeEl.textContent = "Welcome to Vault Companions!";

    // Add new chat button
    const newChatButton = headerContainer.createDiv({
      cls: "companion-new-chat-button clickable-icon",
    });
    setIcon(newChatButton, "plus");
    newChatButton.style.cursor = "pointer";
    newChatButton.style.marginLeft = "8px";
    newChatButton.setAttribute("aria-label", "New Chat");

    // Add click event to the new chat button
    newChatButton.addEventListener("click", () => {
      if (this.onNewChat) {
        this.onNewChat();
      }
    });

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
          // Call the message handler if set
          if (this.onMessageSubmit) {
            this.onMessageSubmit(message);
          }

          // Clear the input
          this.chatInputEl.value = "";

          // Reset textarea height
          this.autoResizeTextarea();
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
