import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { FontFamily } from "../types/schema";

const loadedFonts = new Set<string>();

export const loadSpecificFont = (font: FontFamily = "Outfit") => {
  if (loadedFonts.has(font)) return;

  switch (font) {
    case "Outfit":
      loadOutfit("normal", {
        weights: ["500", "700", "800", "900"],
        subsets: ["latin"],
        ignoreTooManyRequestsWarning: true,
      });
      break;
    case "Inter":
      loadInter("normal", {
        weights: ["500", "700", "800", "900"],
        subsets: ["latin"],
        ignoreTooManyRequestsWarning: true,
      });
      break;
    case "SpaceGrotesk":
      loadSpaceGrotesk("normal", {
        weights: ["500", "700"],
        subsets: ["latin"],
        ignoreTooManyRequestsWarning: true,
      });
      break;
    case "PlusJakartaSans":
      loadPlusJakartaSans("normal", {
        weights: ["500", "700", "800"],
        subsets: ["latin"],
        ignoreTooManyRequestsWarning: true,
      });
      break;
    case "Montserrat":
      loadMontserrat("normal", {
        weights: ["500", "700", "800", "900"],
        subsets: ["latin"],
        ignoreTooManyRequestsWarning: true,
      });
      break;
    default:
      loadOutfit("normal", {
        weights: ["500", "700", "800", "900"],
        subsets: ["latin"],
        ignoreTooManyRequestsWarning: true,
      });
      break;
  }
  loadedFonts.add(font);
};

export const getFontFamilyName = (font: FontFamily = "Outfit"): string => {
  loadSpecificFont(font);
  switch (font) {
    case "Outfit":
      return "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
    case "Inter":
      return "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    case "SpaceGrotesk":
      return "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
    case "PlusJakartaSans":
      return "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
    case "Montserrat":
      return "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif";
    default:
      return "'Outfit', sans-serif";
  }
};
