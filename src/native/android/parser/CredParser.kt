package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.model.DetectedTransaction

class CredParser : NotificationParser() {

    override val supportedPackages = setOf("com.dreamplug.androidapp")
    override val providerName = "CRED"

    override fun parse(
        packageName: String,
        title: String,
        text: String,
        timestamp: Long
    ): DetectedTransaction? {
        if (isIgnorableNotification(title, text)) return null

        val combined = "$title $text"
        val isRefundTx = isRefund(combined)

        val amount = extractAmount(title) ?: extractAmount(text) ?: return null

        var merchant: String? = null
        val merchantPatterns = listOf(
            Regex("(?i)paid\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+on\\s+cred|\\.|$)"),
            Regex("(?i)payment\\s+(?:of\\s+[0-9,.]+\\s+)?to\\s+([^.]+?)\\s+successful"),
            Regex("(?i)paid\\s+to\\s+([^.]+?)(?:\\s+on\\s+cred|\\.|$)"),
            Regex("(?i)to\\s+([A-Za-z0-9 &._'-]+)")
        )

        for (pattern in merchantPatterns) {
            val match = pattern.find(combined)
            if (match != null) {
                merchant = match.groupValues[1].trim()
                break
            }
        }

        if (merchant.isNullOrBlank()) {
            merchant = "CRED Payee"
        }

        val upiRef = extractUpiReference(text) ?: extractUpiReference(title)

        val isPayment = combined.contains("paid", ignoreCase = true) ||
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
            confidence = if (merchant != "CRED Payee") 0.98 else 0.85,
            upiRef = upiRef,
            isRefund = isRefundTx
        )
    }
}
