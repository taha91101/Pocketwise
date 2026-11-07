package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.model.DetectedTransaction

class GenericBankUPIParser : NotificationParser() {

    override val supportedPackages = setOf(
        // Top Indian Banking Apps
        "com.snapwork.hdfc",
        "com.sbi.lotusintouch",
        "com.sbi.SBIFreedomPlus",
        "com.csam.icici.bank.imobile",
        "com.axis.mobile",
        "com.kotak.mb",
        "com.pnb.one",
        "com.bankofbaroda.mconnect",
        "com.canarabank.mobility",
        "com.infrasofttech.uboi",
        "com.indusind.mobile",
        "com.yesbank",
        "com.fedmobile",
        "com.idfcfirstbank.optimus",
        "com.samsung.android.spay"
    )

    override val providerName = "Bank UPI"

    // Can also act as fallback parser if notification explicitly contains UPI transaction indicators
    fun canParseGeneric(packageName: String, title: String, text: String): Boolean {
        if (supportedPackages.contains(packageName)) return true

        val combined = "$title $text".lowercase()
        val hasDebit = combined.contains("debited") || combined.contains("paid") || combined.contains("sent")
        val hasUpi = combined.contains("upi") || combined.contains("vpa") || combined.contains("utr")
        val hasAmount = combined.contains("₹") || combined.contains("rs") || combined.contains("inr")

        return hasDebit && hasUpi && hasAmount
    }

    override fun parse(
        packageName: String,
        title: String,
        text: String,
        timestamp: Long
    ): DetectedTransaction? {
        if (isIgnorableNotification(title, text)) return null

        val combined = "$title $text"
        val isRefundTx = isRefund(combined)

        // Must be a debit transaction or refund
        val isDebit = combined.contains("debited", ignoreCase = true) ||
                combined.contains("paid", ignoreCase = true) ||
                combined.contains("sent", ignoreCase = true) ||
                combined.contains("withdrawn", ignoreCase = true) ||
                isRefundTx

        if (!isDebit) return null

        // 1. Extract Amount
        val amount = extractAmount(title) ?: extractAmount(text) ?: return null

        // 2. Identify Bank or App Name
        val bankName = resolveBankName(packageName, combined)

        // 3. Extract Payee / Merchant
        var merchant: String? = null
        val merchantPatterns = listOf(
            Regex("(?i)(?:towards\\s+upi[/-]|towards|to|info\\s*:?\\s*upi[/-])\\s*([A-Za-z0-9 &._'-]+?)(?:\\s+on|\\s+ref|\\s+avl|\\s+bal|\\.|$)"),
            Regex("(?i)vpa\\s+([A-Za-z0-9 &._'-]+?)(?:\\s+on|\\s+ref|\\s+avl|\\s+bal|\\.|$)"),
            Regex("(?i)paid\\s+to\\s+([^.]+?)(?:\\s+on|\\s+ref|\\s+avl|\\.|$)"),
            Regex("(?i)transferred\\s+to\\s+([^.]+?)(?:\\s+on|\\s+ref|\\s+avl|\\.|$)")
        )

        for (source in listOf(title, text, combined)) {
            for (pattern in merchantPatterns) {
                val match = pattern.find(source)
                if (match != null) {
                    var candidate = match.groupValues[1].trim()
                    candidate = candidate.replace(Regex("(?i)^upi[/-]"), "").trim()
                    if (candidate.length >= 3 && !candidate.startsWith("ac", ignoreCase = true)) {
                        merchant = candidate
                        break
                    }
                }
            }
            if (!merchant.isNullOrBlank()) break
        }

        if (merchant.isNullOrBlank()) {
            merchant = "$bankName Payee"
        }

        // 4. Extract UPI Ref / UTR
        val upiRef = extractUpiReference(text) ?: extractUpiReference(title)

        return createDetectedTransaction(
            packageName = packageName,
            amount = amount,
            merchantRaw = merchant,
            timestamp = timestamp,
            provider = bankName,
            title = title,
            text = text,
            confidence = if (merchant.contains("Payee")) 0.85 else 0.92,
            upiRef = upiRef,
            isRefund = isRefundTx
        )
    }

    private fun resolveBankName(packageName: String, text: String): String {
        return when {
            packageName.contains("hdfc") || text.contains("hdfc", ignoreCase = true) -> "HDFC Bank"
            packageName.contains("sbi") || text.contains("sbi", ignoreCase = true) -> "SBI"
            packageName.contains("icici") || text.contains("icici", ignoreCase = true) -> "ICICI Bank"
            packageName.contains("axis") || text.contains("axis", ignoreCase = true) -> "Axis Bank"
            packageName.contains("kotak") || text.contains("kotak", ignoreCase = true) -> "Kotak Bank"
            packageName.contains("pnb") || text.contains("pnb", ignoreCase = true) -> "PNB"
            packageName.contains("bankofbaroda") || text.contains("bob", ignoreCase = true) -> "Bank of Baroda"
            packageName.contains("canarabank") || text.contains("canara", ignoreCase = true) -> "Canara Bank"
            packageName.contains("indusind") || text.contains("indusind", ignoreCase = true) -> "IndusInd Bank"
            packageName.contains("idfc") || text.contains("idfc", ignoreCase = true) -> "IDFC FIRST Bank"
            packageName.contains("spay") || text.contains("samsung", ignoreCase = true) -> "Samsung Pay"
            else -> "Bank UPI"
        }
    }
}
