# 🤖 Telegram Registration Bot

Firma va mijozlarni ro'yxatdan o'tkazuvchi Telegram bot.

---

## 📁 Loyiha tuzilmasi

```
telegram-bot/
├── bot.js            ← Asosiy bot kodi
├── package.json
├── .env.example      ← Token namuna fayl
├── .gitignore
├── data/             ← Avtomatik yaratiladi
│   ├── firms.json    ← Firma ma'lumotlari
│   └── clients.json  ← Mijoz ma'lumotlari
└── README.md
```

---

## 🚀 O'rnatish va ishga tushirish

### 1. Bot token olish

1. Telegramda [@BotFather](https://t.me/BotFather) ga kiring
2. `/newbot` buyrug'ini yuboring
3. Bot nomini va username kiriting
4. Tokenni nusxalab oling

### 2. Loyihani yuklab olish

```bash
# Papkaga o'ting
cd telegram-bot

# Paketlarni o'rnating
npm install
```

### 3. Token sozlash

```bash
# .env fayl yarating
cp .env.example .env

# .env faylni oching va tokenni qo'ying
BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Ishga tushirish (lokal)

```bash
npm start
```

---

## ☁️ Neon serverga deploy qilish

### Neon (Railway.app yoki Render.com orqali)

> **Tavsiya:** Neon asosan PostgreSQL uchun. Bot hosting uchun **Railway.app** yoki **Render.com** ishlatish qulay.

### Railway.app da deploy (BEPUL, tavsiya etiladi)

1. **GitHub repoga yuklang:**
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/sizning_username/bot.git
   git push -u origin main
   ```

2. **Railway.app ga kiring:** https://railway.app
   - GitHub bilan login qiling
   - "New Project" → "Deploy from GitHub repo"
   - Reponi tanlang

3. **Environment variable qo'shing:**
   - Variables bo'limiga kiring
   - `BOT_TOKEN` = `sizning_tokeningiz`

4. **Deploy tugaydi!** ✅

### Render.com da deploy

1. https://render.com ga kiring
2. "New Web Service" → GitHub reponi ulang
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node bot.js`
4. Environment → `BOT_TOKEN` ni qo'shing
5. Deploy

---

## 💾 Ma'lumotlarni kompyuteringizga olish

Bot ishlaganda `data/` papkasida 2 fayl yaratiladi:

| Fayl | Tarkib |
|------|--------|
| `data/firms.json` | Barcha firmalar ro'yxati |
| `data/clients.json` | Barcha mijozlar ro'yxati |

### Railway/Render serverdan fayllarni tortib olish

Railway yoki Render lokal disk o'rniga **PostgreSQL** dan foydalanish tavsiya etiladi (fayl yo'qolmasligi uchun). Lekin sinovlar uchun JSON ham ishlaydi.

**Fayllarni yuklab olish uchun** Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway run cat data/firms.json > local_firms.json
railway run cat data/clients.json > local_clients.json
```

---

## 📊 JSON format namunalari

**firms.json:**
```json
[
  {
    "id": 1718000000000,
    "chatId": 123456789,
    "registeredAt": "2024-06-01T10:00:00.000Z",
    "name": "Alfa Savdo MChJ",
    "phone1": "+998901234567",
    "phone2": "+998711234567",
    "inn": "123456789",
    "comment": "Toshkent shahri, Chilonzor tumani - qo'shimcha izoh"
  }
]
```

**clients.json:**
```json
[
  {
    "id": 1718000000001,
    "chatId": 987654321,
    "registeredAt": "2024-06-01T11:00:00.000Z",
    "name": "Alisher Karimov",
    "phone": "+998901112233",
    "location": "Samarqand"
  }
]
```

---

## 🔄 Bot oqimi

```
/start
  ├── 🏢 Firma → Nom → Tel1 → Tel2 → INN → Comment → Tasdiqlash → firms.json
  └── 👤 Mijoz → Ism → Tel → Joylashuv → Tasdiqlash → clients.json
```
