import { useContext } from "react";

import { ThemeContext }
from "../context/ThemeContext";

function ThemeToggle() {

    const { toggleTheme, theme } =
        useContext(ThemeContext);

    return (

        <button onClick={toggleTheme}>

            {theme === "light"
                ? "Dark Mode"
                : "Light Mode"}

        </button>
    );
}

export default ThemeToggle;