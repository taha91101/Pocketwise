package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.model.DetectedTransaction

class PhonePeParser : NotificationParser() {

    override val supportedPackages = setOf("com.phonepe.app")
    override val providerName = "PhonePe"

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
            Regex("(?i)payment\\s+of\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)\\s+successful"),
            Regex("(?i)paid\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+successful|\\.|$)"),
            Regex("(?i)paid\\s+to\\s+([^.]+?)(?:\\s+successful|\\.|$)"),
            Regex("(?i)sent\\s+to\\s+([^.]+?)(?:\\s+successful|\\.|$)"),
            Regex("(?i)money\\s+transferred\\s+to\\s+([^.]+?)(?:\\s+successful|\\.|$)"),
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
            if (combined.contains("to ", ignoreCase = true)) {
                val match = Regex("(?i)\\bto\\s+([A-Za-z0-9 &._'-]+)").find(combined)
                if (match != null) {
                    merchant = match.groupValues[1].split(".")[0].trim()
                }
            }
        }

        if (merchant.isNullOrBlank()) {
            merchant = "PhonePe Merchant"
        }

        // 3. Extract UPI reference
        val upiRef = extractUpiReference(text) ?: extractUpiReference(title)

        // 4. Verify payment intent
        val isPayment = combined.contains("successful", ignoreCase = true) ||
                combined.contains("paid", ignoreCase = true) ||
                combined.contains("sent", ignoreCase = true) ||
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
            confidence = if (merchant != "PhonePe Merchant") 0.98 else 0.85,
            upiRef = upiRef,
            isRefund = isRefundTx
        )
    }
}
