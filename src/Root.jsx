import { lazy, Suspense } from "react";
import App from "./App.jsx";
import { useHashRoute } from "./hooks/useHashRoute.js";

const PrivacyPolicy = lazy(() =>
  import("./pages/PrivacyPolicy").then((m) => ({ default: m.PrivacyPolicy })),
);

/** Top-level screen switch. The app itself is a single fullscreen surface. */
export default function Root() {
  const route = useHashRoute();

  if (route === "privacy-policy") {
    return (
      <Suspense fallback={null}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  return <App />;
}
