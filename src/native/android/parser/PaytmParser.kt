package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.model.DetectedTransaction

class PaytmParser : NotificationParser() {

    override val supportedPackages = setOf("net.one97.paytm")
    override val providerName = "Paytm"

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
        var merchant: String? = null
        val merchantPatterns = listOf(
            Regex("(?i)paid\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+at|\\s+using|\\.|$)"),
            Regex("(?i)paid\\s+to\\s+([^.]+?)(?:\\s+at|\\s+using|\\.|$)"),
            Regex("(?i)sent\\s+to\\s+([^.]+?)(?:\\s+successfully|\\.|$)"),
            Regex("(?i)money\\s+sent\\s+to\\s+([^.]+?)(?:\\s+successfully|\\.|$)"),
            Regex("(?i)payment\\s+(?:of\\s+[0-9,.]+\\s+)?to\\s+([^.]+?)\\s+successful"),
            Regex("(?i)refund\\s+(?:of\\s+[0-9,.]+\\s+)?from\\s+([^.]+?)(?:\\s+credited|\\.|$)")
        )

        for (pattern in merchantPatterns) {
            val match = pattern.find(combined)
            if (match != null) {
                merchant = match.groupValues[1].trim()
                break
            }
        }

        if (merchant.isNullOrBlank()) {
            val match = Regex("(?i)\\bto\\s+([A-Za-z0-9 &._'-]+)").find(combined)
            if (match != null) {
                merchant = match.groupValues[1].split(".")[0].trim()
            }
        }

        if (merchant.isNullOrBlank()) {
            merchant = "Paytm Merchant"
        }

        // 3. Extract UPI reference
        val upiRef = extractUpiReference(text) ?: extractUpiReference(title)

        // 4. Verify payment intent
        val isPayment = combined.contains("paid", ignoreCase = true) ||
                combined.contains("sent", ignoreCase = true) ||
                combined.contains("successful", ignoreCase = true) ||
                combined.contains("debited", ignoreCase = true) ||
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
            confidence = if (merchant != "Paytm Merchant") 0.98 else 0.85,
            upiRef = upiRef,
            isRefund = isRefundTx
        )
    }
}
