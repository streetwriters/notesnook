const accents = [
  { label: "orange", code: "#FF5722" },
  { label: "yellow", code: "#FFA000" },
  { label: "green", code: "#1B5E20" },
  { label: "green2", code: "#008837" },
  { label: "gray", code: "#757575" },
  { label: "blue", code: "#0560ff" },
  { label: "teal", code: "#009688" },
  { label: "lightblue", code: "#2196F3" },
  { label: "indigo", code: "#880E4F" },
  { label: "purple", code: "#9C27B0" },
  { label: "pink", code: "#FF1744" },
  { label: "red", code: "#B71C1C" },
];

export function getDefaultAccentColor() {
  return accents.find((a) => a.label === "green2").code;
}

export default accents;
