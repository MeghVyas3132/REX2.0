import { useQuery } from "@tanstack/react-query";
import { getComplianceRecord, listCompliance } from "./api";

export const complianceQueryKeys = {
  all: ["compliance"] as const,
  list: (recordType: string, page = 1, limit = 20) => ["compliance", "list", recordType, { page, limit }] as const,
  detail: (recordId: string) => ["compliance", "detail", recordId] as const,
};

export const useComplianceQuery = (recordType: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: complianceQueryKeys.list(recordType, page, limit),
    queryFn: () => listCompliance(recordType, page, limit),
    staleTime: 30000,
  });
};

export const useComplianceRecordQuery = (recordId: string) => {
  return useQuery({
    queryKey: complianceQueryKeys.detail(recordId),
    queryFn: () => getComplianceRecord(recordId),
    enabled: Boolean(recordId),
  });
};
