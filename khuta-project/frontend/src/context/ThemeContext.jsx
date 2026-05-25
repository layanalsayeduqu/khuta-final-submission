import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const ThemeContext = createContext();

function ThemeProvider({ children }) {

    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem("theme");

        if (savedTheme) {
            return savedTheme;
        }

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((current) =>
            current === "light" ? "dark" : "light"
        );
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                toggleTheme
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeProvider;

export function useTheme() {
    return useContext(ThemeContext);
}