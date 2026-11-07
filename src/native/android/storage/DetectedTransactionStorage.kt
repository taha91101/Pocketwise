package com.pocketwise.upidetector.storage

import android.content.Context
import android.content.SharedPreferences
import com.pocketwise.upidetector.model.DetectedTransaction
import org.json.JSONArray
import org.json.JSONObject

class DetectedTransactionStorage(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("pocketwise_upi_storage", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TRANSACTIONS = "detected_transactions"
        private const val KEY_DETECTION_ENABLED = "detection_enabled"
        private const val KEY_AUTO_CONFIRM = "auto_confirm_high_confidence"
        private const val KEY_REFUNDS_ENABLED = "refunds_enabled"
        private const val KEY_BANK_ENABLED = "bank_notifications_enabled"
        private const val MAX_STORED_TRANSACTIONS = 200
    }

    @Synchronized
    fun saveTransaction(transaction: DetectedTransaction) {
        val list = getAllTransactions().toMutableList()
        // Check if transaction with this id already exists, update it if so
        val index = list.indexOfFirst { it.id == transaction.id }
        if (index >= 0) {
            list[index] = transaction
        } else {
            list.add(0, transaction)
        }

        while (list.size > MAX_STORED_TRANSACTIONS) {
            list.removeAt(list.size - 1)
        }

        persistList(list)
    }

    @Synchronized
    fun getAllTransactions(): List<DetectedTransaction> {
        val jsonStr = prefs.getString(KEY_TRANSACTIONS, null) ?: return emptyList()
        return try {
            val arr = JSONArray(jsonStr)
            val result = mutableListOf<DetectedTransaction>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                result.add(DetectedTransaction.fromJsonObject(obj))
            }
            result
        } catch (e: Exception) {
            emptyList()
        }
    }

    @Synchronized
    fun updateTransactionStatus(id: String, newStatus: String): Boolean {
        val list = getAllTransactions().toMutableList()
        val index = list.indexOfFirst { it.id == id }
        if (index >= 0) {
            val item = list[index]
            list[index] = item.copy(status = newStatus)
            persistList(list)
            return true
        }
        return false
    }

    @Synchronized
    fun updateTransaction(updated: DetectedTransaction): Boolean {
        val list = getAllTransactions().toMutableList()
        val index = list.indexOfFirst { it.id == updated.id }
        if (index >= 0) {
            list[index] = updated
            persistList(list)
            return true
        }
        return false
    }

    @Synchronized
    fun removeTransaction(id: String): Boolean {
        val list = getAllTransactions().toMutableList()
        val removed = list.removeAll { it.id == id }
        if (removed) {
            persistList(list)
        }
        return removed
    }

    @Synchronized
    fun clearAll() {
        prefs.edit().remove(KEY_TRANSACTIONS).apply()
    }

    private fun persistList(list: List<DetectedTransaction>) {
        val arr = JSONArray()
        for (item in list) {
            arr.put(item.toJsonObject())
        }
        prefs.edit().putString(KEY_TRANSACTIONS, arr.toString()).apply()
    }

    // Settings getters & setters
    var isDetectionEnabled: Boolean
        get() = prefs.getBoolean(KEY_DETECTION_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_DETECTION_ENABLED, value).apply()

    var isAutoConfirmHighConfidence: Boolean
        get() = prefs.getBoolean(KEY_AUTO_CONFIRM, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_CONFIRM, value).apply()

    var isRefundsEnabled: Boolean
        get() = prefs.getBoolean(KEY_REFUNDS_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_REFUNDS_ENABLED, value).apply()

    var isBankNotificationsEnabled: Boolean
        get() = prefs.getBoolean(KEY_BANK_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_BANK_ENABLED, value).apply()
}
