import { App, TFolder, TFile, normalizePath } from "obsidian";

export class EditorService {
  private app: App;
  private chatFolder: string = "Companion Chats";

  constructor(app: App) {
    this.app = app;
  }

  async onload(): Promise<void> {
    await this.ensureChatFolderExists();
  }

  /**
   * Ensures the chat folder exists, creating it if it doesn't
   */
  private async ensureChatFolderExists(): Promise<void> {
    const folderPath = normalizePath(this.chatFolder);
    const folderExists = this.app.vault.getAbstractFileByPath(folderPath) instanceof TFolder;

    if (!folderExists) {
      try {
        await this.app.vault.createFolder(folderPath);
        console.log(`Created "${this.chatFolder}" folder for storing chat conversations`);
      } catch (error) {
        console.error(`Failed to create "${this.chatFolder}" folder:`, error);
      }
    }
  }

  /**
   * Saves a chat conversation to a markdown file
   * @param chatTitle The title of the chat (used for the filename)
   * @param messages Array of message objects with role and content
   * @param existingFile Optional file to update instead of creating a new one
   */
  async saveChat(
    chatTitle: string,
    messages: Array<{ role: string; content: string }>,
    existingFile?: TFile | null
  ): Promise<TFile | null> {
    if (!chatTitle || !messages || messages.length === 0) {
      return null;
    }

    // Create a valid filename
    const sanitizedTitle = chatTitle.replace(/[\\/:*?"<>|]/g, "-");

    try {
      // Format the content
      let fileContent = `# ${chatTitle}\n\n`;

      for (const message of messages) {
        if (message.role === "user") {
          fileContent += `## User\n${message.content}\n\n`;
        } else if (message.role === "assistant") {
          fileContent += `## Assistant\n${message.content}\n\n`;
        }
      }

      // If we have an existing file, update it
      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, fileContent);
        return existingFile;
      }

      // Otherwise find a unique filename for a new file
      let index = 0;
      let fileName = `${sanitizedTitle}.md`;
      let filePath = normalizePath(`${this.chatFolder}/${fileName}`);

      // Check if file already exists
      while (this.app.vault.getAbstractFileByPath(filePath) instanceof TFile) {
        index++;
        fileName = `${sanitizedTitle} ${index}.md`;
        filePath = normalizePath(`${this.chatFolder}/${fileName}`);
      }

      // Create new file with unique name
      const newFile = await this.app.vault.create(filePath, fileContent);
      return newFile;
    } catch (error) {
      console.error(`Failed to save chat "${chatTitle}":`, error);
      return null;
    }
  }

  /**
   * Gets a list of all saved chat files
   */
  async getSavedChats(): Promise<TFile[]> {
    const folderPath = normalizePath(this.chatFolder);
    const folder = this.app.vault.getAbstractFileByPath(folderPath);

    if (!(folder instanceof TFolder)) {
      return [];
    }

    return folder.children
      .filter((file) => file instanceof TFile && file.extension === "md")
      .map((file) => file as TFile);
  }
}
