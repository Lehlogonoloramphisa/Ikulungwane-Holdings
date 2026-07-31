import { toast } from "@/components/ui/use-toast";

const messageFromError = (error, fallback) =>
  error?.message || error?.data?.error || fallback;

export const notifySaved = (description = "Saved successfully. The latest data has been refreshed.") => {
  toast({
    title: "Saved",
    description,
  });
};

export const notifySaveProblem = (error, fallback = "The changes could not be saved.") => {
  toast({
    title: "Save failed",
    description: messageFromError(error, fallback),
    variant: "destructive",
  });
};

export const notifyProblem = (title, error, fallback = "The action could not be completed.") => {
  toast({
    title,
    description: messageFromError(error, fallback),
    variant: "destructive",
  });
};

export const notifyUpdated = (description = "Updated successfully. The latest data has been refreshed.") => {
  toast({
    title: "Updated",
    description,
  });
};

export const notifyDeleted = (description = "Deleted successfully. The latest data has been refreshed.") => {
  toast({
    title: "Deleted",
    description,
  });
};

export const refreshAdminQueries = async (queryClient, queryKeys = []) => {
  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  await Promise.all(queryKeys.map((queryKey) => queryClient.refetchQueries({ queryKey, type: "active" })));
};
