import { describe, expect, it } from "vitest";
import {
  createDataSubjectRequestSchema,
  createPublicationSchema,
  respondDataSubjectRequestSchema,
  setWorkflowLegalBasisSchema,
} from "./schemas.js";

describe("new governance schemas", () => {
  it("validates publication payload", () => {
    const parsed = createPublicationSchema.safeParse({
      workflowId: "00000000-0000-0000-0000-000000000123",
      title: "Customer Support Classifier",
      inputSchema: { fields: [] },
      outputDisplay: { type: "json" },
    });
    expect(parsed.success).toBe(true);
  });

  it("validates workflow legal basis payload", () => {
    const parsed = setWorkflowLegalBasisSchema.safeParse({
      workflowId: "00000000-0000-0000-0000-000000000124",
      gdprBasis: "consent",
      purposeDescription: "Process customer support tickets",
      dataCategories: ["personal_contact"],
    });
    expect(parsed.success).toBe(true);
  });

  it("validates dsar create/respond payloads", () => {
    const createParsed = createDataSubjectRequestSchema.safeParse({
      requestType: "access",
      description: "Please provide all data you store about me.",
    });
    const respondParsed = respondDataSubjectRequestSchema.safeParse({
      status: "completed",
      response: "Export prepared and shared via secure channel.",
    });

    expect(createParsed.success).toBe(true);
    expect(respondParsed.success).toBe(true);
  });
});
