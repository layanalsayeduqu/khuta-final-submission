from locust import HttpUser, task, between, events
from collections import defaultdict
import random
import json
import threading


BASE_URL = "http://localhost:8000"


TEST_USERS = [
    {"email": "talaalhazmi1426@gmail.com", "password": "TALA1234"},
    {"email": "talaalhazmi1426@icloud.com", "password": "TALA12345"},
]

MATCH_ID = 1         
RACE_SEAT = "N1-R1-S1" 

START_COORDS = {"start_lon": 39.12256784, "start_lat": 22.089924, "floor": 1}
EXIT_COORDS  = {"end_lon":   39.12263120, "end_lat":   22.089924, "floor": 1}
POI_FLOOR    = "floor=1"
POI_TYPE = "poi_cat_id=restroom"



race_results = defaultdict(int)
race_lock = threading.Lock()


class NormalUser(HttpUser):
    """
    يمثل مستخدم عادي يفتح التطبيق قبل المباراة:
    يسجل دخول ← يشوف المباريات ← يشوف المقاعد ← يشتري تذكرة
    """
    wait_time = between(1, 3)
    weight = 60 

    def on_start(self):
        """يشتغل مرة وحدة عند بداية كل مستخدم وهمي"""
        self.token = None
        self.do_login()

    def do_login(self):
        user = random.choice(TEST_USERS)
        response = self.client.post(
            "/auth/login",
            json=user,
            name="[1] Login"
        )
        if response.status_code == 200:
            self.token = response.json().get("token")

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(1)
    def get_matches(self):
        """يشوف قائمة المباريات"""
        self.client.get("/api/tickets/matches", name="[1] Get Matches")

    @task(2)
    def get_seats(self):
        """يشوف المقاعد المتاحة"""
        self.client.get(
            f"/api/seats/matches/{MATCH_ID}",
            name="[1] Get Seats"
        )

    @task(1)
    def purchase_ticket(self):
        """يشتري تذكرة بمقعد عشوائي"""
        if not self.token:
            return

        seat_num = random.randint(1, 999)
        section  = random.choice(["A", "B", "C", "D"])
        row      = random.randint(1, 20)
        seat_label = f"{section}-{row}-{seat_num:02d}"

        self.client.post(
            "/api/payment/purchase",
            json={
                "match_id": MATCH_ID,
                "seat_label": seat_label,
                "amount": 75.0,
                "payment_method": "card",
                "card_last4": "1234"
            },
            headers=self.auth_headers(),
            name="[1] Purchase Ticket"
        )

    @task(1)
    def get_bookings(self):
        """يشوف حجوزاته"""
        if not self.token:
            return
        self.client.get(
            "/api/bookings/",
            headers=self.auth_headers(),
            name="[1] Get Bookings"
        )

\
class PostMatchUser(HttpUser):
    """
    يمثل مستخدم بعد انتهاء المباراة:
    يبحث عن أقرب مخرج ← يطلب مسار للمخرج
    هذا أعلى سيناريو ضغط على الـ pgRouting
    """
    wait_time = between(0.5, 1.5)
    weight = 90 #

    @task(3)
    def find_nearest_exit(self):
        """يبحث عن أقرب مخرج — أكثر طلب بعد المباراة"""
        lon = START_COORDS["start_lon"] + random.uniform(-0.001, 0.001)
        lat = START_COORDS["start_lat"] + random.uniform(-0.001, 0.001)

        self.client.get(
            f"/directions/near/coords={lon},{lat}/{POI_FLOOR}/{POI_TYPE}",
            name="[2] Nearest Exit"
        )

    @task(2)
    def get_route_to_exit(self):
        """يطلب مسار من موقعه للمخرج"""
        params = {
            **START_COORDS,
            **EXIT_COORDS
        }
        self.client.get(
            "/directions/coords",
            params=params,
            name="[2] Route to Exit"
        )

    @task(1)
    def get_route_poi_to_poi(self):
        """يتنقل بين مرافق الملعب"""
        start_id = random.randint(1, 10)
        end_id   = random.randint(11, 20)
        self.client.get(
            f"/directions/poi-to-poi?start_poi_id=poi={start_id}&end_poi_id=poi={end_id}",
            name="[2] POI to POI Route"
        )


class RaceConditionUser(HttpUser):
    """
    يمثل اختبار الـ race condition:
    100 مستخدم يحاولون شراء نفس المقعد في نفس الوقت
    النتيجة الصحيحة: 1 ينجح فقط
    """
    wait_time = between(0, 0.1)  
    weight = 10  

    def on_start(self):
        self.token = None
        self.do_login()

    def do_login(self):
        user = random.choice(TEST_USERS)
        response = self.client.post(
            "/auth/login",
            json=user,
            name="[3] Race - Login"
        )
        if response.status_code == 200:
            self.token = response.json().get("token")

    @task
    def race_purchase(self):
        """كل المستخدمين يشترون نفس المقعد"""
        if not self.token:
            return

        response = self.client.post(
            "/api/payment/purchase",
            json={
                "match_id": MATCH_ID,
                "seat_label": RACE_SEAT,
                "amount": 75.0,
                "payment_method": "card",
                "card_last4": "9999"
            },
            headers={"Authorization": f"Bearer {self.token}"},
            name="[3] Race - Same Seat Purchase"
        )

        # نحسب النتائج
        with race_lock:
            if response.status_code == 200:
                race_results["success"] += 1
            elif response.status_code == 400:
                race_results["rejected"] += 1
            else:
                race_results["other"] += 1

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print("\n" + "=" * 50)
    print("Race Condition Test Results:")
    print(f"  Success:  {race_results['success']} request(s)")
    print(f"  Rejected: {race_results['rejected']} request(s)")
    print(f"  Other:    {race_results['other']} request(s)")
 
    if race_results["success"] == 1:
        print("  PASS: Seat was sold to exactly one user — race condition is fixed")
    elif race_results["success"] > 1:
        print(f"  FAIL: Seat was sold {race_results['success']} times — race condition detected!")
