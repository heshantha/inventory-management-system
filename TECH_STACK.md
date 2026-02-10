# Technology Stack Documentation

This project is a modern Hardware Shop Inventory & Billing System built as a desktop application using web technologies.

## 🚀 Core Technologies

### **Frontend Framework**
-   **[React 19](https://react.dev/)**: The latest version of the popular JavaScript library for building user interfaces.
-   **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling for fast development and optimized builds.

### **Desktop Application Wrapper**
-   **[Electron](https://www.electronjs.org/)**: Framework for building cross-platform desktop apps with JavaScript, HTML, and CSS.
    -   Uses `electron-builder` for packaging and distribution.

### **Language**
-   **JavaScript (ES Modules)**: Modern JavaScript syntax and features.

## 🎨 UI & Styling

-   **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
-   **PostCSS & Autoprefixer**: Tools for transforming CSS with JavaScript plugins.
-   **[Lucide React](https://lucide.dev/)**: A beautiful and consistent icon library.

## 🗄️ Backend & Database

-   **[Supabase](https://supabase.com/)**: An open-source Firebase alternative providing:
    -   PostgreSQL Database
    -   Authentication
    -   Realtime subscriptions
    -   Storage
-   **Local Database / Caching**:
    -   **`better-sqlite3`**: Fast and simple SQLite3 library for Node.js.
    -   **`sql.js`**: SQLite compiled to WebAssembly (likely for browser-based fallback or specific local data handling).

## 🧩 Key Libraries & Utilities

-   **Routing**:
    -   **[React Router DOM](https://reactrouter.com/)**: Default routing library for React applications.
-   **Internationalization (i18n)**:
    -   **`i18next` & `react-i18next`**: Internationalization framework for translating the app into multiple languages.
    -   **`i18next-browser-languagedetector`**: Plugin to detect user language in the browser.
-   **PDF Generation**:
    -   **`jspdf`**: Library to generate PDF files in client-side JavaScript.
    -   **`jspdf-autotable`**: Plugin for generating tables in PDFs.
-   **Linting & Code Quality**:
    -   **ESLint**: Pluggable linting utility for JavaScript and JSX.

## 🛠️ Development Tools

-   **npm**: Package manager.
-   **concurrently**: Utility to run multiple commands concurrently (likely for running frontend and Electron dev processes together).
-   **wait-on**: Utility to wait for files, ports, sockets, etc.

## 📂 Project Structure Overview

-   `src/`: contains the React application source code.
-   `electron/`: contains the Electron main process code (`main.cjs`).
-   `public/`: static assets like icons and images.
-   `dist/`: build output directory.
-   `dist-electron/`: Electron build output directory.
