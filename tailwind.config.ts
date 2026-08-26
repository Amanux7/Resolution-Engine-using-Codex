import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#0B1F33", muted: "#60758A", paper: "#FFFFFF", canvas: "#F7F5F0", line: "#D8E1EA", brand: {50:"#EEF3F7",100:"#DCE8F1",500:"#173B5E",600:"#102E4B",700:"#071827"}, amber:{50:"#FFF7E6",600:"#9A6500"}, danger:{50:"#FFF0ED",600:"#A83E32"} }, boxShadow: { soft: "0 12px 35px rgba(7,24,39,.08)" } } }, plugins: [require("@tailwindcss/forms")] } satisfies Config;

