import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteTenantUser, updateTenantSettings } from "./api";
import { toast } from "sonner";
import { tenantQueryKeys } from "./queries";

export const useUpdateTenantSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.settings() });
      toast.success("Tenant settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update tenant settings");
    },
  });
};

export const useInviteTenantUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteTenantUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all });
      toast.success("Invitation sent");
    },
    onError: () => {
      toast.error("Failed to invite user");
    },
  });
};
