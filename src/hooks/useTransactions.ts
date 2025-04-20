import { useQuery } from "@tanstack/react-query";
import { auth, getUserTransactions } from "@/lib/firebase";
import { Transaction } from "@/types/transaction";

export function useTransactions() {
  const user = auth.currentUser;

  return useQuery({
    queryKey: ["transactions", user?.uid],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return getUserTransactions(user.uid);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}
