import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkflowsPage from "@/app/(app)/workflows/page";
import { useWorkflowsQuery } from "@/features/workflows/queries";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/features/workflows/queries", () => ({
  useWorkflowsQuery: vi.fn(),
}));

const mockedUseWorkflowsQuery = vi.mocked(useWorkflowsQuery);

describe("WorkflowsPage integration", () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockedUseWorkflowsQuery.mockReset();
  });

  it("shows loading state", () => {
    mockedUseWorkflowsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useWorkflowsQuery>);

    render(<WorkflowsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockedUseWorkflowsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useWorkflowsQuery>);

    render(<WorkflowsPage />);

    expect(screen.getByText("Failed to load workflows.")).toBeInTheDocument();
  });

  it("shows empty state and allows creating workflow", async () => {
    const user = userEvent.setup();

    mockedUseWorkflowsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 20 } },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWorkflowsQuery>);

    render(<WorkflowsPage />);

    expect(screen.getByText("No workflows yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Workflow" }));
    expect(pushMock).toHaveBeenCalledWith("/workflows/new");
  });

  it("renders rows and supports row/header actions", async () => {
    const user = userEvent.setup();

    mockedUseWorkflowsQuery.mockReturnValue({
      data: {
        data: [
          { id: "wf_1", name: "Workflow One", status: "active", version: 1 },
          { id: "wf_2", name: "Workflow Two", status: "draft", version: 2 },
        ],
        meta: { total: 2, page: 1, limit: 20 },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWorkflowsQuery>);

    render(<WorkflowsPage />);

    expect(screen.getByRole("heading", { name: "Workflows" })).toBeInTheDocument();
    expect(screen.getByText("Workflow One")).toBeInTheDocument();
    expect(screen.getByText("Workflow Two")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New Workflow/i }));
    expect(pushMock).toHaveBeenCalledWith("/workflows/new");

    const viewButtons = screen.getAllByRole("button", { name: "View" });
    expect(viewButtons.length).toBeGreaterThan(0);
    await user.click(viewButtons[0]!);
    expect(pushMock).toHaveBeenCalledWith("/workflows/wf_1");
  });
 });
