import i18n from "../i18n";

function LanguageSwitcher() {

    const changeLanguage = (language) => {

        i18n.changeLanguage(language);
    };

    return (

        <select
            onChange={(event) =>
                changeLanguage(
                    event.target.value
                )
            }
        >

            <option value="en">
                English
            </option>

            <option value="ar">
                العربية
            </option>

        </select>
    );
}

export default LanguageSwitcher;