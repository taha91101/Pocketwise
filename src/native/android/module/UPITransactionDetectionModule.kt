package com.pocketwise.upidetector.module

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.pocketwise.upidetector.dedup.DuplicateDetector
import com.pocketwise.upidetector.model.DetectedTransaction
import com.pocketwise.upidetector.parser.ParserRegistry
import com.pocketwise.upidetector.service.UPINotificationListenerService
import com.pocketwise.upidetector.storage.DetectedTransactionStorage
import org.json.JSONObject

class UPITransactionDetectionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val storage = DetectedTransactionStorage(reactContext)
    private val duplicateDetector = DuplicateDetector(reactContext)

    companion object {
        const val NAME = "UPITransactionDetectionModule"
        private var activeModule: UPITransactionDetectionModule? = null

        fun notifyTransactionDetected(transaction: DetectedTransaction) {
            activeModule?.emitEvent("UPI_TRANSACTION_DETECTED", transaction.toJsonObject().toString())
        }
    }

    override fun initialize() {
        super.initialize()
        activeModule = this
    }

    override fun invalidate() {
        super.invalidate()
        if (activeModule == this) {
            activeModule = null
        }
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun isNotificationAccessGranted(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageName = context.packageName
            val packages = NotificationManagerCompat.getEnabledListenerPackages(context)
            val granted = packages.contains(packageName)
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openNotificationAccessSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", "Could not open Notification Access settings: ${e.message}")
        }
    }

    @ReactMethod
    fun isDetectionEnabled(promise: Promise) {
        promise.resolve(storage.isDetectionEnabled)
    }

    @ReactMethod
    fun setDetectionEnabled(enabled: Boolean, promise: Promise) {
        storage.isDetectionEnabled = enabled
        promise.resolve(true)
    }

    @ReactMethod
    fun isAutoConfirmEnabled(promise: Promise) {
        promise.resolve(storage.isAutoConfirmHighConfidence)
    }

    @ReactMethod
    fun setAutoConfirmEnabled(enabled: Boolean, promise: Promise) {
        storage.isAutoConfirmHighConfidence = enabled
        promise.resolve(true)
    }

    @ReactMethod
    fun getSupportedPaymentApps(promise: Promise) {
        try {
            val list = ParserRegistry.getAllConfigs()
            val array = WritableNativeArray()
            for (app in list) {
                val map = WritableNativeMap().apply {
                    putString("packageName", app.packageName)
                    putString("displayName", app.displayName)
                    putBoolean("isEnabled", app.isEnabled)
                }
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("APP_CONFIG_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getDetectedTransactions(promise: Promise) {
        try {
            val list = storage.getAllTransactions()
            val array = WritableNativeArray()
            for (item in list) {
                val map = WritableNativeMap().apply {
                    putString("id", item.id)
                    putDouble("amount", item.amount)
                    putString("type", item.type)
                    putString("merchant", item.merchant)
                    putString("suggestedCategory", item.suggestedCategory)
                    putString("suggestedCategoryId", item.suggestedCategoryId)
                    putString("paymentMethod", item.paymentMethod)
                    putString("paymentProvider", item.paymentProvider)
                    putString("sourcePackage", item.sourcePackage)
                    item.upiReference?.let { putString("upiReference", it) }
                    putDouble("transactionTimestamp", item.transactionTimestamp.toDouble())
                    putDouble("createdAt", item.createdAt.toDouble())
                    putBoolean("isAutomaticallyDetected", item.isAutomaticallyDetected)
                    putDouble("detectionConfidence", item.detectionConfidence)
                    putString("rawReferenceHash", item.rawReferenceHash)
                    putString("status", item.status)
                    item.rawTitleSnippet?.let { putString("rawTitleSnippet", it) }
                    item.rawTextSnippet?.let { putString("rawTextSnippet", it) }
                    item.notes?.let { putString("notes", it) }
                }
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun confirmDetectedTransaction(id: String, promise: Promise) {
        val success = storage.updateTransactionStatus(id, "CONFIRMED")
        if (success) {
            emitEvent("UPI_TRANSACTION_CONFIRMED", id)
        }
        promise.resolve(success)
    }

    @ReactMethod
    fun rejectDetectedTransaction(id: String, promise: Promise) {
        val success = storage.updateTransactionStatus(id, "REJECTED")
        if (success) {
            emitEvent("UPI_TRANSACTION_REJECTED", id)
        }
        promise.resolve(success)
    }

    @ReactMethod
    fun clearDetectedTransactions(promise: Promise) {
        storage.clearAll()
        promise.resolve(true)
    }

    @ReactMethod
    fun simulateTestNotification(
        packageName: String,
        title: String,
        text: String,
        promise: Promise
    ) {
        try {
            val parser = ParserRegistry.findParser(packageName, title, text)
            if (parser == null) {
                promise.reject("UNSUPPORTED_APP", "No parser available for package: $packageName")
                return
            }

            val timestamp = System.currentTimeMillis()
            val detected = parser.parse(packageName, title, text, timestamp)
            if (detected == null) {
                promise.reject("PARSE_ERROR", "Notification did not match a valid completed payment")
                return
            }

            // Check duplicate
            if (duplicateDetector.isDuplicate(packageName, detected.amount, detected.merchant, timestamp, detected.upiReference)) {
                promise.reject("DUPLICATE", "Transaction was identified as a duplicate")
                return
            }

            duplicateDetector.markAsProcessed(packageName, detected.amount, detected.merchant, timestamp, detected.upiReference)
            storage.saveTransaction(detected)

            notifyTransactionDetected(detected)

            val map = WritableNativeMap().apply {
                putString("id", detected.id)
                putDouble("amount", detected.amount)
                putString("merchant", detected.merchant)
                putString("suggestedCategory", detected.suggestedCategory)
                putString("paymentProvider", detected.paymentProvider)
                putDouble("detectionConfidence", detected.detectionConfidence)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("SIMULATION_ERROR", e.message)
        }
    }

    private fun emitEvent(eventName: String, data: Any?) {
        try {
            if (reactApplicationContext.hasActiveReactInstance()) {
                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, data)
            }
        } catch (e: Exception) {
            // Ignore if React instance is not ready
        }
    }
}
