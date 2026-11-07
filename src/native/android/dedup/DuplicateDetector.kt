package com.pocketwise.upidetector.dedup

import android.content.Context
import android.content.SharedPreferences
import java.security.MessageDigest
import org.json.JSONArray
import org.json.JSONObject

class DuplicateDetector(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("pocketwise_dedup_cache", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_PROCESSED_KEYS = "processed_keys"
        private const val MAX_SAVED_KEYS = 500
        private const val TOLERANCE_WINDOW_MS = 5 * 60 * 1000L // 5 minutes
    }

    @Synchronized
    fun isDuplicate(
        packageName: String,
        amount: Double,
        merchant: String,
        timestamp: Long,
        upiReference: String?
    ): Boolean {
        val key = generateDeduplicationKey(packageName, amount, merchant, timestamp, upiReference)
        val processedKeys = getSavedKeys()
        return processedKeys.contains(key)
    }

    @Synchronized
    fun markAsProcessed(
        packageName: String,
        amount: Double,
        merchant: String,
        timestamp: Long,
        upiReference: String?
    ): String {
        val key = generateDeduplicationKey(packageName, amount, merchant, timestamp, upiReference)
        val processedKeys = getSavedKeys().toMutableList()

        if (!processedKeys.contains(key)) {
            processedKeys.add(0, key)
            // Trim if over max
            while (processedKeys.size > MAX_SAVED_KEYS) {
                processedKeys.removeAt(processedKeys.size - 1)
            }
            saveKeys(processedKeys)
        }
        return key
    }

    fun generateDeduplicationKey(
        packageName: String,
        amount: Double,
        merchant: String,
        timestamp: Long,
        upiReference: String?
    ): String {
        if (!upiReference.isNullOrBlank() && upiReference.trim().length >= 6) {
            val cleanRef = upiReference.trim().lowercase()
            return sha256("$packageName:upi:$cleanRef")
        }

        // Fallback: package + rounded amount + normalized merchant + 5-min window
        val roundedAmount = "%.2f".format(amount)
        val normalizedMerchant = merchant.trim().lowercase().replace(Regex("[^a-z0-9]"), "")
        val timeBucket = timestamp / TOLERANCE_WINDOW_MS
        val raw = "$packageName:$roundedAmount:$normalizedMerchant:$timeBucket"
        return sha256(raw)
    }

    private fun getSavedKeys(): List<String> {
        val jsonStr = prefs.getString(KEY_PROCESSED_KEYS, null) ?: return emptyList()
        return try {
            val arr = JSONArray(jsonStr)
            val list = mutableListOf<String>()
            for (i in 0 until arr.length()) {
                list.add(arr.getString(i))
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun saveKeys(keys: List<String>) {
        val arr = JSONArray()
        for (k in keys) {
            arr.put(k)
        }
        prefs.edit().putString(KEY_PROCESSED_KEYS, arr.toString()).apply()
    }

    private fun sha256(input: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val bytes = md.digest(input.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
