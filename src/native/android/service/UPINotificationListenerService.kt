package com.pocketwise.upidetector.service

import android.app.Notification
import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.pocketwise.upidetector.dedup.DuplicateDetector
import com.pocketwise.upidetector.model.DetectedTransaction
import com.pocketwise.upidetector.module.UPITransactionDetectionModule
import com.pocketwise.upidetector.parser.ParserRegistry
import com.pocketwise.upidetector.storage.DetectedTransactionStorage

class UPINotificationListenerService : NotificationListenerService() {

    private lateinit var storage: DetectedTransactionStorage
    private lateinit var duplicateDetector: DuplicateDetector

    companion object {
        private const val TAG = "PocketWiseUPIService"
        const val ACTION_UPI_NOTIFICATION_DETECTED = "com.pocketwise.ACTION_UPI_NOTIFICATION_DETECTED"
        const val EXTRA_TRANSACTION_JSON = "transaction_json"
    }

    override fun onCreate() {
        super.onCreate()
        storage = DetectedTransactionStorage(applicationContext)
        duplicateDetector = DuplicateDetector(applicationContext)
        Log.i(TAG, "UPINotificationListenerService created and active")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        try {
            processNotification(sbn)
        } catch (e: Throwable) {
            // Never crash the host application due to unexpected notification format
            Log.e(TAG, "Safe catch: error processing notification: ${e.message}")
        }
    }

    private fun processNotification(sbn: StatusBarNotification) {
        // 1. Check if detection is enabled by the user
        if (!storage.isDetectionEnabled) {
            return
        }

        val packageName = sbn.packageName ?: return
        val extras = sbn.notification.extras ?: return

        // 2. Extract notification text components
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""

        val fullText = if (bigText.isNotBlank()) bigText else text
        val combinedContent = "$title $fullText $subText".trim()

        if (combinedContent.isBlank()) return

        // 3. Supported app check & parser resolution
        val parser = ParserRegistry.findParser(packageName, title, fullText) ?: return

        // 4. Notification parsing
        val postTime = if (sbn.postTime > 0) sbn.postTime else System.currentTimeMillis()
        val detected = parser.parse(packageName, title, fullText, postTime) ?: return

        // Check refund preference
        if (detected.type == "income" && !storage.isRefundsEnabled) {
            return
        }

        // 5. Duplicate detection check
        if (duplicateDetector.isDuplicate(
                packageName = packageName,
                amount = detected.amount,
                merchant = detected.merchant,
                timestamp = detected.transactionTimestamp,
                upiReference = detected.upiReference
            )
        ) {
            Log.d(TAG, "Duplicate UPI notification detected and ignored: ${detected.merchant} ${detected.amount}")
            return
        }

        // 6. Mark as processed in deduplication cache
        duplicateDetector.markAsProcessed(
            packageName = packageName,
            amount = detected.amount,
            merchant = detected.merchant,
            timestamp = detected.transactionTimestamp,
            upiReference = detected.upiReference
        )

        // 7. Save to persistent storage
        storage.saveTransaction(detected)

        // 8. Privacy-compliant logging (never logs OTP or raw payloads)
        Log.i(
            TAG,
            "Detected UPI payment: amount=₹${detected.amount}, merchant=${detected.merchant}, provider=${detected.paymentProvider}, confidence=${detected.detectionConfidence}"
        )

        // 9. Dispatch to React Native module / active listeners
        UPITransactionDetectionModule.notifyTransactionDetected(detected)

        // Also broadcast for background receiver if needed
        val intent = Intent(ACTION_UPI_NOTIFICATION_DETECTED).apply {
            setPackage(applicationContext.packageName)
            putExtra(EXTRA_TRANSACTION_JSON, detected.toJsonObject().toString())
        }
        applicationContext.sendBroadcast(intent)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // No action needed on notification dismissal
    }
}
