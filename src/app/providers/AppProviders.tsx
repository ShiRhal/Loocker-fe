import { ReactNode } from "react";
import AuthProvider from "./auth/AuthProvider";

type Props = { children: ReactNode };

export default function AppProviders({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>;
}
