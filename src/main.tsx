import AppProviders from "./app/providers/AppProviders";
import AppRouter from "./app/router/AppRouter";

export default function Main() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
