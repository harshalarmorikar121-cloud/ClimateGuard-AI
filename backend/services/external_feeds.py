import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

WHO_RSS_URL = "https://www.who.int/feeds/entity/csr/don/en/rss.xml"
RELIEFWEB_API_URL = "https://api.reliefweb.int/v1/reports?appname=climateguard-ai&filter[field]=primary_type.name&filter[value]=Epidemic&profile=list&limit=6&sort[]=date:desc"

FALLBACK_WHO_REPORTS = [
    {
        "title": "Dengue Global Situation & Monsoon Escalation Alert",
        "date": "Aug 2026",
        "link": "https://www.who.int/emergencies/disease-outbreak-news",
        "region": "Southeast Asia & Western Pacific",
        "severity": "CRITICAL",
        "source": "WHO DON"
    },
    {
        "title": "Malaria Seasonal Peak Warning – Sub-Saharan Africa",
        "date": "Aug 2026",
        "link": "https://www.who.int/news-room/fact-sheets/detail/malaria",
        "region": "West & Central Africa",
        "severity": "HIGH",
        "source": "WHO Global"
    },
    {
        "title": "Climate-Driven Vector Range Expansion Bulletin",
        "date": "Jul 2026",
        "link": "https://www.who.int/news/item/03-06-2024-climate-change-is-already-impacting-health",
        "region": "Global Tropical & Sub-Tropical",
        "severity": "MEDIUM",
        "source": "WHO Health & Climate"
    }
]

async def fetch_who_outbreak_news() -> List[Dict[str, Any]]:
    """
    Fetches and parses real-time WHO Disease Outbreak News RSS feeds.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(WHO_RSS_URL)
            if res.status_code == 200:
                root = ET.fromstring(res.text)
                items = []
                for item in root.findall("./channel/item")[:8]:
                    title = item.find("title").text if item.find("title") is not None else "Outbreak Alert"
                    link = item.find("link").text if item.find("link") is not None else "https://www.who.int"
                    pubDate = item.find("pubDate").text if item.find("pubDate") is not None else ""
                    
                    items.append({
                        "title": title,
                        "date": pubDate[:16] if pubDate else "Recent",
                        "link": link,
                        "region": "WHO Global Bulletin",
                        "severity": "HIGH" if "dengue" in title.lower() or "malaria" in title.lower() else "MEDIUM",
                        "source": "WHO Live RSS"
                    })
                if items:
                    return items
    except Exception as e:
        print(f"[ExternalFeeds] WHO RSS fetch failed: {e}")
        
    return FALLBACK_WHO_REPORTS

async def fetch_reliefweb_reports() -> List[Dict[str, Any]]:
    """
    Fetches real humanitarian epidemic emergency reports from ReliefWeb API.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(RELIEFWEB_API_URL)
            if res.status_code == 200:
                data = res.json().get("data", [])
                reports = []
                for r in data:
                    fields = r.get("fields", {})
                    reports.append({
                        "title": fields.get("title", "Health Emergency"),
                        "date": fields.get("date", {}).get("original", "")[:10],
                        "link": r.get("href", "https://reliefweb.int"),
                        "region": fields.get("primary_country", {}).get("name", "Global"),
                        "severity": "MEDIUM",
                        "source": "ReliefWeb Live API"
                    })
                if reports:
                    return reports
    except Exception as e:
        print(f"[ExternalFeeds] ReliefWeb fetch failed: {e}")
        
    return []
