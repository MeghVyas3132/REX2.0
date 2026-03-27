import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/Button";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";

describe("ListPageWrapper", () => {
  it("renders loading state and hides content", () => {
    render(
      <ListPageWrapper title="Workflows" isLoading>
        <div>table-content</div>
      </ListPageWrapper>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("table-content")).not.toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <ListPageWrapper title="Workflows" isError errorMessage="Failed to load workflows.">
        <div>table-content</div>
      </ListPageWrapper>,
    );

    expect(screen.getByText("Failed to load workflows.")).toBeInTheDocument();
    expect(screen.queryByText("table-content")).not.toBeInTheDocument();
  });

  it("renders empty state with action", () => {
    render(
      <ListPageWrapper
        title="Workflows"
        isEmpty
        emptyTitle="No workflows yet"
        emptyDescription="Create your first workflow."
        emptyAction={<Button>Create Workflow</Button>}
      >
        <div>table-content</div>
      </ListPageWrapper>,
    );

    expect(screen.getByText("No workflows yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first workflow.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Workflow" })).toBeInTheDocument();
    expect(screen.queryByText("table-content")).not.toBeInTheDocument();
  });

  it("renders content state with title and subtitle", () => {
    render(
      <ListPageWrapper title="Workflows" subtitle="Create and manage workflow definitions">
        <div>table-content</div>
      </ListPageWrapper>,
    );

    expect(screen.getByRole("heading", { name: "Workflows" })).toBeInTheDocument();
    expect(screen.getByText("Create and manage workflow definitions")).toBeInTheDocument();
    expect(screen.getByText("table-content")).toBeInTheDocument();
  });

  it("renders pagination and handles page changes", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <ListPageWrapper title="Workflows" current={2} total={45} pageSize={20} onPageChange={onPageChange}>
        <div>table-content</div>
      </ListPageWrapper>,
    );

    expect(screen.getByText("Showing 21 to 40 of 45")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "← Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

