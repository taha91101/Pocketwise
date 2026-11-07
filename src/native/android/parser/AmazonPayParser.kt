package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.model.DetectedTransaction

class AmazonPayParser : NotificationParser() {

    override val supportedPackages = setOf(
        "in.amazon.mShop.android.shopping",
        "com.amazon.mShop.android.shopping"
    )
    override val providerName = "Amazon Pay"

    override fun parse(
        packageName: String,
        title: String,
        text: String,
        timestamp: Long
    ): DetectedTransaction? {
        if (isIgnorableNotification(title, text)) return null

        val combined = "$title $text"
        // Ignore general Amazon shopping delivery/shipping updates
        if (!combined.contains("pay", ignoreCase = true) &&
            !combined.contains("upi", ignoreCase = true) &&
            !combined.contains("paid", ignoreCase = true) &&
            !combined.contains("debited", ignoreCase = true)) {
            return null
        }

        val isRefundTx = isRefund(combined)
        val amount = extractAmount(title) ?: extractAmount(text) ?: return null

        var merchant: String? = null
        val merchantPatterns = listOf(
            Regex("(?i)paid\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+using|\\.|$)"),
            Regex("(?i)paid\\s+to\\s+([^.]+?)(?:\\s+using|\\.|$)"),
            Regex("(?i)payment\\s+to\\s+([^.]+?)\\s+successful"),
            Regex("(?i)order\\s+placed\\s+at\\s+([^.]+?)(?:\\.|$)")
        )

        for (pattern in merchantPatterns) {
            val match = pattern.find(combined)
            if (match != null) {
                merchant = match.groupValues[1].trim()
                break
            }
        }

        if (merchant.isNullOrBlank()) {
            merchant = "Amazon"
        }

        val upiRef = extractUpiReference(text) ?: extractUpiReference(title)

        val isPayment = combined.contains("paid", ignoreCase = true) ||
                combined.contains("successful", ignoreCase = true) ||
                combined.contains("debited", ignoreCase = true) ||
                combined.contains("order placed", ignoreCase = true) ||
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
            confidence = 0.95,
            upiRef = upiRef,
            isRefund = isRefundTx
        )
    }
}
