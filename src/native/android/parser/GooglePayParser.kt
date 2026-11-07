package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.model.DetectedTransaction

class GooglePayParser : NotificationParser() {

    override val supportedPackages = setOf("com.google.android.apps.nbu.paisa.user")
    override val providerName = "Google Pay"

    override fun parse(
        packageName: String,
        title: String,
        text: String,
        timestamp: Long
    ): DetectedTransaction? {
        if (isIgnorableNotification(title, text)) return null

        val combined = "$title $text"
        val isRefundTx = isRefund(combined)

        // 1. Extract Amount
        val amount = extractAmount(title) ?: extractAmount(text) ?: return null

        // 2. Extract Merchant
        // Patterns:
        // "Paid ₹450 to Starbucks"
        // "Paid to Starbucks"
        // "You paid ₹450 to Starbucks"
        // "₹450 paid to Starbucks"
        // "Refund from Starbucks"
        var merchant: String? = null
        val merchantPatterns = listOf(
            Regex("(?i)paid\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+using|\\s+from|\\.|$)"),
            Regex("(?i)paid\\s+to\\s+([^.]+?)(?:\\s+using|\\s+from|\\.|$)"),
            Regex("(?i)sent\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+using|\\s+from|\\.|$)"),
            Regex("(?i)(?:₹|rs\\.?|inr)[0-9,.]*\\s*paid\\s+to\\s+([^.]+?)(?:\\s+using|\\s+from|\\.|$)"),
            Regex("(?i)payment\\s+to\\s+([^.]+?)\\s+successful"),
            Regex("(?i)refund\\s+(?:of\\s+[0-9,.]+\\s+)?from\\s+([^.]+?)(?:\\s+processed|\\.|$)")
        )

        for (source in listOf(title, text, combined)) {
            for (pattern in merchantPatterns) {
                val match = pattern.find(source)
                if (match != null) {
                    merchant = match.groupValues[1].trim()
                    break
                }
            }
            if (!merchant.isNullOrBlank()) break
        }

        // If no merchant from regex, try extracting from title if title is "Paid to XYZ"
        if (merchant.isNullOrBlank()) {
            if (title.contains("to ", ignoreCase = true)) {
                val parts = title.split(Regex("(?i)\\bto\\b"))
                if (parts.size > 1 && parts[1].isNotBlank()) {
                    merchant = parts[1].trim()
                }
            } else if (text.contains("to ", ignoreCase = true)) {
                val parts = text.split(Regex("(?i)\\bto\\b"))
                if (parts.size > 1 && parts[1].isNotBlank()) {
                    merchant = parts[1].split(".")[0].trim()
                }
            }
        }

        if (merchant.isNullOrBlank()) {
            merchant = "Google Pay Merchant"
        }

        // 3. Extract UPI reference
        val upiRef = extractUpiReference(text) ?: extractUpiReference(title)

        // 4. Verify payment intent
        val isPayment = combined.contains("paid", ignoreCase = true) ||
                combined.contains("sent", ignoreCase = true) ||
                combined.contains("debited", ignoreCase = true) ||
                combined.contains("successful", ignoreCase = true) ||
                isRefundTx

        if (!isPayment) return null

        return createDetectedTransaction(
            packageName = packageName,
            amount = amount,
            merchantRaw = merchant,
            timestamp = timestamp,
            provider = providerName,
            title = title,
            text = text,
            confidence = if (merchant != "Google Pay Merchant") 0.98 else 0.85,
            upiRef = upiRef,
            isRefund = isRefundTx
        )
    }
}
