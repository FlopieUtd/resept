import { supabase } from "./supabase";

export const requestWithAuthRetry = async <T>(
  fn: () => Promise<{ data: T; error: any }>
): Promise<T> => {
  const first = await fn();
  if (!first.error) {
    return first.data;
  }

  const message: string = first.error?.message ?? "";
  const code: string | undefined = first.error?.code;
  const isAuthExpired =
    code === "PGRST301" ||
    code === "PGRST303" ||
    /invalid\s*jwt/i.test(message) ||
    /jwt\s*expired/i.test(message) ||
    /expired\s*token/i.test(message);

  if (!isAuthExpired) {
    throw first.error;
  }

  await supabase.auth.refreshSession();
  const second = await fn();
  if (second.error) {
    throw second.error;
  }
  return second.data;
};
