package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.model.DetectedTransaction

class BHIMParser : NotificationParser() {

    override val supportedPackages = setOf("in.org.npci.upiapp")
    override val providerName = "BHIM UPI"

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
            Regex("(?i)paid\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+successful|\\.|$)"),
            Regex("(?i)sent\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+successful|\\.|$)"),
            Regex("(?i)transferred\\s+(?:₹|rs\\.?|inr)?[0-9,.]*\\s*to\\s+([^.]+?)(?:\\s+successful|\\.|$)"),
            Regex("(?i)to\\s+([A-Za-z0-9 &._'-]+)")
        )

        for (pattern in merchantPatterns) {
            val match = pattern.find(combined)
            if (match != null) {
                merchant = match.groupValues[1].split(".")[0].trim()
                break
            }
        }

        if (merchant.isNullOrBlank()) {
            merchant = "BHIM Payee"
        }

        val upiRef = extractUpiReference(text) ?: extractUpiReference(title)

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
            confidence = if (merchant != "BHIM Payee") 0.96 else 0.82,
            upiRef = upiRef,
            isRefund = isRefundTx
        )
    }
}
