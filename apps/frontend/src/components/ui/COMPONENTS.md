# UI Components Library Documentation

This file documents all the UI components available in the REX 2.0 frontend UI library. These components are designed to provide a consistent, accessible, and reusable interface throughout the application.

## Table of Contents

1. [Base Components](#base-components)
2. [Data Display Components](#data-display-components)
3. [Feature Components](#feature-components)
4. [Usage Guide](#usage-guide)
5. [Styling System](#styling-system)

## Base Components

### Button

A versatile button component with multiple variants.

```typescript
import { Button } from "@/components/ui";

export function MyComponent() {
  return (
    <>
      <Button onClick={() => alert('Primary')}>Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="danger">Delete</Button>
      <Button loading>Loading...</Button>
    </>
  );
}
```

**Props:**
- `variant`: "primary" | "secondary" | "danger" (default: "primary")
- `loading`: boolean (default: false)
- Standard HTML button attributes

### Card

Container component for content sections.

```typescript
import { Card } from "@/components/ui";

export function MyComponent() {
  return (
    <Card title="Card Title">
      <p>Your content here</p>
    </Card>
  );
}
```

**Props:**
- `title`: string (optional)
- `children`: React.ReactNode
- `className`: string (optional)

### Input

Text input component with optional styling.

```typescript
import { Input } from "@/components/ui";

export function MyComponent() {
  const [value, setValue] = useState("");
  
  return (
    <Input 
      type="text"
      placeholder="Enter text..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

**Props:**
- Standard HTML input attributes

### Select

Dropdown select component.

```typescript
import { Select } from "@/components/ui";

export function MyComponent() {
  return (
    <Select
      label="Choose an option"
      options={[
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" },
      ]}
      error="This field is required"
    />
  );
}
```

**Props:**
- `label`: string (optional)
- `error`: string (optional)
- `options`: Array<{ value: string; label: string }>
- Standard HTML select attributes

### Table

Simple table component for displaying tabular data.

```typescript
import { Table } from "@/components/ui";

export function MyComponent() {
  const columns = ["Name", "Email", "Status"];
  const rows = [
    ["John Doe", "john@example.com", "Active"],
    ["Jane Smith", "jane@example.com", "Inactive"],
  ];
  
  return <Table columns={columns} rows={rows} />;
}
```

**Props:**
- `columns`: string[] - Column headers
- `rows`: (React.ReactNode | undefined)[][] - Table data

### Modal

Modal dialog component for displaying content in an overlay.

```typescript
import { Modal, Button } from "@/components/ui";
import { useState } from "react";

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        actions={[
          { label: "Save", onClick: () => setIsOpen(false) },
        ]}
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string (optional)
- `children`: React.ReactNode
- `actions`: Array<{ label: string; onClick: () => void; variant?: "primary" | "secondary" | "danger" }> (optional)

### ConfirmDialog

A specialized modal for confirmation actions.

```typescript
import { ConfirmDialog, Button } from "@/components/ui";
import { useState } from "react";

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete</Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this item?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          console.log("Deleted");
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
```

**Props:**
- `isOpen`: boolean
- `title`: string
- `message`: string
- `onConfirm`: () => void
- `onCancel`: () => void
- `confirmLabel`: string (default: "Confirm")
- `cancelLabel`: string (default: "Cancel")
- `confirmVariant`: "primary" | "danger" (default: "primary")

## Data Display Components

### KeyValueList

Display key-value pairs in a structured grid layout.

```typescript
import { KeyValueList } from "@/components/ui";

export function MyComponent() {
  const items = [
    { key: "Name", value: "John Doe" },
    { key: "Email", value: "john@example.com" },
    { key: "Status", value: <StatusBadge status="active" /> },
  ];
  
  return <KeyValueList items={items} />;
}
```

**Props:**
- `items`: Array<{ key: string; value: React.ReactNode }>

### CodeBlock

Display code with syntax highlighting context.

```typescript
import { CodeBlock } from "@/components/ui";

export function MyComponent() {
  return (
    <CodeBlock 
      code={`const hello = "world";\nconsole.log(hello);`}
      language="javascript"
    />
  );
}
```

**Props:**
- `code`: string
- `language`: string (default: "text")

### Timeline

Display a vertical timeline of events or steps.

```typescript
import { Timeline } from "@/components/ui";

export function MyComponent() {
  const items = [
    { id: "1", title: "Step 1", status: "success", timestamp: "10:30 AM" },
    { id: "2", title: "Step 2", status: "pending", description: "In progress..." },
    { id: "3", title: "Step 3", status: "skipped" },
  ];
  
  return <Timeline items={items} />;
}
```

**Props:**
- `items`: Array<{
    id: string;
    title: string;
    description?: string;
    status?: "success" | "error" | "pending" | "skipped";
    timestamp?: string;
  }>

**Status Colors:**
- `success`: Green (#10b981)
- `error`: Red (#ef4444)
- `pending`: Amber (#f59e0b)
- `skipped`: Gray (#6b7280)

### Pagination

Pagination controls for navigating through pages of data.

```typescript
import { Pagination } from "@/components/ui";
import { useState } from "react";

export function MyComponent() {
  const [page, setPage] = useState(1);
  
  return (
    <Pagination
      current={page}
      total={100}
      pageSize={20}
      onPageChange={setPage}
    />
  );
}
```

**Props:**
- `current`: number - Current page number
- `total`: number - Total number of items
- `pageSize`: number (default: 20)
- `onPageChange`: (page: number) => void

## Feature Components

### DebugPanel

Collapsible debug information panel showing JSON data.

```typescript
import { DebugPanel } from "@/components/ui";

export function MyComponent() {
  const debugData = {
    timestamp: new Date().toISOString(),
    userId: "123",
    metadata: { version: "1.0.0" },
  };
  
  return (
    <DebugPanel 
      data={debugData}
      title="Request Debug Info"
      defaultOpen={false}
    />
  );
}
```

**Props:**
- `data`: Record<string, unknown> (default: {})
- `title`: string (default: "Debug Info")
- `defaultOpen`: boolean (default: false)

### WorkflowViewer

Visualize workflow execution with node status indicators.

```typescript
import { WorkflowViewer } from "@/components/ui";

export function MyComponent() {
  const nodes = [
    { id: "1", name: "Validate Input", status: "success", duration: 102 },
    { id: "2", name: "Process Data", status: "success", duration: 250 },
    { id: "3", name: "Save Results", status: "pending" },
  ];
  
  return <WorkflowViewer nodes={nodes} />;
}
```

**Props:**
- `nodes`: Array<{
    id: string;
    name: string;
    status: "success" | "error" | "pending" | "skipped";
    duration?: number;
  }>
- `compact`: boolean (default: false) - Show as dots instead of full view

### QueryResults

Display query results with pagination, loading, and error states.

```typescript
import { QueryResults } from "@/components/ui";
import { useState } from "react";

export function MyComponent() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const results = [
    { id: "1", name: "Item 1", status: "active" },
    { id: "2", name: "Item 2", status: "inactive" },
  ];
  
  return (
    <QueryResults
      results={results}
      columns={["name", "status"]}
      total={42}
      page={page}
      pageSize={20}
      onPageChange={setPage}
      loading={loading}
      error={undefined}
    />
  );
}
```

**Props:**
- `results`: Array<QueryResult>
- `columns`: string[]
- `total`: number
- `page`: number
- `pageSize`: number (default: 20)
- `onPageChange`: (page: number) => void
- `loading`: boolean (default: false)
- `error`: string (optional)

### AlertBanner

Display contextual alerts and notifications.

```typescript
import { AlertBanner } from "@/components/ui";

export function MyComponent() {
  return (
    <>
      <AlertBanner 
        message="Operation completed successfully!"
        type="success"
        dismissible={true}
      />
      <AlertBanner 
        message="An error occurred while saving"
        type="error"
        icon="❌"
      />
    </>
  );
}
```

**Props:**
- `message`: string
- `type`: "info" | "success" | "warning" | "error" (default: "info")
- `dismissible`: boolean (default: true)
- `icon`: string (optional)

**Type Display:**
- `info`: Blue background with ℹ️ icon
- `success`: Green background with ✓ icon
- `warning`: Amber background with ⚠ icon
- `error`: Red background with ✕ icon

## Usage Guide

### Installation

These components are already integrated into the frontend app at `src/components/ui/`. Simply import them as needed:

```typescript
import { 
  Button, 
  Card, 
  Modal,
  KeyValueList,
  Timeline,
  AlertBanner 
} from "@/components/ui";
```

### Styling System

All components use CSS variables for theming:

- `--bg`: Background color
- `--text`: Primary text color
- `--text-secondary`: Secondary text color
- `--border`: Border color
- `--danger`: Danger/destructive action color

### Common Patterns

#### Loading State

```typescript
<Button loading={isLoading} onClick={handleSubmit}>
  Submit
</Button>
```

#### Error Handling

```typescript
{error && (
  <AlertBanner message={error} type="error" />
)}
```

#### Confirmation Workflows

```typescript
const [confirmDelete, setConfirmDelete] = useState(false);

return (
  <>
    <Button onClick={() => setConfirmDelete(true)}>Delete</Button>
    <ConfirmDialog
      isOpen={confirmDelete}
      title="Confirm Delete"
      message="This action cannot be undone"
      confirmLabel="Delete"
      confirmVariant="danger"
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(false)}
    />
  </>
);
```

#### Data Display with Pagination

```typescript
const [page, setPage] = useState(1);

return (
  <QueryResults
    results={filteredResults.slice((page - 1) * 20, page * 20)}
    columns={['id', 'name', 'created']}
    total={filteredResults.length}
    page={page}
    onPageChange={setPage}
  />
);
```

## Accessibility

All components follow accessibility best practices:

- Keyboard navigation support
- Screen reader compatibility
- Semantic HTML structure
- ARIA labels where appropriate
- Focus management in modals

## Types

Type definitions for all components are available:

```typescript
import type { 
  ButtonProps, 
  CardProps, 
  ModalProps,
  AlertBannerProps 
} from "@/components/ui";
```

## Contributing

When adding new components:

1. Follow the existing naming conventions
2. Document props with JSDoc comments
3. Add usage examples
4. Ensure keyboard accessibility
5. Test with screen readers
6. Update this documentation
