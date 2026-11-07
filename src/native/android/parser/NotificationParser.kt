package com.pocketwise.upidetector.parser

import com.pocketwise.upidetector.categorizer.MerchantCategorizer
import com.pocketwise.upidetector.model.DetectedTransaction
import java.util.UUID

abstract class NotificationParser {

    abstract val supportedPackages: Set<String>
    abstract val providerName: String

    open fun canParse(packageName: String): Boolean {
        return supportedPackages.contains(packageName)
    }

    abstract fun parse(
        packageName: String,
        title: String,
        text: String,
        timestamp: Long
    ): DetectedTransaction?

    protected fun isIgnorableNotification(title: String, text: String): Boolean {
        val combined = "$title $text".lowercase()

        // 1. Check for failed/pending transactions
        val failurePatterns = listOf(
            "failed", "declined", "unsuccessful", "cancelled", "timed out",
            "could not be processed", "unable to process", "reversed due to failure",
            "pending", "in progress", "processing your payment", "payment is being processed"
        )
        if (failurePatterns.any { combined.contains(it) }) {
            return true
        }

        // 2. Check for requests / collects / reminders
        val requestPatterns = listOf(
            "requested", "request received", "request from", "requests money",
            "collect request", "payment request", "pay request", "reminder to pay",
            "upcoming bill", "bill due", "reminder:"
        )
        if (requestPatterns.any { combined.contains(it) }) {
            return true
        }

        // 3. Check for promotional / cashback / advertisements / balance queries
        val noisePatterns = listOf(
            "scratch card", "cashback of", "won cashback", "earned cashback",
            "reward points", "refer and earn", "exclusive offer", "flat off",
            "discount on", "win up to", "special offer", "loan approved",
            "credit score", "insurance policy", "invest in",
            "otp", "verification code", "one time password", "secret otp", "do not share"
        )
        if (noisePatterns.any { combined.contains(it) }) {
            return true
        }

        // Balance enquiry without debit or credit
        if (combined.contains("available balance is") && !combined.contains("debited") && !combined.contains("paid")) {
            return true
        }

        return false
    }

    protected fun extractAmount(text: String): Double? {
        // Matches ₹450, ₹ 450, Rs. 450.50, INR 1,250.00, etc.
        val amountRegex = Regex("(?i)(?:₹|rs\\.?|inr)\\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)")
        val match = amountRegex.find(text) ?: return null

        val rawAmount = match.groupValues[1].replace(",", "")
        return rawAmount.toDoubleOrNull()
    }

    protected fun extractUpiReference(text: String): String? {
        // Matches UPI Ref: 123456789012, UTR: 123456789012, Txn ID: ...
        val refPatterns = listOf(
            Regex("(?i)(?:upi\\s*ref(?:erence)?(?:\\s*no)?|utr(?:\\s*no)?|ref\\s*no)\\s*[:\\-]?\\s*([a-zA-Z0-9]{8,24})"),
            Regex("(?i)(?:txn(?:\\s*id)?|transaction\\s*id)\\s*[:\\-]?\\s*([a-zA-Z0-9]{8,24})"),
            Regex("\\b([0-9]{12})\\b") // 12-digit standard NPCI UPI transaction reference
        )

        for (pattern in refPatterns) {
            val match = pattern.find(text)
            if (match != null) {
                return match.groupValues[1]
            }
        }
        return null
    }

    protected fun isRefund(text: String): Boolean {
        val lower = text.lowercase()
        return lower.contains("refund") ||
                lower.contains("credited as refund") ||
                (lower.contains("refund of") && lower.contains("credited"))
    }

    protected fun createDetectedTransaction(
        packageName: String,
        amount: Double,
        merchantRaw: String,
        timestamp: Long,
        provider: String,
        title: String,
        text: String,
        confidence: Double,
        upiRef: String? = null,
        isRefund: Boolean = false
    ): DetectedTransaction {
        val cleanMerchant = MerchantCategorizer.cleanMerchantName(merchantRaw)
        val categoryMatch = MerchantCategorizer.categorize(cleanMerchant)

        val id = "upi-${System.currentTimeMillis()}-${UUID.randomUUID().toString().substring(0, 8)}"
        val combinedConfidence = (confidence * categoryMatch.confidence).coerceIn(0.5, 0.99)

        return DetectedTransaction(
            id = id,
            amount = amount,
            type = if (isRefund) "income" else "expense",
            merchant = cleanMerchant,
            suggestedCategory = categoryMatch.categoryName,
            suggestedCategoryId = categoryMatch.categoryId,
            paymentMethod = "UPI",
            paymentProvider = provider,
            sourcePackage = packageName,
            upiReference = upiRef,
            transactionTimestamp = timestamp,
            createdAt = System.currentTimeMillis(),
            isAutomaticallyDetected = true,
            detectionConfidence = (combinedConfidence * 100).toInt() / 100.0,
            rawReferenceHash = "${packageName}_${amount}_${cleanMerchant}_${timestamp}",
            status = "DETECTED",
            rawTitleSnippet = title.take(100),
            rawTextSnippet = text.take(150),
            notes = if (isRefund) "Refund detected from $provider" else "Auto-detected UPI payment via $provider"
        )
    }
}
