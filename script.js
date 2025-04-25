document.addEventListener('DOMContentLoaded', function() {
    // Video listesi - kendi video URL'lerinizi ekleyin
    const videoLinks = [
        'https://www.youtube.com/embed/VIDEO_ID_1?autoplay=1&mute=1',
        'https://www.youtube.com/embed/VIDEO_ID_2?autoplay=1&mute=1',
        'https://www.youtube.com/embed/VIDEO_ID_3?autoplay=1&mute=1'
        // Daha fazla video ekleyebilirsiniz
    ];
    
    // Yedek haber listesi (RSS çalışmazsa kullanılacak)
    const fallbackNewsItems = [
        'Türkiye\'de ekonomik gelişmeler hız kazandı.',
        'İstanbul\'da yeni metro hattı açıldı.',
        'Dünya genelinde teknoloji yatırımları artıyor.',
        'Bilim insanları yeni bir keşif açıkladı.',
        'Spor dünyasından son gelişmeler.',
        'Kültür sanat etkinlikleri devam ediyor.'
    ];
    
    // RSS haber kaynaklarının listesi
    const rssFeeds = [
        'https://www.trthaber.com/sondakika.rss',
        'https://www.aa.com.tr/tr/rss/default?cat=guncel',
        'https://www.hurriyet.com.tr/rss/gundem'
    ];
    
    // Videoları oynatma fonksiyonu
    let currentVideoIndex = 0;
    
    function playNextVideo() {
        const videoPlayer = document.getElementById('video-player');
        
        // iframe oluştur
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.src = videoLinks[currentVideoIndex];
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        
        // Önceki videoyu temizle ve yenisini ekle
        videoPlayer.innerHTML = '';
        videoPlayer.appendChild(iframe);
        
        // Sonraki video için index güncelle
        currentVideoIndex = (currentVideoIndex + 1) % videoLinks.length;
        
        // Video bitiminde sonraki videoyu oynat (yaklaşık 30 saniye)
        setTimeout(playNextVideo, 30000);
    }
    
    // İlk videoyu başlat
    playNextVideo();
    
    // RSS beslemelerinden haberleri çekme
    fetchNewsFromRSS();
    
    // TCMB Döviz Kurları Widget'ı
    fetchCurrencyRates();
    
    // BIST Endeksi Widget'ı
    fetchBistIndex();
    
    // İstanbul Hava Durumu Widget'ı
    fetchWeather();
    
    // Verileri belirli aralıklarla güncelle
    setInterval(fetchNewsFromRSS, 1800000); // 30 dakikada bir haberleri güncelle
    setInterval(fetchCurrencyRates, 300000); // 5 dakikada bir döviz kurlarını güncelle
    setInterval(fetchBistIndex, 300000); // 5 dakikada bir borsa verilerini güncelle
    setInterval(fetchWeather, 1800000); // 30 dakikada bir hava durumunu güncelle
});

// RSS beslemelerinden haberleri çekme fonksiyonu
function fetchNewsFromRSS() {
    const allNewsItems = [];
    let completedRequests = 0;
    const totalFeeds = rssFeeds.length;
    
    // RSS beslemelerinin her birini işle
    rssFeeds.forEach(feedUrl => {
        // RSS2JSON API kullanarak CORS sorununu aşma (ücretsiz servis)
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    // Her beslemeden en fazla 5 haber al
                    const items = data.items.slice(0, 5);
                    items.forEach(item => {
                        allNewsItems.push(item.title);
                    });
                }
            })
            .catch(error => {
                console.error(`RSS beslemesi alınamadı: ${feedUrl}`, error);
            })
            .finally(() => {
                completedRequests++;
                
                // Tüm beslemeler işlendiyse haberleri göster
                if (completedRequests === totalFeeds) {
                    if (allNewsItems.length > 0) {
                        updateNewsTicker(allNewsItems);
                    } else {
                        // Haber alınamazsa yedek haberleri kullan
                        updateNewsTicker(fallbackNewsItems);
                    }
                }
            });
    });
    
    // 5 saniye içinde yanıt gelmezse yedek haberleri göster
    setTimeout(() => {
        if (allNewsItems.length === 0) {
            updateNewsTicker(fallbackNewsItems);
        }
    }, 5000);
}

// Haber bantını güncelleme fonksiyonu
function updateNewsTicker(newsItems) {
    const tickerItems = document.querySelector('.ticker-items');
    tickerItems.innerHTML = '';
    
    // Haberleri karıştır
    const shuffledNews = [...newsItems].sort(() => 0.5 - Math.random());
    
    // Haberleri ekle
    shuffledNews.forEach(news => {
        const newsItem = document.createElement('div');
        newsItem.className = 'ticker-item';
        newsItem.textContent = news;
        tickerItems.appendChild(newsItem);
    });
    
    // Animasyonu yeniden başlat
    tickerItems.style.animation = 'none';
    void tickerItems.offsetWidth; // Reflow
    tickerItems.style.animation = 'ticker 30s linear infinite';
}

// TCMB Döviz Kurları
function fetchCurrencyRates() {
    const currencyWidget = document.getElementById('tcmb-currency');
    
    // Ücretsiz API kullanımı
    fetch('https://api.exchangerate-api.com/v4/latest/TRY')
        .then(response => response.json())
        .then(data => {
            const usd = (1 / data.rates.USD).toFixed(4);
            const eur = (1 / data.rates.EUR).toFixed(4);
            const gbp = (1 / data.rates.GBP).toFixed(4);
            
            currencyWidget.innerHTML = `
                <div class="currency-item">
                    <span class="currency-name">USD:</span>
                    <span class="currency-value">${usd} ₺</span>
                </div>
                <div class="currency-item">
                    <span class="currency-name">EUR:</span>
                    <span class="currency-value">${eur} ₺</span>
                </div>
                <div class="currency-item">
                    <span class="currency-name">GBP:</span>
                    <span class="currency-value">${gbp} ₺</span>
                </div>
            `;
        })
        .catch(error => {
            console.error('Döviz kurları çekilirken hata oluştu:', error);
            
            // Hata durumunda örnek veriler göster
            currencyWidget.innerHTML = `
                <div class="currency-item">
                    <span class="currency-name">USD:</span>
                    <span class="currency-value">29.8520 ₺</span>
                </div>
                <div class="currency-item">
                    <span class="currency-name">EUR:</span>
                    <span class="currency-value">32.4150 ₺</span>
                </div>
                <div class="currency-item">
                    <span class="currency-name">GBP:</span>
                    <span class="currency-value">37.9830 ₺</span>
                </div>
            `;
