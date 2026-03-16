import asyncio
import sys
from curl_cffi import requests
from bs4 import BeautifulSoup
import json

async def scrape_kariyer_net(keyword: str):
    results = []
    url = f"https://www.kariyer.net/is-ilanlari?kw={keyword}"
    print(f"Kariyer.net: curl_cffi ile talep gönderiliyor -> {url}")
    
    try:
        # curl_cffi ile tarayıcıyı taklit et (impersonate chrome)
        response = await asyncio.to_thread(requests.get, url, impersonate="chrome110", timeout=30)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Kariyer.net'te ilanlar bazen JSON olarak bir script içinde olur
            # Önce klasik HTML kartlarını arayalım
            cards = soup.find_all('div', attrs={"data-test": "ad-card"})
            print(f"Kariyer.net: {len(cards)} ilan kartı tespit edildi.")
            
            for card in cards[:10]:
                title = card.find('span', attrs={"data-test": "ad-card-title"})
                company = card.find('span', attrs={"data-test": "subtitle"})
                link = card.find('a', attrs={"data-test": "ad-card-item"})
                
                if title and company:
                    href = link.get('href', '') if link else ""
                    full_link = f"https://www.kariyer.net{href}" if href.startswith('/') else href
                    results.append({
                        "title": title.get_text(strip=True),
                        "company": company.get_text(strip=True),
                        "location": "Türkiye",
                        "link": full_link,
                        "platform": "Kariyer.net"
                    })
            
            # Eğer kart bulunamadıysa sayfa başlığını kontrol et (bot koruması mı?)
            if not results:
                print(f"Kariyer.net: Veri çekilemedi. Başlık: {soup.title.string if soup.title else 'Yok'}")
        else:
            print(f"Kariyer.net Hatası: Status {response.status_code}")
    except Exception as e:
        print(f"Kariyer.net Exception: {e}")
    return results

async def scrape_youthall(keyword: str):
    results = []
    url = f"https://www.youthall.com/is-ilanlari/?q={keyword}"
    print(f"Youthall: curl_cffi ile talep gönderiliyor -> {url}")
    
    try:
        response = await asyncio.to_thread(requests.get, url, impersonate="chrome110", timeout=30)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Youthall kart seçicileri
            cards = soup.select('.job-item') or soup.find_all('div', class_='browse-item')
            print(f"Youthall: {len(cards)} ilan kartı tespit edildi.")
            
            for card in cards[:10]:
                title = card.find('h3') or card.find(class_='title')
                company = card.find(class_='company-name') or card.find(class_='subtitle')
                link = card.find('a')
                
                if title and company:
                    href = link.get('href', '') if link else ""
                    full_link = f"https://www.youthall.com{href}" if href.startswith('/') else href
                    results.append({
                        "title": title.get_text(strip=True),
                        "company": company.get_text(strip=True),
                        "location": "Türkiye",
                        "link": full_link,
                        "platform": "Youthall"
                    })
        else:
            print(f"Youthall Hatası: Status {response.status_code}")
    except Exception as e:
        print(f"Youthall Exception: {e}")
    return results

async def scrape_all(keyword: str):
    k_res = await scrape_kariyer_net(keyword)
    y_res = await scrape_youthall(keyword)
    all_results = k_res + y_res
    print(f"Toplam {len(all_results)} ilan toplandı.")
    return all_results

if __name__ == "__main__":
    res = asyncio.run(scrape_all("staj"))
    print(json.dumps(res, indent=2, ensure_ascii=False))
