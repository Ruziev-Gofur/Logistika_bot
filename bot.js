const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const TOKEN = process.env.BOT_TOKEN
if (!TOKEN) {
  console.error('❌ BOT_TOKEN environment variable is not set!')
  process.exit(1)
}

const bot = new TelegramBot(TOKEN, { polling: true })

// ─── Data file paths ───────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data')
const FIRMS_FILE = path.join(DATA_DIR, 'firms.json')
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(FIRMS_FILE)) fs.writeFileSync(FIRMS_FILE, '[]')
if (!fs.existsSync(CLIENTS_FILE)) fs.writeFileSync(CLIENTS_FILE, '[]')

// ─── Helpers ───────────────────────────────────────────────────────────────────
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return []
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

// ─── Session storage (in-memory) ──────────────────────────────────────────────
// state: { step, role, data: {} }
const sessions = {}

function getSession(chatId) {
  if (!sessions[chatId])
    sessions[chatId] = { step: 'START', role: null, data: {} }
  return sessions[chatId]
}

function clearSession(chatId) {
  sessions[chatId] = { step: 'START', role: null, data: {} }
}

// ─── Keyboards ─────────────────────────────────────────────────────────────────
const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: "🏢 Firma sifatida ro'yxatdan o'tish" }],
      [{ text: '👤 Mijoz sifatida kirish' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
}

const cancelKeyboard = {
  reply_markup: {
    keyboard: [[{ text: '❌ Bekor qilish' }]],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
}

// ─── /start ────────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  clearSession(msg.chat.id)
  bot.sendMessage(
    msg.chat.id,
    `Assalomu alaykum! Xush kelibsiz! 👋\n\nQuyidagilardan birini tanlang:`,
    mainMenu,
  )
})

// ─── Main message handler ──────────────────────────────────────────────────────
bot.on('message', (msg) => {
  if (!msg.text) return
  const chatId = msg.chat.id
  const text = msg.text.trim()
  const session = getSession(chatId)

  // Cancel any flow
  if (text === '❌ Bekor qilish') {
    clearSession(chatId)
    return bot.sendMessage(chatId, '❌ Bekor qilindi. Bosh menyu:', mainMenu)
  }

  // ─── STEP: START ────────────────────────────────────────────────────────────
  if (session.step === 'START') {
    if (text === "🏢 Firma sifatida ro'yxatdan o'tish") {
      session.role = 'firm'
      session.step = 'FIRM_NAME'
      return bot.sendMessage(
        chatId,
        '🏢 Firmaning nomini kiriting:',
        cancelKeyboard,
      )
    }
    if (text === '👤 Mijoz sifatida kirish') {
      session.role = 'client'
      session.step = 'CLIENT_NAME'
      return bot.sendMessage(chatId, '👤 Ismingizni kiriting:', cancelKeyboard)
    }
    return bot.sendMessage(
      chatId,
      'Iltimos, quyidagi tugmalardan birini tanlang:',
      mainMenu,
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIRMA RO'YXATDAN O'TISH
  // ═══════════════════════════════════════════════════════════════════════════
  if (session.role === 'firm') {
    if (session.step === 'FIRM_NAME') {
      session.data.name = text
      session.step = 'FIRM_PHONE1'
      return bot.sendMessage(
        chatId,
        '📞 1-telefon raqamini kiriting (masalan: +998901234567):',
        cancelKeyboard,
      )
    }

    if (session.step === 'FIRM_PHONE1') {
      if (!isValidPhone(text)) {
        return bot.sendMessage(
          chatId,
          "⚠️ Noto'g'ri format. Iltimos, to'g'ri telefon raqam kiriting (masalan: +998901234567):",
        )
      }
      session.data.phone1 = text
      session.step = 'FIRM_PHONE2'
      return bot.sendMessage(
        chatId,
        '📞 2-telefon raqamini kiriting:',
        cancelKeyboard,
      )
    }

    if (session.step === 'FIRM_PHONE2') {
      if (!isValidPhone(text)) {
        return bot.sendMessage(
          chatId,
          "⚠️ Noto'g'ri format. Iltimos, to'g'ri telefon raqam kiriting:",
        )
      }
      session.data.phone2 = text
      session.step = 'FIRM_INN'
      return bot.sendMessage(
        chatId,
        '🔢 INN (STIR) raqamini kiriting:',
        cancelKeyboard,
      )
    }

    if (session.step === 'FIRM_INN') {
      if (!/^\d{9}$/.test(text)) {
        return bot.sendMessage(
          chatId,
          "⚠️ INN 9 ta raqamdan iborat bo'lishi kerak. Qaytadan kiriting:",
        )
      }
      session.data.inn = text
      session.step = 'FIRM_EXTRA'
      return bot.sendMessage(
        chatId,
        "📝 Qo'shimcha ma'lumot kiriting:\n(Bu ma'lumot comment sifatida saqlanadi — firma haqida qo'shimcha izoh, manzil, yoki boshqa ma'lumot)",
        cancelKeyboard,
      )
    }

    if (session.step === 'FIRM_EXTRA') {
      session.data.comment = text // ← qo'shimcha ma'lumot (comment)
      session.step = 'FIRM_CONFIRM'

      const summary =
        `📋 *Firma ma'lumotlari:*\n\n` +
        `🏢 Nomi: ${session.data.name}\n` +
        `📞 Tel 1: ${session.data.phone1}\n` +
        `📞 Tel 2: ${session.data.phone2}\n` +
        `🔢 INN: ${session.data.inn}\n` +
        `💬 Qo'shimcha: ${session.data.comment}\n\n` +
        `Ma'lumotlar to'g'rimi?`

      return bot.sendMessage(chatId, summary, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '✅ Tasdiqlash' }, { text: '❌ Bekor qilish' }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      })
    }

    if (session.step === 'FIRM_CONFIRM') {
      if (text === '✅ Tasdiqlash') {
        const firms = readJSON(FIRMS_FILE)
        const newFirm = {
          id: Date.now(),
          chatId,
          registeredAt: new Date().toISOString(),
          name: session.data.name,
          phone1: session.data.phone1,
          phone2: session.data.phone2,
          inn: session.data.inn,
          comment: session.data.comment, // ← comment sifatida saqlanadi
        }
        firms.push(newFirm)
        writeJSON(FIRMS_FILE, firms)
        clearSession(chatId)
        return bot.sendMessage(
          chatId,
          `✅ *${newFirm.name}* muvaffaqiyatli ro'yxatdan o'tdi!\n\nID: \`${newFirm.id}\``,
          { parse_mode: 'Markdown', ...mainMenu },
        )
      }
      return bot.sendMessage(
        chatId,
        'Iltimos, tasdiqlash yoki bekor qilishni tanlang.',
      )
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MIJOZ RO'YXATDAN O'TISH
  // ═══════════════════════════════════════════════════════════════════════════
  if (session.role === 'client') {
    if (session.step === 'CLIENT_NAME') {
      session.data.name = text
      session.step = 'CLIENT_PHONE'
      return bot.sendMessage(
        chatId,
        '📞 Telefon raqamingizni kiriting (masalan: +998901234567):',
        cancelKeyboard,
      )
    }

    if (session.step === 'CLIENT_PHONE') {
      if (!isValidPhone(text)) {
        return bot.sendMessage(
          chatId,
          "⚠️ Noto'g'ri format. Iltimos, to'g'ri telefon raqam kiriting:",
        )
      }
      session.data.phone = text
      session.step = 'CLIENT_LOCATION'
      return bot.sendMessage(
        chatId,
        '📍 Qayerdansiz? (Shahar yoki tuman nomini kiriting):',
        cancelKeyboard,
      )
    }

    if (session.step === 'CLIENT_LOCATION') {
      session.data.location = text
      session.step = 'CLIENT_CONFIRM'

      const summary =
        `📋 *Mijoz ma'lumotlari:*\n\n` +
        `👤 Ism: ${session.data.name}\n` +
        `📞 Tel: ${session.data.phone}\n` +
        `📍 Joylashuv: ${session.data.location}\n\n` +
        `Ma'lumotlar to'g'rimi?`

      return bot.sendMessage(chatId, summary, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '✅ Tasdiqlash' }, { text: '❌ Bekor qilish' }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      })
    }

    if (session.step === 'CLIENT_CONFIRM') {
      if (text === '✅ Tasdiqlash') {
        const clients = readJSON(CLIENTS_FILE)
        const newClient = {
          id: Date.now(),
          chatId,
          registeredAt: new Date().toISOString(),
          name: session.data.name,
          phone: session.data.phone,
          location: session.data.location,
        }
        clients.push(newClient)
        writeJSON(CLIENTS_FILE, newClient)
        clearSession(chatId)
        return bot.sendMessage(
          chatId,
          `✅ *${newClient.name}*, ma'lumotlaringiz saqlandi!\n\nTashakkur! 🙏`,
          { parse_mode: 'Markdown', ...mainMenu },
        )
      }
      return bot.sendMessage(
        chatId,
        'Iltimos, tasdiqlash yoki bekor qilishni tanlang.',
      )
    }
  }
})

// ─── Phone validator ───────────────────────────────────────────────────────────
function isValidPhone(text) {
  return /^\+?[0-9]{9,15}$/.test(text.replace(/[\s\-()]/g, ''))
}

// ─── Error handler ─────────────────────────────────────────────────────────────
bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message)
})

console.log('🤖 Bot ishga tushdi!')
