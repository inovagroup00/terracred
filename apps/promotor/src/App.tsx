import { useSearchParams } from "react-router-dom";
import { Spinner } from "@credshow/ui";
import { usePromoterToken } from "./hooks/usePromoterToken";
import { InvalidUrl } from "./pages/InvalidUrl";
import { InvalidToken } from "./pages/InvalidToken";
import { Home } from "./pages/Home";

export function App() {
  const [params] = useSearchParams();
  const token = (params.get("t") ?? "").trim() || null;
  const state = usePromoterToken(token);

  if (!token) {
    return <InvalidUrl />;
  }

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-orange-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!state.valid) {
    return <InvalidToken message={state.error} />;
  }

  return <Home info={state.data} />;
}
