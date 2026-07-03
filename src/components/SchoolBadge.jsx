import { useState } from "react";
import { schoolColors } from "../data/schools";

export default function SchoolBadge({ id, logo, size = 48 }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className="flex items-center justify-center rounded-full font-display font-bold"
        style={{
          width: size,
          height: size,
          background: schoolColors[id],
          color: "#0B0E1A",
          fontSize: size * 0.4,
        }}
      >
        {id}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={`${id} logo`}
      width={size}
      height={size}
      className="rounded-full object-contain bg-white/5"
      onError={() => setErrored(true)}
    />
  );
}