import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const TRANSLATIONS = {

    en: {

        home: "Home",
        login: "Login",
        register: "Create Account",
        profile: "My Profile",
        map: "Navigation",
        logout: "Logout",

        welcome: "Welcome to Khuta Stadium",
        subtitle: "Book matches, choose your seat, and navigate inside the stadium easily.",
        getStarted: "Get Started",

        email: "Email",
        password: "Password",
        name: "Name",
        gender: "Gender",
        male: "Male",
        female: "Female",
        age: "Age",
        phone: "Phone",

        noAccount: "Don't have an account?",
        createAccount: "Create one",
        forgotQuestion: "Forgot your password?",
        resetPassword: "Reset password",
        loading: "Loading...",

        saveChanges: "Save Changes",

        mainTitle: "Journey Map",
        mainSubtitle: "Every step you take shapes your future. Explore your upcoming milestones",
        findRoute: "Find Best Route",
        backendRouting: "Backend routing area",
        startPoint: "Your Current Location / Start point",
        destination: "Destination",
        notSelected: "Not selected",
        dijkstraOutput: "Dijkstra route output",
        clearSelection: "Clear Selection",
        mapLegend: "Map Legend",
        routeMsg: "Select a gate and a seat to preview the route",
        locationSelected: "Location selected",
        gateClickArea: "Gate selected successfully",
        gate3d: "Gate 3D on the wall",

        statusAvailable: "Available",
        statusReserved: "Reserved",
        statusSold: "Sold",

        tickets: "Tickets",
        myBookings: "My Bookings",
        favorites: "My Favorites",
        payment: "Payment",
        seatMap: "Seat Map",

        bookNow: "Book Now",
        confirmPayment: "Confirm Payment",
        selectSeat: "Select Seat",

        available: "Available",
        reserved: "Reserved",
        sold: "Sold",

        ticketPrice: "Ticket Price",
        matchDetails: "Match Details",
        stadiumGate: "Stadium Gate",
        seatNumber: "Seat Number",

        upcomingTickets: "Upcoming Tickets",
        bookingSuccess: "Booking Successful",
        cancelBooking: "Cancel Booking",

        favoriteClubMatches: "Favorite Club Matches",

        liveMatches: "Live Matches",
        latestMatches: "Latest Matches",

        viewDetails: "View Details",
        bookTicket: "Book Ticket",

        ticketHeroSubtitle: "Choose your match and enjoy the stadium experience",
        availableMatches: "Available Matches",
        startsFrom: "Starts from",
        priceByCategory: "Depends on selected category",
        noTicketsFound: "No tickets found",
        scanAtGate: "Scan at gate",

        paymentDetails: "Payment Details",
        cardHolder: "Card holder name",
        cardNumber: "Card number",

        reviewBooking: "Review your booking before payment",
        successSub: "Your booking has been completed successfully",
        noBookingSelected: "No booking selected.",
        fillCardError: "Please fill all card details correctly",

        selected: "Selected",
        noSeatsSelected: "No seats selected yet",
        back: "Back",
        total: "Total",

        myBookingsSub: "View and manage your booked tickets",

        loginSubtitle: "Welcome back to Khuta Stadium",
        registerSubtitle: "Join Khuta Stadium today",

        fullName: "Full Name",
        confirmPassword: "Confirm Password",
        passwordsNotMatch: "Passwords do not match",
        haveAccount: "Already have an account?",
        select: "Select",

        resetPasswordSubtitle: "Enter your email and we will send you reset instructions",
        backToLogin: "Back to login",

        profileSubtitle: "Manage your personal information",
        profileUpdated: "Profile updated successfully"
    },

    ar: {

        home: "الرئيسية",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        profile: "ملفي الشخصي",
        map: "الملاحة",
        logout: "تسجيل الخروج",

        welcome: "مرحبًا بك في ملعب خُطى",
        subtitle: "احجز المباريات، اختر مقعدك، وتنقل داخل الملعب بسهولة.",
        getStarted: "ابدأ الآن",

        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        name: "الاسم",
        gender: "الجنس",
        male: "ذكر",
        female: "أنثى",
        age: "العمر",
        phone: "رقم الجوال",

        noAccount: "ليس لديك حساب؟",
        createAccount: "إنشاء حساب",
        forgotQuestion: "هل نسيت كلمة المرور؟",
        resetPassword: "تغيير كلمة المرور",
        loading: "جاري التحميل...",

        saveChanges: "حفظ التغير",

        mainTitle: "خريطة الرحلة",
        mainSubtitle: "كل خطوة خطوتها ترسم معالم مستقبلك. استكشف محطاتك القادمة",
        findRoute: "البحث عن أفضل مسار",
        backendRouting: "منطقة حساب المسارات",
        startPoint: "موقعك الحالي / نقطة الانطلاق",
        destination: "وجهتك",
        notSelected: "لم يتم التحديد",
        dijkstraOutput: "حساب المسار الأسرع (خوارزمية دايجسترا)",
        clearSelection: "مسح التحديد",
        mapLegend: "دليل الخريطة",
        routeMsg: "اختر البوابة والمقعد لعرض المسار التوجيهي",
        locationSelected: "تم تحديد الموقع بنجاح",
        gateClickArea: "تم تحديد الـبوابة بنجاح",
        gate3d: "بوابة ثلاثية الأبعاد على الجدار",

        statusAvailable: "متاح",
        statusReserved: "محجوز",
        statusSold: "مباع",

        tickets: "التذاكر",
        myBookings: "حجوزاتي",
        favorites: "النادي المفضل",
        payment: "الدفع",
        seatMap: "خريطة المقاعد",

        bookNow: "احجز الآن",
        confirmPayment: "تأكيد الدفع",
        selectSeat: "اختر المقعد",

        available: "متاح",
        reserved: "محجوز",
        sold: "مباع",

        ticketPrice: "سعر التذكرة",
        matchDetails: "تفاصيل المباراة",
        stadiumGate: "بوابة الملعب",
        seatNumber: "رقم المقعد",

        upcomingTickets: "التذاكر القادمة",
        bookingSuccess: "تم الحجز بنجاح",
        cancelBooking: "إلغاء الحجز",

        favoriteClubMatches: "مباريات النادي المفضل",

        liveMatches: "المباريات المباشرة",
        latestMatches: "آخر المباريات",

        viewDetails: "عرض التفاصيل",
        bookTicket: "حجز تذكرة",

        ticketHeroSubtitle: "اختاري مباراتك وعيشي أجواء الملعب",
        availableMatches: "المباريات المتاحة للحجز",
        startsFrom: "يبدأ من",
        priceByCategory: "حسب الفئة المختارة",
        noTicketsFound: "لا توجد تذاكر",
        scanAtGate: "امسح عند البوابة",

        paymentDetails: "بيانات الدفع",
        cardHolder: "اسم حامل البطاقة",
        cardNumber: "رقم البطاقة",

        reviewBooking: "راجعي الحجز قبل الدفع",
        successSub: "تم إكمال الحجز بنجاح",
        noBookingSelected: "لا يوجد حجز محدد",
        fillCardError: "يرجى تعبئة بيانات البطاقة بشكل صحيح",

        selected: "مختار",
        noSeatsSelected: "لم يتم اختيار مقاعد بعد",
        back: "رجوع",
        total: "المجموع",

        myBookingsSub: "اعرضي وأديري تذاكرك المحجوزة",

        loginSubtitle: "مرحبًا بعودتك إلى ملعب خُطى",
        registerSubtitle: "انضمي إلى ملعب خُطى اليوم",

        fullName: "الاسم الكامل",
        confirmPassword: "تأكيد كلمة المرور",
        passwordsNotMatch: "كلمتا المرور غير متطابقتين",
        haveAccount: "لديك حساب بالفعل؟",
        select: "اختيار",

        resetPasswordSubtitle: "أدخلي بريدك الإلكتروني وسنرسل لك تعليمات تغيير كلمة المرور",
        backToLogin: "العودة لتسجيل الدخول",

        profileSubtitle: "إدارة معلوماتك الشخصية",
        profileUpdated: "تم تحديث الملف الشخصي بنجاح"
    }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {

    const getInitialLang = () => {

        const savedLang =
            localStorage.getItem("lang");

        if (savedLang) {
            return savedLang;
        }

        return navigator.language.startsWith("ar")
            ? "ar"
            : "en";
    };

    const [lang, setLang] =
        useState(getInitialLang);

    useEffect(() => {

        localStorage.setItem("lang", lang);

        document.documentElement.lang = lang;

        document.documentElement.dir =
            lang === "ar"
                ? "rtl"
                : "ltr";

    }, [lang]);

    const toggleLanguage = () => {

        setLang((current) =>
            current === "en"
                ? "ar"
                : "en"
        );
    };

    const t = TRANSLATIONS[lang];

    return (

        <LanguageContext.Provider
            value={{
                lang,
                setLang,
                toggleLanguage,
                t
            }}
        >

            {children}

        </LanguageContext.Provider>
    );
}

export function useLanguage() {

    return useContext(LanguageContext);
}