import { createContext, useContext, type ReactNode } from 'react';
import { colors } from './colors';

type ThemeContextValue = { colors: typeof colors };

const ThemeContext = createContext<ThemeContextValue>({ colors });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
