package com.pocketwise.upidetector.parser

data class PaymentAppConfig(
    val packageName: String,
    val displayName: String,
    val parser: NotificationParser,
    val isEnabled: Boolean = true
)

object ParserRegistry {

    private val googlePayParser = GooglePayParser()
    private val phonePeParser = PhonePeParser()
    private val paytmParser = PaytmParser()
    private val bhimParser = BHIMParser()
    private val amazonPayParser = AmazonPayParser()
    private val credParser = CredParser()
    private val genericBankUPIParser = GenericBankUPIParser()

    private val APP_CONFIGS = listOf(
        PaymentAppConfig(
            packageName = "com.google.android.apps.nbu.paisa.user",
            displayName = "Google Pay",
            parser = googlePayParser
        ),
        PaymentAppConfig(
            packageName = "com.phonepe.app",
            displayName = "PhonePe",
            parser = phonePeParser
        ),
        PaymentAppConfig(
            packageName = "net.one97.paytm",
            displayName = "Paytm",
            parser = paytmParser
        ),
        PaymentAppConfig(
            packageName = "in.org.npci.upiapp",
            displayName = "BHIM UPI",
            parser = bhimParser
        ),
        PaymentAppConfig(
            packageName = "in.amazon.mShop.android.shopping",
            displayName = "Amazon Pay (India)",
            parser = amazonPayParser
        ),
        PaymentAppConfig(
            packageName = "com.amazon.mShop.android.shopping",
            displayName = "Amazon Pay",
            parser = amazonPayParser
        ),
        PaymentAppConfig(
            packageName = "com.dreamplug.androidapp",
            displayName = "CRED",
            parser = credParser
        ),
        PaymentAppConfig(
            packageName = "com.snapwork.hdfc",
            displayName = "HDFC Bank",
            parser = genericBankUPIParser
        ),
        PaymentAppConfig(
            packageName = "com.sbi.lotusintouch",
            displayName = "SBI YONO",
            parser = genericBankUPIParser
        ),
        PaymentAppConfig(
            packageName = "com.csam.icici.bank.imobile",
            displayName = "ICICI iMobile",
            parser = genericBankUPIParser
        ),
        PaymentAppConfig(
            packageName = "com.axis.mobile",
            displayName = "Axis Mobile",
            parser = genericBankUPIParser
        ),
        PaymentAppConfig(
            packageName = "com.kotak.mb",
            displayName = "Kotak Bank",
            parser = genericBankUPIParser
        ),
        PaymentAppConfig(
            packageName = "com.samsung.android.spay",
            displayName = "Samsung Wallet",
            parser = genericBankUPIParser
        )
    )

    fun getAllConfigs(): List<PaymentAppConfig> = APP_CONFIGS

    fun findParser(packageName: String, title: String, text: String): NotificationParser? {
        val config = APP_CONFIGS.firstOrNull { it.packageName == packageName && it.isEnabled }
        if (config != null) {
            return config.parser
        }

        // Check if generic bank parser can handle it
        if (genericBankUPIParser.canParseGeneric(packageName, title, text)) {
            return genericBankUPIParser
        }

        return null
    }
}
