## Product Requirements Document (PRD) – Todo App

### 1. Overview

The Todo app is a simple, single-user task management tool built with React (and Tailwind CSS for styling). It allows a user to create, view, update, and delete tasks, and to track their completion status.

### 2. Goals & Non‑Goals

- **Goals**
  - Provide a fast, minimal UI for managing personal todos.
  - Support basic CRUD (Create, Read, Update, Delete) operations on tasks.
  - Persist todos locally so they survive page refreshes.
  - Be small and easy to extend by developers (clean, documented architecture).

- **Non‑Goals**
  - No multi-user support or authentication.
  - No server-side API or syncing across devices.
  - No advanced project management features (e.g., Kanban, Gantt charts).

### 3. Target Users

- Individuals who need a simple way to manage personal tasks.
- Developers using the project as a reference or starter for React + Tailwind apps.

### 4. User Stories

- **US-1: Create Task**
  - As a user, I want to add a new todo with a title (and optional description) so that I can remember what I need to do.

- **US-2: View Tasks**
  - As a user, I want to see a list of my todos so that I can quickly understand what I need to work on.

- **US-3: Complete / Reopen Task**
  - As a user, I want to mark a todo as completed or reopen it so that I can track what is done and what is still pending.

- **US-4: Edit Task**
  - As a user, I want to edit the text of an existing todo so that I can correct or refine it.

- **US-5: Delete Task**
  - As a user, I want to delete a todo so that I can remove items that are no longer relevant.

- **US-6: Filter Tasks**
  - As a user, I want to filter todos by status (All, Active, Completed) so that I can focus on what matters now.

### 5. Functional Requirements

- **FR-1: Add Todo**
  - The app must allow users to add a todo by entering text and submitting via a button or pressing Enter.
  - Empty titles must be prevented or validated.

- **FR-2: List Todos**
  - The app must display all existing todos in a scrollable list.
  - Each todo shows at least: title, completion state, and controls to toggle completion and delete.

- **FR-3: Toggle Completion**
  - The user must be able to toggle a todo between completed and active (e.g., via checkbox).
  - Completed todos should be visually distinguishable (e.g., strike-through, faded color).

- **FR-4: Edit Todo**
  - The user must be able to change the title of a todo (inline edit or separate form).
  - Changes should be persisted immediately after saving.

- **FR-5: Delete Todo**
  - The user must be able to delete a todo via a dedicated button/icon.
  - Deletion should immediately remove the item from the list.

- **FR-6: Filter / View Modes**
  - The user must be able to switch between All, Active, and Completed views.
  - The currently active filter should be clearly highlighted.

- **FR-7: Local Persistence**
  - Todos must be stored in the browser (e.g., `localStorage`) so that the list persists on page reload.

- **FR-8: Basic Keyboard Accessibility**
  - Adding a todo via the Enter key on the input should be supported.
  - Focus styles must be visible so keyboard users can navigate.

### 6. Non‑Functional Requirements

- **Performance**
  - The app should render instantly for up to ~500 todos on a typical laptop.
  - Interactions (add/edit/delete/toggle) should feel immediate (sub‑100ms).

- **Reliability**
  - Data persistence should be robust against standard refreshes and tab closes.

- **Usability**
  - Clear visual distinction between active and completed tasks.
  - Simple, minimal UI that works well on desktop and mobile viewports.

- **Accessibility**
  - Use semantic HTML (e.g., form, list, buttons).
  - Provide appropriate ARIA attributes where needed (e.g., for filters as tabs).

### 7. Out of Scope (for initial version)

- Authentication and user accounts.
- Collaboration or shared lists.
- Due dates, reminders, and notifications.
- Subtasks, tags, or complex categorization.

### 8. Success Metrics

- The app runs without errors in the browser console.
- A new user can:
  - Create a todo,
  - Mark it as complete,
  - Filter by completed,
  - Edit it,
  - Delete it,
  - Refresh the page and still see remaining todos.

