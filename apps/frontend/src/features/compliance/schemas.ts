import { z } from "zod";

export const complianceRecordTypeSchema = z.enum(["consent", "legal_basis", "dsar"]);

export const updateComplianceRecordSchema = z.object({
	status: z.string().min(1),
	metadata: z.record(z.unknown()).optional(),
});

export type ComplianceRecordType = z.infer<typeof complianceRecordTypeSchema>;
export type UpdateComplianceRecordInput = z.infer<typeof updateComplianceRecordSchema>;
