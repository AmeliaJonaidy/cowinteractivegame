import npLogo from "../assets/logos/np.png";
import nypLogo from "../assets/logos/nyp.png";
import rpLogo from "../assets/logos/rp.avif";
import spLogo from "../assets/logos/sp.png";
import tpLogo from "../assets/logos/tp.png";

export const initialSchools = {
  RP:  { name: "Republic Polytechnic", logo: rpLogo, normalCows: 0, wagyuCows: 0, parts: 0 },
  NYP: { name: "Nanyang Polytechnic",  logo: nypLogo, normalCows: 0, wagyuCows: 0, parts: 0 },
  TP:  { name: "Temasek Polytechnic",  logo: tpLogo, normalCows: 0, wagyuCows: 0, parts: 0 },
  NP:  { name: "Ngee Ann Polytechnic", logo: npLogo, normalCows: 0, wagyuCows: 0, parts: 0 },
  SP:  { name: "Singapore Polytechnic", logo: spLogo, normalCows: 0, wagyuCows: 0, parts: 0 },
};

// fallback badge colors, used if a logo file is missing
export const schoolColors = {
  RP: "#FF6B35",
  NYP: "#4FD1C5",
  TP: "#E8ECF4",
  NP: "#FFD166",
  SP: "#9D8DF1",
};
