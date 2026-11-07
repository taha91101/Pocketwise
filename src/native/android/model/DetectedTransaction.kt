package com.pocketwise.upidetector.model

import org.json.JSONObject

data class DetectedTransaction(
    val id: String,
    val amount: Double,
    val type: String, // "expense" or "income" (for refund)
    val merchant: String,
    val suggestedCategory: String,
    val suggestedCategoryId: String,
    val paymentMethod: String = "UPI",
    val paymentProvider: String,
    val sourcePackage: String,
    val upiReference: String? = null,
    val transactionTimestamp: Long,
    val createdAt: Long = System.currentTimeMillis(),
    val isAutomaticallyDetected: Boolean = true,
    val detectionConfidence: Double,
    val rawReferenceHash: String,
    val status: String = "DETECTED", // "DETECTED", "CONFIRMED", "REJECTED", "IGNORED"
    val rawTitleSnippet: String? = null,
    val rawTextSnippet: String? = null,
    val notes: String? = null
) {
    fun toJsonObject(): JSONObject {
        val json = JSONObject()
        json.put("id", id)
        json.put("amount", amount)
        json.put("type", type)
        json.put("merchant", merchant)
        json.put("suggestedCategory", suggestedCategory)
        json.put("suggestedCategoryId", suggestedCategoryId)
        json.put("paymentMethod", paymentMethod)
        json.put("paymentProvider", paymentProvider)
        json.put("sourcePackage", sourcePackage)
        json.put("upiReference", upiReference ?: JSONObject.NULL)
        json.put("transactionTimestamp", transactionTimestamp)
        json.put("createdAt", createdAt)
        json.put("isAutomaticallyDetected", isAutomaticallyDetected)
        json.put("detectionConfidence", detectionConfidence)
        json.put("rawReferenceHash", rawReferenceHash)
        json.put("status", status)
        json.put("rawTitleSnippet", rawTitleSnippet ?: JSONObject.NULL)
        json.put("rawTextSnippet", rawTextSnippet ?: JSONObject.NULL)
        json.put("notes", notes ?: JSONObject.NULL)
        return json
    }

    companion object {
        fun fromJsonObject(json: JSONObject): DetectedTransaction {
            return DetectedTransaction(
                id = json.optString("id"),
                amount = json.optDouble("amount", 0.0),
                type = json.optString("type", "expense"),
                merchant = json.optString("merchant", "Unknown Payee"),
                suggestedCategory = json.optString("suggestedCategory", "Other Expenses"),
                suggestedCategoryId = json.optString("suggestedCategoryId", "cat-other-exp"),
                paymentMethod = json.optString("paymentMethod", "UPI"),
                paymentProvider = json.optString("paymentProvider", "UPI"),
                sourcePackage = json.optString("sourcePackage", ""),
                upiReference = if (json.isNull("upiReference")) null else json.optString("upiReference"),
                transactionTimestamp = json.optLong("transactionTimestamp", System.currentTimeMillis()),
                createdAt = json.optLong("createdAt", System.currentTimeMillis()),
                isAutomaticallyDetected = json.optBoolean("isAutomaticallyDetected", true),
                detectionConfidence = json.optDouble("detectionConfidence", 0.5),
                rawReferenceHash = json.optString("rawReferenceHash", ""),
                status = json.optString("status", "DETECTED"),
                rawTitleSnippet = if (json.isNull("rawTitleSnippet")) null else json.optString("rawTitleSnippet"),
                rawTextSnippet = if (json.isNull("rawTextSnippet")) null else json.optString("rawTextSnippet"),
                notes = if (json.isNull("notes")) null else json.optString("notes")
            )
        }
    }
}
