import sqlite3
import os
import random
from datetime import datetime, timedelta

# Define paths
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app.db")

# Products structure
PRODUCTS = [
    {"id": "noise_watch_5", "name": "Noise ColorFit Pro 5", "brand": "Noise", "category": "smartwatch", "launched_at": "2025-11-15"},
    {"id": "boat_wave_sigma", "name": "boAt Wave Sigma", "brand": "boAt", "category": "smartwatch", "launched_at": "2025-12-01"},
    {"id": "fireboltt_gladiator", "name": "Fire-Boltt Gladiator", "brand": "Fire-Boltt", "category": "smartwatch", "launched_at": "2025-11-20"},
    {"id": "noise_buds_104", "name": "Noise Buds VS104", "brand": "Noise", "category": "audio", "launched_at": "2025-10-10"},
    {"id": "boat_airdopes_141", "name": "boAt Airdopes 141", "brand": "boAt", "category": "audio", "launched_at": "2025-10-05"}
]

# Aspect templates for generating reviews
SMARTWATCH_TEMPLATES = {
    "battery": {
        "positive": [
            ("Great battery backup. Easily lasts 7 days with normal use.", "battery", "battery backup lasts 7 days"),
            ("Battery is amazing, charges fully in an hour and stays for a week.", "battery", "charges fully in hour and stays week"),
            ("Awesome battery life! No need to carry charger on weekend trips.", "battery", "no need charger on weekend trips")
        ],
        "negative": [
            ("Battery drains within 24 hours if Bluetooth calling is active.", "battery", "battery drains within 24 hours"),
            ("Very poor battery backup, needs to be charged daily.", "battery", "charged daily"),
            ("Battery life is disappointing. Hardly lasts 1.5 days.", "battery", "hardly lasts 1.5 days")
        ]
    },
    "display": {
        "positive": [
            ("The AMOLED screen looks beautiful, display is crisp and bright.", "display", "AMOLED screen looks beautiful"),
            ("Superb brightness, screen is easily visible under bright sunlight.", "display", "visible under bright sunlight"),
            ("The touch response is fluid and display colors are vivid.", "display", "vivid display colors")
        ],
        "negative": [
            ("Screen brightness is weak outdoors. Hard to read messages.", "display", "weak outdoors"),
            ("Display developed a vertical line within 2 weeks of use.", "display", "vertical line on display"),
            ("Touchscreen is laggy, scroll has latency.", "display", "touchscreen is laggy")
        ]
    },
    "strap": {
        "positive": [
            ("Strap feels very premium and soft on skin. Very comfortable.", "strap", "premium and soft strap"),
            ("Strap quality is superb for this price range. Easy to swap.", "strap", "easy to swap"),
            ("Skin-friendly silicone strap, no itching even after wearing all day.", "strap", "skin-friendly silicone strap")
        ],
        "negative": [
            ("Strap broke within 10 days of normal wear. Pathetic quality.", "strap", "strap broke within 10 days"),
            ("Strap color is fading and the lock buckle is very loose.", "strap", "buckle is very loose"),
            ("The material is rough and causes rashes on wrist.", "strap", "causes rashes on wrist")
        ]
    },
    "connectivity": {
        "positive": [
            ("Bluetooth calling is crystal clear. Pairs instantly with my iPhone.", "connectivity", "crystal clear bluetooth calling"),
            ("Excellent connectivity, calls don't drop at all.", "connectivity", "calls don't drop"),
            ("Connects smoothly. NoiseFit app syncs all data quickly.", "connectivity", "syncs all data quickly")
        ],
        "negative": [
            ("Frequently disconnects from my Android device. Annoying.", "connectivity", "frequently disconnects"),
            ("Bluetooth calling voice breaks, mic volume is very low.", "connectivity", "voice breaks, low mic volume"),
            ("App sync fails half the time. App interface is bloated.", "connectivity", "app sync fails")
        ],
        "anomaly": [
            ("Worst purchase! Keep getting 'Bluetooth disconnected' alert every 5 minutes.", "connectivity", "disconnects every 5 minutes"),
            ("After the recent software update, the Bluetooth pairing keeps failing completely.", "connectivity", "pairing keeps failing"),
            ("Completely broke connectivity. App cannot pair with watch anymore. Absolute trash.", "connectivity", "app cannot pair with watch"),
            ("Bluetooth calling shows call failed constantly. Connection sync is dead.", "connectivity", "connection sync is dead")
        ]
    },
    "sensors": {
        "positive": [
            ("Step counter and heart rate monitor are quite accurate.", "sensors", "sensors are accurate"),
            ("SpO2 tracking is quick and matches my medical oximeter.", "sensors", "matches medical oximeter"),
            ("Sleep tracking is accurate, details deep sleep correctly.", "sensors", "sleep tracking is accurate")
        ],
        "negative": [
            ("Step counter is useless. Counts steps even when I'm driving.", "sensors", "counts steps when driving"),
            ("Heart rate monitor gives random high readings when sitting idle.", "sensors", "random high readings"),
            ("Fitness tracking stats are highly inaccurate compared to Apple watch.", "sensors", "stats are highly inaccurate")
        ]
    },
    "price": {
        "positive": [
            ("Absolute value for money. Best smartwatch under 3000.", "price", "value for money"),
            ("At this price, you cannot get a better option. Go for it.", "price", "best option under this budget")
        ],
        "negative": [
            ("Overpriced. Similar features are available for much cheaper.", "price", "overpriced"),
            ("Not worth the amount. Build quality is cheap for this budget.", "price", "not worth the amount")
        ]
    }
}

AUDIO_TEMPLATES = {
    "sound": {
        "positive": [
            ("Sound quality is superb, bass is deep and clear.", "sound", "superb sound, deep bass"),
            ("Highs and mids are crisp, perfect for acoustic music.", "sound", "highs and mids are crisp"),
            ("Active Noise Cancellation is very effective at this price.", "sound", "effective ANC")
        ],
        "negative": [
            ("Sound is too shrill at 80% volume. Treble hurts ears.", "sound", "shrill sound, treble hurts"),
            ("Very weak bass, sound feels flat and metallic.", "sound", "weak bass, flat sound"),
            ("ANC is non-existent, just blocks a tiny bit of fan hum.", "sound", "ANC is non-existent")
        ]
    },
    "battery": {
        "positive": [
            ("Case battery easily lasts 40 hours. Quick charge works great.", "battery", "battery lasts 40 hours"),
            ("Earbuds last 7-8 hours on a single charge. Impressive.", "battery", "earbuds last 7-8 hours")
        ],
        "negative": [
            ("Right earbud drains in 2 hours while left works fine.", "battery", "right earbud drains fast"),
            ("Charging case stopped working after a month. Won't hold charge.", "battery", "case won't hold charge")
        ]
    },
    "connectivity": {
        "positive": [
            ("Instant wake and pair when opening the lid. Bluetooth 5.3 works well.", "connectivity", "instant wake and pair"),
            ("Zero latency while gaming, dual pairing works seamlessly.", "connectivity", "zero latency")
        ],
        "negative": [
            ("Audio lags behind video by half a second. Gaming is impossible.", "connectivity", "audio lags behind video"),
            ("Left earbud keeps losing connection frequently.", "connectivity", "losing connection frequently")
        ]
    },
    "mic": {
        "positive": [
            ("Mic quality is clear during office Zoom calls, no complaints.", "mic", "clear mic for calls"),
            ("The quad mics filter out background traffic noise nicely.", "mic", "filters out traffic noise")
        ],
        "negative": [
            ("Worst mic. In calls, the other person hears a muffled voice.", "mic", "muffled voice in calls"),
            ("Background noise cancellation on mic is terrible, catches everything.", "mic", "terrible mic noise cancellation")
        ]
    },
    "comfort": {
        "positive": [
            ("Fits snugly in my ear, doesn't fall out during gym workouts.", "comfort", "fits snugly, doesn't fall out"),
            ("Very lightweight and comfortable for long music sessions.", "comfort", "lightweight and comfortable")
        ],
        "negative": [
            ("Earbuds are too bulky, ears start hurting after 30 minutes.", "comfort", "bulky, ears start hurting"),
            ("Keeps slipping out of the ear. Silicone tips are of bad shape.", "comfort", "keeps slipping out")
        ]
    },
    "price": {
        "positive": [
            ("Value deal! Exceptional value under 2000 rupees.", "price", "exceptional value"),
            ("Good features for the price. Recommend for budget buyers.", "price", "good features for price")
        ],
        "negative": [
            ("Too expensive for such cheap plastic build.", "price", "too expensive for cheap build"),
            ("Better to buy other competitors who offer better sound in this range.", "price", "better competitor options")
        ]
    }
}

# Names & Usernames
AUTHORS = ["Rahul S.", "Priya Sharma", "Amit Patel", "Anjali K.", "Vikram Singh", "Sneha R.", "Rajesh M.", "Neha Gupta", "Rohit B.", "Komal T.", "Siddharth", "Pooja V.", "Divya", "Karan J.", "Manish", "Sunita"]
TITLES_POS = ["Awesome Product!", "Best in segment", "Value for money", "Highly recommended", "Satisfied with purchase", "Superb!", "Good battery & display", "Great build quality"]
TITLES_NEG = ["Disappointed", "Not worth the money", "Strap broke/cheap quality", "Defective piece", "Battery issues", "connectivity is bad", "Average product", "Worst experience"]

def setup_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        brand TEXT,
        category TEXT,
        launched_at DATE
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        author TEXT,
        rating INTEGER,
        title TEXT,
        text TEXT,
        date DATE,
        source TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS aspect_sentiments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_id TEXT,
        aspect TEXT,
        sentiment TEXT,
        snippet TEXT,
        FOREIGN KEY (review_id) REFERENCES reviews(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT,
        date DATE,
        units_sold INTEGER,
        revenue REAL,
        average_selling_price REAL,
        marketing_spend REAL,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS influencer_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT,
        date DATE,
        influencer_name TEXT,
        platform TEXT,
        cost REAL,
        reach INTEGER,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    """)
    
    # Insert products
    cursor.executemany("INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?)", 
                       [(p["id"], p["name"], p["brand"], p["category"], p["launched_at"]) for p in PRODUCTS])
    
    conn.commit()
    conn.close()
    print("Database tables initialized.")

def generate_reviews_and_metrics():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing data (except products)
    cursor.execute("DELETE FROM reviews")
    cursor.execute("DELETE FROM aspect_sentiments")
    cursor.execute("DELETE FROM sales_metrics")
    cursor.execute("DELETE FROM influencer_campaigns")
    conn.commit()
    
    start_date = datetime(2026, 1, 1)
    end_date = datetime(2026, 6, 14)
    total_days = (end_date - start_date).days
    
    review_counter = 1
    
    # Set up some events
    # Event 1: boAt Wave Sigma firmware bug starts 2026-04-10 and resolves 2026-05-15
    bug_start = datetime(2026, 4, 10)
    bug_end = datetime(2026, 5, 15)
    
    # Event 2: Noise ColorFit Pro 5 influencer campaign date: 2026-05-01
    campaign_date = datetime(2026, 5, 1)
    
    # We will loop day by day to generate reviews and weekly metrics
    current = start_date
    reviews_to_insert = []
    aspects_to_insert = []
    
    while current <= end_date:
        current_str = current.strftime("%Y-%m-%d")
        
        for p in PRODUCTS:
            pid = p["id"]
            brand = p["brand"]
            category = p["category"]
            
            # Review generation frequency (Noise & boAt get more, Fire-Boltt slightly less)
            prob = 0.3 if brand != "Fire-Boltt" else 0.2
            
            # If during influencer campaign for Noise ColorFit Pro 5, increase frequency
            if pid == "noise_watch_5" and current >= campaign_date and current <= campaign_date + timedelta(days=14):
                prob = 0.8  # major buzz
                
            # If boAt watch is bugged, increase review volume (more complaints)
            if pid == "boat_wave_sigma" and bug_start <= current <= bug_end:
                prob = 0.6
                
            if random.random() < prob:
                # Determine baseline ratings
                # Noise: watch is high quality, buds are solid
                # boAt: watch is usually solid (except during bug), buds are popular
                # Fire-Boltt: watch is budget-focused, slightly lower baseline
                if pid == "noise_watch_5":
                    # Noise watch receives positive boost post campaign
                    if current >= campaign_date:
                        rating = random.choices([5, 4, 3, 2, 1], weights=[0.60, 0.25, 0.10, 0.03, 0.02])[0]
                    else:
                        rating = random.choices([5, 4, 3, 2, 1], weights=[0.45, 0.35, 0.10, 0.06, 0.04])[0]
                elif pid == "boat_wave_sigma":
                    # boAt watch during bug gets terrible reviews
                    if bug_start <= current <= bug_end:
                        rating = random.choices([5, 4, 3, 2, 1], weights=[0.05, 0.05, 0.10, 0.20, 0.60])[0]
                    else:
                        rating = random.choices([5, 4, 3, 2, 1], weights=[0.40, 0.35, 0.15, 0.06, 0.04])[0]
                elif pid == "fireboltt_gladiator":
                    rating = random.choices([5, 4, 3, 2, 1], weights=[0.35, 0.35, 0.15, 0.10, 0.05])[0]
                elif pid == "noise_buds_104":
                    rating = random.choices([5, 4, 3, 2, 1], weights=[0.40, 0.40, 0.12, 0.05, 0.03])[0]
                elif pid == "boat_airdopes_141":
                    rating = random.choices([5, 4, 3, 2, 1], weights=[0.42, 0.38, 0.12, 0.05, 0.03])[0]
                
                # Pick templates based on rating & categories
                templates = SMARTWATCH_TEMPLATES if category == "smartwatch" else AUDIO_TEMPLATES
                
                # Choose aspects to discuss in this review (usually 1 or 2 aspects)
                chosen_aspects = random.sample(list(templates.keys()), k=random.choice([1, 2]))
                
                review_sentences = []
                review_aspects = []
                
                # Force boAt Wave Sigma to discuss connectivity issues during the bug period
                if pid == "boat_wave_sigma" and bug_start <= current <= bug_end:
                    if "connectivity" not in chosen_aspects:
                        chosen_aspects.append("connectivity")
                        
                for aspect in chosen_aspects:
                    # Determine sentiment based on rating
                    if pid == "boat_wave_sigma" and aspect == "connectivity" and bug_start <= current <= bug_end:
                        sentiment = "negative"
                        # Use special anomaly text templates
                        text_options = templates["connectivity"]["anomaly"]
                    else:
                        if rating >= 4:
                            sentiment = "positive"
                        elif rating <= 2:
                            sentiment = "negative"
                        else:
                            sentiment = random.choice(["positive", "negative", "neutral"])
                            
                        # Select text templates
                        if sentiment == "neutral":
                            text_options = templates[aspect]["positive"]  # fallback, neutral uses similar
                        else:
                            text_options = templates[aspect][sentiment]
                    
                    phrase, aspect_key, snippet = random.choice(text_options)
                    review_sentences.append(phrase)
                    review_aspects.append((aspect_key, sentiment, snippet))
                
                # Combine sentences into review text
                review_text = " ".join(review_sentences)
                title = random.choice(TITLES_POS if rating >= 4 else TITLES_NEG)
                author = random.choice(AUTHORS)
                source = random.choice(["Amazon", "Flipkart", "Noise D2C" if brand == "Noise" else "boAt D2C" if brand == "boAt" else "Flipkart"])
                review_id = f"REV_{review_counter:04d}"
                
                # Append review
                reviews_to_insert.append((review_id, pid, author, rating, title, review_text, current_str, source))
                
                # Append aspects
                for aspect_key, sentiment, snippet in review_aspects:
                    aspects_to_insert.append((review_id, aspect_key, sentiment, snippet))
                
                review_counter += 1
        
        current += timedelta(days=1)
        
    # Batch insert reviews and aspects
    cursor.executemany("INSERT INTO reviews VALUES (?, ?, ?, ?, ?, ?, ?, ?)", reviews_to_insert)
    cursor.executemany("INSERT INTO aspect_sentiments (review_id, aspect, sentiment, snippet) VALUES (?, ?, ?, ?)", aspects_to_insert)
    print(f"Inserted {len(reviews_to_insert)} reviews and {len(aspects_to_insert)} aspect tags.")
    
    # Generate weekly sales metrics
    # We will generate weekly records (every Sunday)
    sales_to_insert = []
    current_week = start_date
    
    while current_week <= end_date:
        current_week_str = current_week.strftime("%Y-%m-%d")
        
        for p in PRODUCTS:
            pid = p["id"]
            brand = p["brand"]
            
            # Base variables for weekly metrics
            if pid == "noise_watch_5":
                base_units = 1200
                asp = 2999
                mkt_spend = 30000
                # Influencer campaign spike
                if campaign_date <= current_week <= campaign_date + timedelta(days=21):
                    base_units = int(base_units * random.uniform(1.8, 2.5))
                    mkt_spend = 150000  # elevated marketing spend
                else:
                    base_units = int(base_units * random.uniform(0.9, 1.1))
            elif pid == "boat_wave_sigma":
                base_units = 1100
                asp = 2499
                mkt_spend = 25000
                # Bug drop
                if bug_start <= current_week <= bug_end:
                    base_units = int(base_units * random.uniform(0.5, 0.7))
                else:
                    base_units = int(base_units * random.uniform(0.9, 1.1))
            elif pid == "fireboltt_gladiator":
                base_units = 900
                asp = 2299
                mkt_spend = 20000
                base_units = int(base_units * random.uniform(0.95, 1.05))
            elif pid == "noise_buds_104":
                base_units = 2500
                asp = 1499
                mkt_spend = 40000
                base_units = int(base_units * random.uniform(0.9, 1.1))
            elif pid == "boat_airdopes_141":
                base_units = 2800
                asp = 1399
                mkt_spend = 45000
                base_units = int(base_units * random.uniform(0.9, 1.1))
                
            revenue = base_units * asp
            sales_to_insert.append((pid, current_week_str, base_units, revenue, asp, mkt_spend))
            
        current_week += timedelta(days=7)
        
    cursor.executemany("INSERT INTO sales_metrics (product_id, date, units_sold, revenue, average_selling_price, marketing_spend) VALUES (?, ?, ?, ?, ?, ?)", sales_to_insert)
    print(f"Inserted {len(sales_to_insert)} sales metrics records.")
    
    # Generate influencer campaigns
    campaigns = [
        # Noise campaigns
        ("noise_watch_5", "2026-01-15", "TechWiser", "YouTube", 150000, 800000),
        ("noise_watch_5", "2026-05-01", "Technical Guruji", "YouTube", 400000, 2500000),
        ("noise_watch_5", "2026-05-02", "Tech Burner", "Instagram", 200000, 1500000),
        ("noise_buds_104", "2026-03-10", "Gyan Therapy", "YouTube", 120000, 600000),
        # boAt campaigns
        ("boat_wave_sigma", "2026-02-14", "Ruhez Amrelia", "YouTube", 100000, 500000),
        ("boat_airdopes_141", "2026-03-22", "Tech Bar", "YouTube", 130000, 700000),
        ("boat_wave_sigma", "2026-04-05", "Beebom", "YouTube", 300000, 1800000), # This hit right before the bug!
        # Fire-Boltt campaigns
        ("fireboltt_gladiator", "2026-03-01", "Trakin Tech", "YouTube", 220000, 1200000)
    ]
    
    cursor.executemany("INSERT INTO influencer_campaigns (product_id, date, influencer_name, platform, cost, reach) VALUES (?, ?, ?, ?, ?, ?)", campaigns)
    print(f"Inserted {len(campaigns)} influencer campaign logs.")
    
    conn.commit()
    conn.close()
    print("Mock database generation completed successfully!")

if __name__ == "__main__":
    setup_db()
    generate_reviews_and_metrics()
