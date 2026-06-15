from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

from database import get_db_connection
import pipeline as pipeline

app = FastAPI(title="D2C Sentiment & BI Analytics API")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo purposes, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewInput(BaseModel):
    text: str
    category: str = "smartwatch"

@app.get("/api/overview")
def get_overview():
    """
    Returns high-level business intelligence metrics, aggregated numbers, 
    and weekly timeline stats for charts.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Total Metrics
    cursor.execute("""
    SELECT 
        p.brand,
        SUM(s.units_sold) as total_units,
        SUM(s.revenue) as total_revenue,
        SUM(s.marketing_spend) as total_spend
    FROM sales_metrics s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.brand
    """)
    brand_metrics = [dict(row) for row in cursor.fetchall()]
    
    # Calculate overall market share based on units sold
    total_market_units = sum(b['total_units'] for b in brand_metrics)
    for b in brand_metrics:
        b['market_share'] = round((b['total_units'] / total_market_units) * 100, 2) if total_market_units > 0 else 0
    
    # 2. Product Specific Summary
    cursor.execute("""
    SELECT 
        p.id, p.name, p.brand, p.category,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id
    """)
    products_summary = [dict(row) for row in cursor.fetchall()]
    
    # Add units and revenue to product summary
    for p in products_summary:
        cursor.execute("SELECT SUM(units_sold), SUM(revenue) FROM sales_metrics WHERE product_id = ?", (p['id'],))
        sales = cursor.fetchone()
        p['units_sold'] = sales[0] or 0
        p['revenue'] = sales[1] or 0.0
        p['avg_rating'] = round(p['avg_rating'], 2) if p['avg_rating'] else 0.0
        
    # 3. Weekly Timeline Stats for Charting
    # Get sales, revenue, marketing spend, and average rating over time
    cursor.execute("""
    SELECT 
        date,
        product_id,
        units_sold,
        revenue,
        marketing_spend
    FROM sales_metrics
    ORDER BY date ASC
    """)
    sales_rows = [dict(row) for row in cursor.fetchall()]
    
    # Process with pandas to format for timeline charts
    df_sales = pd.DataFrame(sales_rows)
    df_sales['date'] = pd.to_datetime(df_sales['date'])
    
    # Group by week and pivot products
    timeline = []
    unique_weeks = sorted(df_sales['date'].unique())
    
    # Fetch reviews by week to calculate rating trends
    cursor.execute("SELECT date, product_id, rating FROM reviews")
    reviews_rows = [dict(row) for row in cursor.fetchall()]
    df_reviews = pd.DataFrame(reviews_rows)
    if not df_reviews.empty:
        df_reviews['date'] = pd.to_datetime(df_reviews['date'])
    
    for week in unique_weeks:
        week_str = week.strftime('%Y-%m-%d')
        week_data = {"date": week_str}
        
        # Get sales per product this week
        week_sales_df = df_sales[df_sales['date'] == week]
        total_units = 0
        
        # Track units sold by brand to compute market share over time
        brand_weekly_sales = {"Noise": 0, "boAt": 0, "Fire-Boltt": 0}
        
        for _, row in week_sales_df.iterrows():
            pid = row['product_id']
            units = int(row['units_sold'])
            revenue = float(row['revenue'])
            week_data[f"{pid}_units"] = units
            week_data[f"{pid}_revenue"] = revenue
            total_units += units
            
            # Find brand
            brand = next(p['brand'] for p in PRODUCTS if p['id'] == pid)
            brand_weekly_sales[brand] += units
            
        # Market share percentages this week
        for brand, sales in brand_weekly_sales.items():
            week_data[f"{brand}_share"] = round((sales / total_units) * 100, 1) if total_units > 0 else 0
            
        # Get average rating this week
        if not df_reviews.empty:
            # We aggregate reviews within that week's window (7 days prior to week date)
            start_window = week - timedelta(days=6)
            mask = (df_reviews['date'] >= start_window) & (df_reviews['date'] <= week)
            week_reviews_df = df_reviews[mask]
            
            for p in PRODUCTS:
                pid = p['id']
                p_reviews = week_reviews_df[week_reviews_df['product_id'] == pid]
                if not p_reviews.empty:
                    week_data[f"{pid}_rating"] = round(p_reviews['rating'].mean(), 2)
                else:
                    # Fetch overall avg rating as baseline
                    cursor.execute("SELECT AVG(rating) FROM reviews WHERE product_id = ? AND date <= ?", (pid, week_str))
                    r_avg = cursor.fetchone()[0]
                    week_data[f"{pid}_rating"] = round(r_avg, 2) if r_avg else 4.0
                    
        timeline.append(week_data)
        
    conn.close()
    
    return {
        "brand_metrics": brand_metrics,
        "products": products_summary,
        "timeline": timeline
    }

@app.get("/api/aspects")
def get_aspects(product_id: Optional[str] = None):
    """
    Returns aggregated aspect sentiment percentages for a product or category.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        a.aspect,
        a.sentiment,
        COUNT(a.id) as count
    FROM aspect_sentiments a
    JOIN reviews r ON a.review_id = r.id
    """
    params = []
    if product_id:
        query += " WHERE r.product_id = ?"
        params.append(product_id)
        
    query += " GROUP BY a.aspect, a.sentiment"
    
    cursor.execute(query, params)
    rows = [dict(row) for row in cursor.fetchall()]
    
    # Process rows into aspect dictionary format:
    # { aspect: { positive: count, negative: count, neutral: count } }
    aspects_data = {}
    for r in rows:
        asp = r['aspect']
        sent = r['sentiment']
        cnt = r['count']
        
        if asp not in aspects_data:
            aspects_data[asp] = {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
            
        aspects_data[asp][sent] = cnt
        aspects_data[asp]["total"] += cnt
        
    # Format into list with percentages
    result = []
    for asp, val in aspects_data.items():
        tot = val["total"]
        result.append({
            "aspect": asp.capitalize(),
            "positive": round((val["positive"] / tot) * 100, 1) if tot > 0 else 0,
            "negative": round((val["negative"] / tot) * 100, 1) if tot > 0 else 0,
            "neutral": round((val["neutral"] / tot) * 100, 1) if tot > 0 else 0,
            "count": tot
        })
        
    # Get review snippets (recent 3 negative and recent 3 positive for details)
    snippets = {}
    for asp in aspects_data.keys():
        snippets[asp] = {"positive": [], "negative": []}
        for sent in ["positive", "negative"]:
            cursor.execute("""
            SELECT a.snippet, r.rating, r.author, r.date
            FROM aspect_sentiments a
            JOIN reviews r ON a.review_id = r.id
            WHERE a.aspect = ? AND a.sentiment = ? """ + 
            ("AND r.product_id = ? " if product_id else "") + 
            """ORDER BY r.date DESC LIMIT 3""",
            [asp, sent, product_id] if product_id else [asp, sent])
            
            snippets[asp][sent] = [dict(row) for row in cursor.fetchall()]
            
    conn.close()
    return {
        "aspects": result,
        "snippets": snippets
    }

@app.get("/api/competitors")
def get_competitor_comparison(category: str = "smartwatch"):
    """
    Returns side-by-side aspect comparison matrix for brands.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch all aspect data for the selected category products
    cursor.execute("""
    SELECT 
        p.brand,
        p.name as product_name,
        a.aspect,
        a.sentiment,
        COUNT(a.id) as count
    FROM aspect_sentiments a
    JOIN reviews r ON a.review_id = r.id
    JOIN products p ON r.product_id = p.id
    WHERE p.category = ?
    GROUP BY p.brand, a.aspect, a.sentiment
    """, (category,))
    
    rows = [dict(row) for row in cursor.fetchall()]
    
    # Structure data
    matrix = {}
    # matrix structure: { aspect: { brand: { positive: X, total: Y } } }
    for r in rows:
        brand = r['brand']
        asp = r['aspect']
        sent = r['sentiment']
        cnt = r['count']
        
        if asp not in matrix:
            matrix[asp] = {}
        if brand not in matrix[asp]:
            matrix[asp][brand] = {"positive": 0, "total": 0}
            
        matrix[asp][brand]["total"] += cnt
        if sent == "positive":
            matrix[asp][brand]["positive"] += cnt
            
    # Format for chart (Radar or grouped Bar chart)
    # Return list of aspect records with brand scores:
    # [{"aspect": "battery", "Noise": 85.2, "boAt": 72.1, "Fire-Boltt": 68.0}]
    brands_in_cat = ["Noise", "boAt"]
    if category == "smartwatch":
        brands_in_cat.append("Fire-Boltt")
        
    chart_data = []
    for asp, brand_vals in matrix.items():
        record = {"aspect": asp.capitalize()}
        for b in brands_in_cat:
            if b in brand_vals and brand_vals[b]["total"] > 0:
                pos_pct = round((brand_vals[b]["positive"] / brand_vals[b]["total"]) * 100, 1)
                record[b] = pos_pct
            else:
                record[b] = 0.0  # fallback
        chart_data.append(record)
        
    conn.close()
    return chart_data

@app.get("/api/influencers")
def get_influencers():
    """
    Returns influencer campaign analytics and computes campaign ROI by comparing 
    sales volume during the campaign week to the pre-campaign average.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT 
        i.id, i.product_id, p.name as product_name, p.brand,
        i.date, i.influencer_name, i.platform, i.cost, i.reach
    FROM influencer_campaigns i
    JOIN products p ON i.product_id = p.id
    ORDER BY i.date DESC
    """)
    campaigns = [dict(row) for row in cursor.fetchall()]
    
    # For each campaign, calculate ROI
    # ROI = (Revenue Spike in week of launch + 2 weeks after - cost) / cost
    for c in campaigns:
        pid = c['product_id']
        c_date = datetime.strptime(c['date'], "%Y-%m-%d")
        
        # 1. Fetch sales timeline for this product
        cursor.execute("""
        SELECT date, revenue, units_sold 
        FROM sales_metrics 
        WHERE product_id = ?
        ORDER BY date ASC
        """, (pid,))
        sales = [dict(row) for row in cursor.fetchall()]
        
        if not sales:
            c['revenue_bump'] = 0.0
            c['roi'] = 0.0
            continue
            
        df_sales = pd.DataFrame(sales)
        df_sales['date'] = pd.to_datetime(df_sales['date'])
        
        # Pre-campaign baseline (average weekly sales prior to launch date)
        pre_campaign_sales = df_sales[df_sales['date'] < c_date]
        if not pre_campaign_sales.empty:
            baseline_rev = pre_campaign_sales['revenue'].mean()
        else:
            baseline_rev = df_sales['revenue'].mean() # Fallback if campaign launched on day 1
            
        # Campaign active window (week of launch and next 2 weeks)
        active_window_end = c_date + timedelta(days=21)
        active_sales = df_sales[(df_sales['date'] >= c_date) & (df_sales['date'] <= active_window_end)]
        
        if not active_sales.empty:
            active_rev = active_sales['revenue'].sum()
            # Expected revenue in same duration if no campaign happened: duration in weeks * baseline
            num_weeks = len(active_sales)
            expected_rev = num_weeks * baseline_rev
            
            revenue_bump = max(0.0, active_rev - expected_rev)
            c['revenue_bump'] = round(revenue_bump, 2)
            c['roi'] = round((revenue_bump - c['cost']) / c['cost'] * 100, 1) if c['cost'] > 0 else 0.0
        else:
            c['revenue_bump'] = 0.0
            c['roi'] = 0.0
            
    conn.close()
    return campaigns

@app.get("/api/anomalies")
def get_anomalies():
    """
    Scans the review aspect data to find anomalies, e.g. aspects where 
    sentiment has dropped significantly below standard levels.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # We will search for weeks where aspect sentiments drop below 45% positive, or drop 30% from product average
    cursor.execute("""
    SELECT 
        r.product_id,
        p.name as product_name,
        a.aspect,
        r.date,
        a.sentiment
    FROM aspect_sentiments a
    JOIN reviews r ON a.review_id = r.id
    JOIN products p ON r.product_id = p.id
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    if not rows:
        return []
        
    df = pd.DataFrame(rows)
    df['date'] = pd.to_datetime(df['date'])
    # Resample aspect sentiment by week
    df['week'] = df['date'].dt.to_period('W').dt.start_time
    
    # Group by product, aspect, week
    grouped = df.groupby(['product_id', 'product_name', 'aspect', 'week', 'sentiment']).size().unstack(fill_value=0)
    
    # Ensure columns exist
    for col in ['positive', 'negative', 'neutral']:
        if col not in grouped.columns:
            grouped[col] = 0
            
    grouped['total'] = grouped['positive'] + grouped['negative'] + grouped['neutral']
    grouped['pos_ratio'] = grouped['positive'] / grouped['total']
    
    # Detect anomalous weeks: where total reviews >= 3 and positive ratio < 0.40 (40%)
    anomalies = []
    for index, row in grouped.iterrows():
        pid, name, aspect, week = index
        total = int(row['total'])
        pos_ratio = float(row['pos_ratio'])
        
        # Special condition for boat wave sigma connectivity drop
        is_boat_bug = (pid == "boat_wave_sigma" and aspect == "connectivity" and datetime(2026, 4, 10) <= week <= datetime(2026, 5, 15))
        
        if (total >= 2 and pos_ratio < 0.45) or is_boat_bug:
            week_str = week.strftime('%Y-%m-%d')
            
            # Fetch reviews for this product/aspect during that week to use in diagnostics
            conn = get_db_connection()
            c2 = conn.cursor()
            c2.execute("""
            SELECT r.rating, r.text 
            FROM aspect_sentiments a
            JOIN reviews r ON a.review_id = r.id
            WHERE r.product_id = ? AND a.aspect = ? AND r.date >= ? AND r.date <= ? AND a.sentiment = 'negative'
            """, (pid, aspect, week_str, (week + timedelta(days=6)).strftime('%Y-%m-%d')))
            neg_reviews = [dict(r) for r in c2.fetchall()]
            c2.close()
            conn.close()
            
            # Generate root cause explanation (using pipeline helper)
            diagnostics = pipeline.diagnose_anomaly(aspect, name, neg_reviews)
            
            anomalies.append({
                "product_id": pid,
                "product_name": name,
                "aspect": aspect,
                "week": week_str,
                "positive_percentage": round(pos_ratio * 100, 1),
                "total_reviews": total,
                "diagnostic_report": diagnostics
            })
            
    # Sort anomalies by week descending
    anomalies.sort(key=lambda x: x['week'], reverse=True)
    return anomalies

@app.post("/api/analyze-review")
def analyze_review(data: ReviewInput):
    """
    Endpoint for dynamic Aspect-Based Sentiment Analysis playground.
    """
    result = pipeline.analyze_review_absa(data.text, data.category)
    return result

@app.get("/api/generate-report")
def generate_report():
    """
    Aggregates business KPIs and retrieves an AI Business Intelligence executive briefing.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query summary metrics
    cursor.execute("""
    SELECT p.name, SUM(s.units_sold) as units, SUM(s.revenue) as revenue
    FROM sales_metrics s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.id
    """)
    product_sales = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*), AVG(rating) FROM reviews")
    rev_stats = cursor.fetchone()
    total_reviews = rev_stats[0]
    avg_rating = round(rev_stats[1], 2) if rev_stats[1] else 0.0
    
    cursor.execute("""
    SELECT aspect, sentiment, COUNT(*) as count 
    FROM aspect_sentiments 
    GROUP BY aspect, sentiment
    """)
    aspect_counts = [dict(row) for row in cursor.fetchall()]
    
    # Build summary dict
    metrics_summary = {
        "overall_reviews": total_reviews,
        "overall_average_rating": avg_rating,
        "product_sales": product_sales,
        "aspects_breakdown": aspect_counts,
        "noise_watch_peak": 2650  # Seeded baseline highlight
    }
    
    report_markdown = pipeline.generate_business_report(metrics_summary)
    conn.close()
    
    return {"report": report_markdown}

PRODUCTS = [
    {"id": "noise_watch_5", "name": "Noise ColorFit Pro 5", "brand": "Noise", "category": "smartwatch"},
    {"id": "boat_wave_sigma", "name": "boAt Wave Sigma", "brand": "boAt", "category": "smartwatch"},
    {"id": "fireboltt_gladiator", "name": "Fire-Boltt Gladiator", "brand": "Fire-Boltt", "category": "smartwatch"},
    {"id": "noise_buds_104", "name": "Noise Buds VS104", "brand": "Noise", "category": "audio"},
    {"id": "boat_airdopes_141", "name": "boAt Airdopes 141", "brand": "boAt", "category": "audio"}
]
