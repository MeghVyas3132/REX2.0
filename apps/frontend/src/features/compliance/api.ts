import { apiRequest } from "@/lib/api/client";

export interface ComplianceRecord {
  id: string;
  recordType: "consent" | "legal_basis" | "dsar";
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListComplianceResponse {
  records: ComplianceRecord[];
  total: number;
  page: number;
  limit: number;
}

export const listCompliance = async (recordType: string, page: number = 1, limit: number = 20): Promise<ListComplianceResponse> => {
  return apiRequest<ListComplianceResponse>(`/api/compliance/${recordType}?page=${page}&limit=${limit}`);
};

export const getComplianceRecord = async (recordId: string): Promise<ComplianceRecord> => {
  return apiRequest<ComplianceRecord>(`/api/compliance/records/${recordId}`);
};

export const updateComplianceRecord = async (
  recordId: string,
  input: { status: string; metadata?: Record<string, unknown> },
): Promise<ComplianceRecord> => {
  return apiRequest<ComplianceRecord>(`/api/compliance/records/${recordId}`, {
    method: "PATCH",
    body: input,
  });
};
