/* Observatorio Carmesí: single-screen instrument layout; the field stays dominant and the controls stay peripheral. */
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

export default function App() {
  return <ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Home /></TooltipProvider></ThemeProvider>;
}
