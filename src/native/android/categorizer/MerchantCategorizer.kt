package com.pocketwise.upidetector.categorizer

data class CategoryMatch(
    val categoryId: String,
    val categoryName: String,
    val confidence: Double
)

object MerchantCategorizer {

    private val DIRECT_MERCHANT_MAP = mapOf(
        // Food & Dining (cat-food)
        "swiggy" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "zomato" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "starbucks" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "mcdonalds" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "mc donalds" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "kfc" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "dominos" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "pizza hut" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "burger king" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "subway" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "chaayos" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "chai point" to CategoryMatch("cat-food", "Food & Dining", 0.98),
        "haldiram" to CategoryMatch("cat-food", "Food & Dining", 0.95),
        "barbeque nation" to CategoryMatch("cat-food", "Food & Dining", 0.95),
        "cafe coffee day" to CategoryMatch("cat-food", "Food & Dining", 0.95),

        // Groceries (cat-groceries)
        "blinkit" to CategoryMatch("cat-groceries", "Groceries", 0.98),
        "zepto" to CategoryMatch("cat-groceries", "Groceries", 0.98),
        "instamart" to CategoryMatch("cat-groceries", "Groceries", 0.98),
        "bigbasket" to CategoryMatch("cat-groceries", "Groceries", 0.98),
        "bbdaily" to CategoryMatch("cat-groceries", "Groceries", 0.98),
        "dmart" to CategoryMatch("cat-groceries", "Groceries", 0.98),
        "spencer" to CategoryMatch("cat-groceries", "Groceries", 0.95),
        "nature's basket" to CategoryMatch("cat-groceries", "Groceries", 0.95),
        "reliance fresh" to CategoryMatch("cat-groceries", "Groceries", 0.95),
        "reliance smart" to CategoryMatch("cat-groceries", "Groceries", 0.95),

        // Transport (cat-transport)
        "uber" to CategoryMatch("cat-transport", "Transport", 0.98),
        "ola" to CategoryMatch("cat-transport", "Transport", 0.98),
        "rapido" to CategoryMatch("cat-transport", "Transport", 0.98),
        "namma yatri" to CategoryMatch("cat-transport", "Transport", 0.98),
        "fastag" to CategoryMatch("cat-transport", "Transport", 0.98),
        "iocl" to CategoryMatch("cat-transport", "Transport", 0.95),
        "indian oil" to CategoryMatch("cat-transport", "Transport", 0.95),
        "hpcl" to CategoryMatch("cat-transport", "Transport", 0.95),
        "hindustan petroleum" to CategoryMatch("cat-transport", "Transport", 0.95),
        "bpcl" to CategoryMatch("cat-transport", "Transport", 0.95),
        "bharat petroleum" to CategoryMatch("cat-transport", "Transport", 0.95),
        "shell" to CategoryMatch("cat-transport", "Transport", 0.95),
        "metro" to CategoryMatch("cat-transport", "Transport", 0.90),

        // Shopping (cat-shopping)
        "amazon" to CategoryMatch("cat-shopping", "Shopping", 0.95),
        "flipkart" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "myntra" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "ajio" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "meesho" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "nykaa" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "tata cliq" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "zara" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "h&m" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "decathlon" to CategoryMatch("cat-shopping", "Shopping", 0.98),
        "croma" to CategoryMatch("cat-shopping", "Shopping", 0.95),
        "reliance digital" to CategoryMatch("cat-shopping", "Shopping", 0.95),

        // Bills & Utilities (cat-bills)
        "airtel" to CategoryMatch("cat-bills", "Bills & Utilities", 0.95),
        "jio" to CategoryMatch("cat-bills", "Bills & Utilities", 0.95),
        "vi" to CategoryMatch("cat-bills", "Bills & Utilities", 0.90),
        "vodafone" to CategoryMatch("cat-bills", "Bills & Utilities", 0.95),
        "bescom" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "tneb" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "mseb" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "adani electricity" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "tata power" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "act fibernet" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "tatasky" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "tata play" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "indane" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "bharat gas" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),
        "hp gas" to CategoryMatch("cat-bills", "Bills & Utilities", 0.98),

        // Entertainment (cat-entertainment)
        "netflix" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "spotify" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "hotstar" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "disney+hotstar" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "bookmyshow" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "pvr" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "inox" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "cinepolis" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),
        "youtube" to CategoryMatch("cat-entertainment", "Entertainment", 0.95),
        "apple music" to CategoryMatch("cat-entertainment", "Entertainment", 0.98),

        // Health & Medical (cat-health)
        "apollo" to CategoryMatch("cat-health", "Health & Medical", 0.95),
        "pharmeasy" to CategoryMatch("cat-health", "Health & Medical", 0.98),
        "1mg" to CategoryMatch("cat-health", "Health & Medical", 0.98),
        "tata 1mg" to CategoryMatch("cat-health", "Health & Medical", 0.98),
        "medplus" to CategoryMatch("cat-health", "Health & Medical", 0.98),
        "netmeds" to CategoryMatch("cat-health", "Health & Medical", 0.98),
        "practo" to CategoryMatch("cat-health", "Health & Medical", 0.98),

        // Travel (cat-travel)
        "irctc" to CategoryMatch("cat-travel", "Travel", 0.98),
        "makemytrip" to CategoryMatch("cat-travel", "Travel", 0.98),
        "cleartrip" to CategoryMatch("cat-travel", "Travel", 0.98),
        "goibibo" to CategoryMatch("cat-travel", "Travel", 0.98),
        "yatra" to CategoryMatch("cat-travel", "Travel", 0.98),
        "easemytrip" to CategoryMatch("cat-travel", "Travel", 0.98),
        "redbus" to CategoryMatch("cat-travel", "Travel", 0.98),
        "abhibus" to CategoryMatch("cat-travel", "Travel", 0.98),
        "indigo" to CategoryMatch("cat-travel", "Travel", 0.98),
        "air india" to CategoryMatch("cat-travel", "Travel", 0.98),
        "vistara" to CategoryMatch("cat-travel", "Travel", 0.98),

        // Education (cat-education)
        "udemy" to CategoryMatch("cat-education", "Education", 0.98),
        "coursera" to CategoryMatch("cat-education", "Education", 0.98),
        "unacademy" to CategoryMatch("cat-education", "Education", 0.98),
        "byjus" to CategoryMatch("cat-education", "Education", 0.98),
        "physics wallah" to CategoryMatch("cat-education", "Education", 0.98),

        // Rent (cat-rent)
        "nobroker" to CategoryMatch("cat-rent", "Rent & Housing", 0.95),
        "mygate" to CategoryMatch("cat-rent", "Rent & Housing", 0.95)
    )

    private val KEYWORD_PATTERNS = listOf(
        Regex("(?i)\\b(restaurant|cafe|coffee|dhaba|baker|bakery|sweets|kitchen|bistro|diner|food|tea|chai|snacks|biryani|burger|pizza)\\b") to CategoryMatch("cat-food", "Food & Dining", 0.88),
        Regex("(?i)\\b(grocery|supermarket|kirana|provisions|vegetable|fruits|dairy|milk|mart)\\b") to CategoryMatch("cat-groceries", "Groceries", 0.88),
        Regex("(?i)\\b(fuel|petrol|diesel|gas station|toll|auto|cab|taxi|parking|metro|transit)\\b") to CategoryMatch("cat-transport", "Transport", 0.88),
        Regex("(?i)\\b(store|retail|fashion|apparel|clothing|mall|electronics|footwear)\\b") to CategoryMatch("cat-shopping", "Shopping", 0.85),
        Regex("(?i)\\b(electric|power|water|utility|broadband|wifi|dth|recharge|bill)\\b") to CategoryMatch("cat-bills", "Bills & Utilities", 0.90),
        Regex("(?i)\\b(cinema|theatre|movies|multiplex|games|gaming)\\b") to CategoryMatch("cat-entertainment", "Entertainment", 0.88),
        Regex("(?i)\\b(pharmacy|chemist|hospital|clinic|diagnostic|meds|medical|dentist|doctor)\\b") to CategoryMatch("cat-health", "Health & Medical", 0.90),
        Regex("(?i)\\b(hotel|resort|lodge|stay|airline|flight|railway|train)\\b") to CategoryMatch("cat-travel", "Travel", 0.88),
        Regex("(?i)\\b(school|college|institute|academy|tuition|exam|books)\\b") to CategoryMatch("cat-education", "Education", 0.88),
        Regex("(?i)\\b(rent|maintenance|society|landlord)\\b") to CategoryMatch("cat-rent", "Rent & Housing", 0.90)
    )

    fun categorize(merchantRaw: String): CategoryMatch {
        val normalized = merchantRaw.trim().lowercase()

        // 1. Direct map check
        for ((key, match) in DIRECT_MERCHANT_MAP) {
            if (normalized == key || normalized.contains(key)) {
                return match
            }
        }

        // 2. Keyword patterns
        for ((regex, match) in KEYWORD_PATTERNS) {
            if (regex.containsMatchIn(merchantRaw)) {
                return match
            }
        }

        // 3. Fallback
        return CategoryMatch("cat-other-exp", "Other Expenses", 0.50)
    }

    fun cleanMerchantName(raw: String): String {
        var clean = raw.trim()

        // Remove UPI handle if present (e.g., "starbucks@okaxis" -> "Starbucks")
        if (clean.contains("@")) {
            val parts = clean.split("@")
            if (parts[0].length >= 3 && !parts[0].all { it.isDigit() }) {
                clean = parts[0]
            }
        }

        // Remove common transaction prefixes/suffixes
        clean = clean.replace(Regex("(?i)^(paid to|to|m/s|vpa:|payee:|sent to)\\s+"), "")
        clean = clean.replace(Regex("(?i)\\s+(pvt ltd|ltd|limited|private limited|corp|inc)\\.?$"), "")

        // Clean punctuation and double spaces
        clean = clean.replace(Regex("[_.-]+"), " ").trim()
        clean = clean.replace(Regex("\\s+"), " ")

        // Capitalize words nicely (Title Case)
        return clean.split(" ")
            .filter { it.isNotBlank() }
            .joinToString(" ") { word ->
                if (word.length <= 3 && word.all { it.isLetter() } && word.uppercase() == word) {
                    word // keep acronyms like KFC, PVR, HP
                } else {
                    word.lowercase().replaceFirstChar { it.uppercase() }
                }
            }
            .ifEmpty { "Unknown Payee" }
    }
}
