import express from "express";

const router = express.Router();

// ردود البوت الذكية
const botResponses = {
  // تحيات
  greetings: [
    "أهلاً وسهلاً! 🌟 أنا مساعدك الافتراضي لجولات العرّاب",
    "مرحباً بك في جولات الأهرامات! 🏛️ كيف يمكنني مساعدتك؟",
    "السلام عليكم! 👋 أهلاً بك مع العرّاب للسياحة"
  ],
  
  // معلومات عن الجولات
  tourInfo: [
    "🚌 نوفر جولات متنوعة للأهرامات والمعالم المصرية الشهيرة",
    "📅 جولاتنا متاحة يومياً من الساعة 8 صباحاً حتى 6 مساءً",
    "💰 الأسعار تبدأ من 50 دولار للشخص وتختلف حسب نوع الجولة",
    "🏛️ نغطي الأهرامات، أبو الهول، المتحف المصري، والمعالم التاريخية"
  ],
  
  // حجز ومعلومات التواصل
  booking: [
    "📞 للحجز والاستفسار، تواصل معنا عبر واتساب مباشرة",
    "🎫 يمكنك حجز جولتك مقدماً أو في نفس اليوم",
    "💳 نقبل الدفع نقداً أو بالكارت",
    "🚗 نوفر المواصلات المكيفة من وإلى الفندق"
  ],
  
  // افتراضي
  default: [
    "🤖 عذراً، لم أفهم سؤالك تماماً. يمكنك سؤالي عن:",
    "📋 - معلومات عن الجولات المتاحة\n- أسعار الجولات\n- طريقة الحجز\n- المواعيد المتاحة",
    "💬 أو تواصل مباشرة مع فريق العرّاب عبر واتساب!"
  ]
};

// تحليل الرسالة وإعطاء رد مناسب
function analyzeMessage(message) {
  const text = message.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '');
  
  // كلمات التحية
  if (text.match(/السلام|مرحب|أهل|hello|hi|سلام|صباح|مساء/)) {
    return getRandomResponse(botResponses.greetings);
  }
  
  // أسئلة عن الجولات
  if (text.match(/جولة|جولات|رحلة|رحلات|أهرام|سياحة|زيارة|tour|pyramid/)) {
    return getRandomResponse(botResponses.tourInfo);
  }
  
  // أسئلة عن الحجز والأسعار
  if (text.match(/حجز|سعر|أسعار|كام|كلف|دولار|جنيه|book|price|cost|pay/)) {
    return getRandomResponse(botResponses.booking);
  }
  
  // أسئلة عن التوقيت
  if (text.match(/متى|وقت|ساعة|يوم|time|when|schedule/)) {
    return "🕐 جولاتنا متاحة يومياً من 8:00 ص حتى 6:00 م\n⏰ مدة الجولة من 4-8 ساعات حسب النوع المختار\n📅 يُفضل الحجز مسبقاً لضمان المكان";
  }
  
  // أسئلة عن الموقع
  if (text.match(/فين|وين|عنوان|مكان|موقع|location|where|address/)) {
    return "📍 نقطة التجمع: فندقك أو أي مكان تحدده بالقاهرة أو الجيزة\n🚗 نوفر خدمة النقل المجاني من وإلى مكان إقامتك\n🗺️ جولاتنا تغطي منطقة الأهرامات والقاهرة التاريخية";
  }
  
  // رد افتراضي
  return getRandomResponse(botResponses.default);
}

// اختيار رد عشوائي
function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

// POST /api/chat - Chat endpoint
router.post("/", (req, res) => {
  try {
    const { message, user_id } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        error: "❌ الرسالة مطلوبة" 
      });
    }

    // تحليل الرسالة وإعطاء رد مناسب
    const botReply = analyzeMessage(message);
    
    // لوج المحادثة (اختياري للتطوير)
    console.log(`💬 [${user_id || 'Anonymous'}]: ${message}`);
    console.log(`🤖 Bot: ${botReply}`);

    res.json({ 
      success: true,
      message: message,
      reply: botReply,
      timestamp: new Date().toISOString(),
      bot_name: "مساعد العرّاب"
    });

  } catch (err) {
    console.error("❌ خطأ في Chat API:", err.message);
    res.status(500).json({ 
      error: "❌ خطأ في الخادم",
      reply: "عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى أو التواصل مباشرة عبر واتساب."
    });
  }
});

// GET /api/chat/status - حالة البوت
router.get("/status", (req, res) => {
  res.json({
    bot_status: "online",
    bot_name: "مساعد العرّاب",
    capabilities: [
      "معلومات عن الجولات",
      "الأسعار والعروض", 
      "طرق الحجز",
      "المواعيد المتاحة",
      "معلومات عامة"
    ],
    last_updated: new Date().toISOString()
  });
});

export default router;
