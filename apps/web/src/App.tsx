import { useState } from "react";

import FindingsReview from "./findings/FindingsReview";

export default function App() {
  const [search, setSearch] = useState(() => window.location.search);
  return (
    <FindingsReview
      search={search}
      onSearch={(next) => {
        window.history.replaceState(null, "", next);
        setSearch(next);
      }}
    />
  );
}
