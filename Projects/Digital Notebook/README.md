# 🔒 Digital Notebook & Journal

A secure, premium, and fully responsive digital note-taking and diary application. Keep your private thoughts, checklists, journals, and project drafts locked under password protection, backed up locally, and auto-synchronized in real time.

---

## 🚀 Key Features

1. **Password Protection Vault**: 
   - Lock your notebook with a custom password.
   - Encrypt/Obfuscate note contents inside LocalStorage for enhanced client-side privacy.
   - Secure lock screen overlay on inactivity or browser launch.

2. **Full-Featured Note Editor**:
   - Create, edit, and organize multiple notes/journals.
   - Support for custom tags (e.g., `diary`, `work`, `ideas`, `personal`).
   - Search bar and filtering tabs.
   - Live character count and auto-saving indicator.

3. **Writing Mode & Markdown Helpers**:
   - Quick toolbar buttons for headings, bold, italic, code blocks, lists, and checklists.
   - Live preview layout.

4. **File Import & Backup Exporter**:
   - **Upload Notes**: Import backup JSON or text files to restore your notebook.
   - **Save / Export Notes**: Backup your entire vault as a single JSON file, or download current notes as individual `.txt` text files.

---

## 🛠️ Code Architecture

- [index.html](file:///index.html): HTML5 semantic markup containing lock overlays, sidebars, editors, toolbars, and file upload structures.
- [style.css](file:///style.css): Vanilla CSS layout featuring premium glassmorphic styling, HSL gradients, dark/light theme options, and fluid responsiveness.
- [script.js](file:///script.js): Main application controller covering LocalStorage syncing, simple vault obfuscation, tag filtering, file parsing, and Markdown toolbar operations.
- [project.json](file:///project.json): Metadata specifications.
