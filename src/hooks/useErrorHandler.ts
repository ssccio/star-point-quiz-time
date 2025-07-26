import { useCallback } from "react";
import { toast } from "sonner";

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
}

export const useErrorHandler = () => {
  const handleError = useCallback(
    (error: AppError | Error, context?: string) => {
      if (context) {
        console.error("Error in context:", context, error);
      } else {
        console.error("Error:", error);
      }

      // Determine error message based on error type
      let message = "An unexpected error occurred";

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          message =
            "Network error. Please check your connection and try again.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          message = "Authentication failed. Please log in again.";
        } else if (
          error.message.includes("403") ||
          error.message.includes("Forbidden")
        ) {
          message = "You do not have permission to perform this action.";
        } else if (
          error.message.includes("404") ||
          error.message.includes("Not Found")
        ) {
          message = "The requested resource was not found.";
        } else if (
          error.message.includes("500") ||
          error.message.includes("Internal Server Error")
        ) {
          message = "Server error. Please try again later.";
        } else {
          message = error.message || message;
        }
      }

      // Show user-friendly error message
      toast.error(message);

      // In development, also show technical details
      if (process.env.NODE_ENV === "development") {
        console.error("Full error details:", error);
      }
    },
    []
  );

  const handleAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context?: string,
      onError?: (error: AppError) => void
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        const appError = error as AppError;
        if (onError) {
          onError(appError);
        } else {
          handleError(appError, context);
        }
        return null;
      }
    },
    [handleError]
  );

  return { handleError, handleAsync };
};
