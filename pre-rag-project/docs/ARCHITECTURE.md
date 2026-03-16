## Architecture – React Todo App

This document describes the high-level architecture for the Todo app built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

> Note: This is an intentionally simple architecture optimized for clarity and ease of extension.

### 1. Project Structure

Recommended structure for the app:

```text
.
├─ docs/
│  ├─ PRD.md
│  └─ ARCHITECTURE.md
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ TodoItem.tsx
│  │  └─ TodoList.tsx
│  ├─ hooks/
│  │  └─ useTodos.ts
│  ├─ context/
│  │  └─ TodosProvider.tsx
│  ├─ pages/ (or views/)
│  │  └─ TodoPage.tsx
│  ├─ styles/
│  │  └─ index.css (Tailwind entry)
│  ├─ utils/
│  │  └─ storage.ts
│  ├─ App.tsx
│  └─ main.tsx
├─ index.html
├─ tailwind.config.(js|cjs|ts)
└─ README.md
```

Not all files must exist on day one; this layout is the target design.

### 2. Application Layers

- **Presentation Layer (UI components)**
  - Located in `src/components/` and `src/pages/`.
  - Responsible for rendering the UI using React and styling via Tailwind utility classes.
  - Components are kept small, focused, and composable.

- **State & Business Logic**
  - Centralized in:
    - `src/hooks/useTodos.ts` for reusable todo logic.
    - `src/context/TodosProvider.tsx` (optional) to share todo state across the tree.
  - Handles operations such as add, edit, delete, toggle, and filter.

- **Persistence Layer**
  - Implemented via a small utility module in `src/utils/storage.ts`.
  - Abstracts `localStorage` read/write operations behind simple functions like `loadTodos()` and `saveTodos(todos)`.

### 3. Data Model

Basic `Todo` shape (TypeScript):

```ts
export type TodoId = string;

export interface Todo {
  id: TodoId;
  title: string;
  completed: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

Filtering can be represented as:

```ts
export type TodoFilter = 'all' | 'active' | 'completed';
```

### 4. Component Responsibilities

- **`App.tsx`**
  - Bootstraps the main layout.
  - Wires up global providers (e.g., `TodosProvider`, theme if needed).
  - Renders the main `TodoPage`.

- **`TodoPage.tsx`**
  - Page-level component that composes input, filters, and list.
  - Connects `useTodos` (or context) to presentational components.

- **`TodoList.tsx`**
  - Receives a list of todos and callbacks as props.
  - Maps todos to `TodoItem` components.

- **`TodoItem.tsx`**
  - Renders a single todo item.
  - Handles UI for toggling completion, editing, and deleting.

- **Filter Controls**
  - Small components to switch between All / Active / Completed.
  - Ideally dumb/presentational, receiving current filter and onChange callback.

### 5. State Management Strategy

- Use **React hooks** and optional **context** instead of external state libraries.
- Core todo state lives in either:
  - A custom hook `useTodos` whose state is lifted to `TodoPage`, or
  - A `TodosProvider` context if multiple pages or deeply nested components need access.
- State updates:
  - Always treat state as immutable (e.g., `setTodos(prev => prev.map(...))`).
  - Persist to `localStorage` after each change via a small effect or helper.

### 6. Tailwind CSS Usage

- Tailwind is configured via `tailwind.config` and imported in `src/styles/index.css` (or similar).
- **Best practices**:
  - Use Tailwind utility classes directly on JSX elements for layout and spacing.
  - Extract small reusable components (e.g., `Button`, `Card`) instead of creating large custom CSS files.
  - Keep class lists readable by grouping related utilities (layout, spacing, color, typography).

Example (high-level, not tied to a specific file):

```tsx
<div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
  <span className="text-sm text-gray-800 line-through">Buy milk</span>
  <button className="text-xs text-red-500 hover:text-red-600">Delete</button>
</div>
```

### 7. Routing (Optional)

For a simple single-page Todo app, React Router is not strictly required. If routing is added later (e.g., `/completed`, `/active`), place route definitions in a small `routes` or `AppRoutes` component and keep individual pages under `src/pages/`.

### 8. Testing Approach (Optional but Recommended)

- Use **Vitest** or **Jest** for unit tests, colocated next to components (e.g., `TodoItem.test.tsx`).
- Focus on:
  - Rendering logic (titles, completed state).
  - User interactions (add, toggle, delete).
  - Persistence behavior (ensuring `localStorage` integration works).

### 9. Extensibility

This architecture is designed to be easy to grow:

- New features (e.g., due dates, priorities, tags) can be added to the `Todo` type and handled in `useTodos`.
- Additional pages (e.g., About, Settings) can be added under `src/pages/`.
- Shared UI pieces can graduate into a `src/components/common/` or `src/ui/` folder as the app grows.

