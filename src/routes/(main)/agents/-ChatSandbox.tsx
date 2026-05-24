import {
    chatWithAgent,
    type CcProduct,
    type NextStep,
    type SuggestionItem,
} from "@/api/agents";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { BotMessageSquare, MessageSquare, Smartphone } from "lucide-react";
import { ChatSandboxWhatsApp } from "./-ChatSandboxWhatsApp";
import { MarkdownMessage } from "./-MarkdownMessage";

// ---------- Types ----------

interface Message {
    role: "user" | "assistant";
    text: string;
}

interface SuggestionGroup {
    service_category: string;
    list: SuggestionItem[];
}

// ---------- Constants ----------

const initialSuggestions = [
    {
        service_category: "Account Inquiry",
        list: [
            {
                label: "Ringkasan saldo semua rekening",
                target_id: 2202,
                target_intent: "ACCOUNT_INQUIRY",
                faq_code: "AQ_ALL_ACCOUNTS_SUMMARY",
                subtype: "account_summary",
                product_code: "ACCOUNT",
                product_name: "Rekening",
            },
            {
                label: "Limit tersedia kartu kredit",
                target_id: 2205,
                target_intent: "ACCOUNT_INQUIRY",
                faq_code: "AQ_CC_AVAILABLE_LIMIT",
                subtype: "available_credit_limit",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            {
                label: "Cek saldo rekening saat ini",
                target_id: 2201,
                target_intent: "ACCOUNT_INQUIRY",
                faq_code: "AQ_CURRENT_BALANCE",
                subtype: "balance_check",
                product_code: "ACCOUNT",
                product_name: "Rekening",
            },
            // {
            //   "label": "Cek status kartu",
            //   "target_id": 2208,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_CARD_STATUS",
            //   "subtype": "card_status",
            //   "product_code": "CARD",
            //   "product_name": "Kartu"
            // },
            // {
            //   "label": "Status saldo minimum rekening",
            //   "target_id": 2203,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_MIN_BALANCE_STATUS",
            //   "subtype": "minimum_balance_status",
            //   "product_code": "ACCOUNT",
            //   "product_name": "Rekening"
            // },
            // {
            //   "label": "Outstanding balance kartu kredit",
            //   "target_id": 2204,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_CC_OUTSTANDING_BALANCE",
            //   "subtype": "outstanding_balance",
            //   "product_code": "CC_ALL",
            //   "product_name": "Kartu Kredit"
            // },
            // {
            //   "label": "Due date dan minimum payment kartu kredit",
            //   "target_id": 2206,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_CC_DUE_DATE",
            //   "subtype": "payment_due_date",
            //   "product_code": "CC_ALL",
            //   "product_name": "Kartu Kredit"
            // },
            // {
            //   "label": "Cek transaksi pending",
            //   "target_id": 2211,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_PENDING_TRANSACTIONS",
            //   "subtype": "pending_transactions",
            //   "product_code": "ACCOUNT",
            //   "product_name": "Rekening"
            // },
            // {
            //   "label": "Cek poin reward kartu kredit",
            //   "target_id": 2207,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_CC_REWARD_POINTS",
            //   "subtype": "reward_points",
            //   "product_code": "CC_ALL",
            //   "product_name": "Kartu Kredit"
            // },
            // {
            //   "label": "Cek transaksi berdasarkan rentang tanggal",
            //   "target_id": 2210,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_TXN_BY_DATE_RANGE",
            //   "subtype": "transaction_by_date_range",
            //   "product_code": "ACCOUNT",
            //   "product_name": "Rekening"
            // },
            // {
            //   "label": "Cek transaksi terakhir",
            //   "target_id": 2209,
            //   "target_intent": "ACCOUNT_INQUIRY",
            //   "faq_code": "AQ_LAST_N_TRANSACTIONS",
            //   "subtype": "transaction_history",
            //   "product_code": "ACCOUNT",
            //   "product_name": "Rekening"
            // }
        ],
    },
    // {
    //   "service_category": "Account Management",
    //   "list": [
    //     {
    //       "label": "Cara tutup rekening",
    //       "target_id": 2133,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_ACCOUNT_CLOSURE",
    //       "subtype": "general_info",
    //       "product_code": "ACCOUNT",
    //       "product_name": "Rekening"
    //     }
    //   ]
    // },
    {
        service_category: "Action",
        list: [
            {
                label: "Mulai pembukaan rekening tabungan",
                target_id: 2405,
                target_intent: "ACTION",
                faq_code: "AC_APPLY_SAVINGS",
                subtype: "apply_product",
                product_code: "SAV_REG",
                product_name: "Tabungan Reguler",
            },
            {
                label: "Mulai pengajuan kartu kredit",
                target_id: 2406,
                target_intent: "ACTION",
                faq_code: "AC_APPLY_CREDIT_CARD",
                subtype: "apply_product",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            {
                label: "Mulai pengajuan KTA",
                target_id: 2407,
                target_intent: "ACTION",
                faq_code: "AC_APPLY_KTA",
                subtype: "apply_product",
                product_code: "KTA",
                product_name: "KTA",
            },
            // {
            //   "label": "Mulai pengajuan KPR",
            //   "target_id": 2408,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_APPLY_KPR",
            //   "subtype": "apply_product",
            //   "product_code": "KPR",
            //   "product_name": "KPR"
            // },
            // {
            //   "label": "Pembayaran tagihan",
            //   "target_id": 2411,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_BILL_PAYMENT",
            //   "subtype": "bill_payment",
            //   "product_code": "PAYMENT",
            //   "product_name": "Pembayaran"
            // },
            // {
            //   "label": "Blokir kartu sekarang",
            //   "target_id": 2401,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_BLOCK_CARD",
            //   "subtype": "block_card",
            //   "product_code": "CARD",
            //   "product_name": "Kartu"
            // },
            // {
            //   "label": "Pembayaran tagihan kartu kredit",
            //   "target_id": 2412,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_CC_PAYMENT",
            //   "subtype": "credit_card_payment",
            //   "product_code": "CC_ALL",
            //   "product_name": "Kartu Kredit"
            // },
            // {
            //   "label": "Top up e-wallet",
            //   "target_id": 2413,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_EWALLET_TOPUP",
            //   "subtype": "ewallet_topup",
            //   "product_code": "EWALLET",
            //   "product_name": "E-Wallet"
            // },
            // {
            //   "label": "Transfer antarbank",
            //   "target_id": 2409,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_INTERBANK_TRANSFER",
            //   "subtype": "interbank_transfer",
            //   "product_code": "TRANSFER",
            //   "product_name": "Transfer"
            // },
            // {
            //   "label": "Transfer internal",
            //   "target_id": 2410,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_INTRABANK_TRANSFER",
            //   "subtype": "intrabank_transfer",
            //   "product_code": "TRANSFER",
            //   "product_name": "Transfer"
            // },
            // {
            //   "label": "Buka sub-account tabungan",
            //   "target_id": 2414,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_OPEN_SUB_ACCOUNT",
            //   "subtype": "open_sub_account",
            //   "product_code": "SAV_REG",
            //   "product_name": "Tabungan"
            // },
            // {
            //   "label": "Reset atau ganti PIN kartu",
            //   "target_id": 2403,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_PIN_RESET",
            //   "subtype": "pin_reset",
            //   "product_code": "CARD",
            //   "product_name": "Kartu"
            // },
            // {
            //   "label": "Kirim e-statement",
            //   "target_id": 2404,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_REQUEST_ESTATEMENT",
            //   "subtype": "request_estatement",
            //   "product_code": "ACCOUNT",
            //   "product_name": "Rekening"
            // },
            // {
            //   "label": "Buka blokir kartu",
            //   "target_id": 2402,
            //   "target_intent": "ACTION",
            //   "faq_code": "AC_UNBLOCK_CARD",
            //   "subtype": "unblock_card",
            //   "product_code": "CARD",
            //   "product_name": "Kartu"
            // }
        ],
    },
    // {
    //   "service_category": "Branch & ATM",
    //   "list": [
    //     {
    //       "label": "Informasi cabang dan ATM",
    //       "target_id": 2122,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_BRANCH_ATM_INFO",
    //       "subtype": "branch_hours",
    //       "product_code": "BRANCH_ATM",
    //       "product_name": "Cabang & ATM"
    //     }
    //   ]
    // },
    // {
    //   "service_category": "Cards",
    //   "list": [
    //     {
    //       "label": "Cara aktivasi kartu baru",
    //       "target_id": 2130,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_CARD_ACTIVATION",
    //       "subtype": "general_info",
    //       "product_code": "CARD",
    //       "product_name": "Kartu"
    //     }
    //   ]
    // },
    {
        service_category: "Complaint",
        list: [
            {
                label: "Aplikasi error atau gagal login",
                target_id: 2310,
                target_intent: "COMPLAINT",
                faq_code: "CP_APP_LOGIN_ISSUE",
                subtype: "app_issue",
                product_code: "MBANK",
                product_name: "m-Banking",
            },
            {
                label: "Uang ATM tidak keluar atau jumlah tidak sesuai",
                target_id: 2305,
                target_intent: "COMPLAINT",
                faq_code: "CP_ATM_CASH_ISSUE",
                subtype: "atm_cash_issue",
                product_code: "ATM",
                product_name: "ATM",
            },
            {
                label: "Masalah kartu debit atau kredit",
                target_id: 2306,
                target_intent: "COMPLAINT",
                faq_code: "CP_CARD_ISSUE",
                subtype: "card_issue",
                product_code: "CARD",
                product_name: "Kartu",
            },
            // {
            //   "label": "Transaksi terdebet dua kali",
            //   "target_id": 2303,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_DOUBLE_CHARGE",
            //   "subtype": "double_charge",
            //   "product_code": "CARD",
            //   "product_name": "Kartu"
            // },
            // {
            //   "label": "Transfer gagal tetapi saldo terdebet",
            //   "target_id": 2302,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_FAILED_TRANSFER_DEBITED",
            //   "subtype": "failed_transfer_debited",
            //   "product_code": "TRANSFER",
            //   "product_name": "Transfer"
            // },
            // {
            //   "label": "Kartu hilang atau dicuri",
            //   "target_id": 2307,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_LOST_CARD",
            //   "subtype": "lost_card",
            //   "product_code": "CARD",
            //   "product_name": "Kartu"
            // },
            // {
            //   "label": "Pembayaran berhasil tetapi merchant/biller belum menerima",
            //   "target_id": 2304,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_PAYMENT_NOT_RECEIVED",
            //   "subtype": "payment_not_received",
            //   "product_code": "PAYMENT",
            //   "product_name": "Pembayaran"
            // },
            // {
            //   "label": "OTP masuk padahal tidak ada transaksi atau ada indikasi phishing",
            //   "target_id": 2309,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_PHISHING_OTP",
            //   "subtype": "phishing_scam",
            //   "product_code": "SECURITY",
            //   "product_name": "Fraud"
            // },
            // {
            //   "label": "Keluhan keterlambatan proses atau layanan",
            //   "target_id": 2311,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_SERVICE_DELAY",
            //   "subtype": "service_quality",
            //   "product_code": "SERVICE",
            //   "product_name": "Layanan"
            // },
            // {
            //   "label": "Laporan sengketa transaksi",
            //   "target_id": 2301,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_TRANSACTION_DISPUTE",
            //   "subtype": "transaction_dispute",
            //   "product_code": "TRANSACTION",
            //   "product_name": "Transaksi"
            // },
            // {
            //   "label": "Transaksi tidak dikenal / tidak diotorisasi",
            //   "target_id": 2308,
            //   "target_intent": "COMPLAINT",
            //   "faq_code": "CP_UNAUTHORIZED_TRANSACTION",
            //   "subtype": "unauthorized_transaction",
            //   "product_code": "SECURITY",
            //   "product_name": "Fraud"
            // }
        ],
    },
    {
        service_category: "Credit Card",
        list: [
            {
                label: "Syarat pengajuan kartu kredit",
                target_id: 2110,
                target_intent: "FAQ",
                faq_code: "FAQ_CC_APPLY_REQUIREMENTS",
                subtype: "application_requirements",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            {
                label: "Langkah pengajuan kartu kredit",
                target_id: 2111,
                target_intent: "FAQ",
                faq_code: "FAQ_CC_APPLY_STEPS",
                subtype: "application_steps",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            {
                label: "Penjelasan tagihan kartu kredit",
                target_id: 2113,
                target_intent: "FAQ",
                faq_code: "FAQ_CC_BILLING_EXPLAINER",
                subtype: "general_info",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            // {
            //   "label": "Informasi Kartu Kredit Classic",
            //   "target_id": 2107,
            //   "target_intent": "FAQ",
            //   "faq_code": "FAQ_CC_CLASSIC_INFO",
            //   "subtype": "product_info",
            //   "product_code": "CC_CLASSIC",
            //   "product_name": "Kartu Kredit Classic"
            // },
            // {
            //   "label": "Informasi Kartu Kredit Gold",
            //   "target_id": 2108,
            //   "target_intent": "FAQ",
            //   "faq_code": "FAQ_CC_GOLD_INFO",
            //   "subtype": "product_info",
            //   "product_code": "CC_GOLD",
            //   "product_name": "Kartu Kredit Gold"
            // },
            // {
            //   "label": "Informasi Kartu Kredit Platinum",
            //   "target_id": 2109,
            //   "target_intent": "FAQ",
            //   "faq_code": "FAQ_CC_PLATINUM_INFO",
            //   "subtype": "product_info",
            //   "product_code": "CC_PLAT",
            //   "product_name": "Kartu Kredit Platinum"
            // },
            // {
            //   "label": "Biaya dan tagihan kartu kredit",
            //   "target_id": 2112,
            //   "target_intent": "FAQ",
            //   "faq_code": "FAQ_CC_FEES",
            //   "subtype": "rates_fees",
            //   "product_code": "CC_ALL",
            //   "product_name": "Kartu Kredit"
            // }
        ],
    },
    // {
    //   "service_category": "Deposits",
    //   "list": [
    //     {
    //       "label": "Informasi Deposito Berjangka",
    //       "target_id": 2105,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_DEPOSIT_INFO",
    //       "subtype": "product_info",
    //       "product_code": "DEP_TIME",
    //       "product_name": "Deposito Berjangka"
    //     },
    //     {
    //       "label": "Bunga Deposito Berjangka",
    //       "target_id": 2106,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_DEPOSIT_RATE",
    //       "subtype": "rates_fees",
    //       "product_code": "DEP_TIME",
    //       "product_name": "Deposito Berjangka"
    //     }
    //   ]
    // },
    // {
    //   "service_category": "Digital Banking",
    //   "list": [
    //     {
    //       "label": "Cara daftar dan aktivasi m-Banking",
    //       "target_id": 2120,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_MBANKING_SETUP",
    //       "subtype": "digital_banking_info",
    //       "product_code": "MBANK",
    //       "product_name": "m-Banking"
    //     }
    //   ]
    // },
    {
        service_category: "General Support",
        list: [
            {
                label: "Perbandingan dengan bank lain",
                target_id: 2003,
                target_intent: "OUT_OF_SCOPE",
                faq_code: "OOS_COMPETITOR_COMPARE",
                subtype: "competitor_comparison",
                product_code: "GENERIC",
                product_name: "General",
            },
            {
                label: "Pertanyaan di luar layanan perbankan",
                target_id: 2001,
                target_intent: "OUT_OF_SCOPE",
                faq_code: "OOS_GENERAL",
                subtype: "general_non_banking",
                product_code: "GENERIC",
                product_name: "General",
            },
            {
                label: "Saran investasi pribadi",
                target_id: 2002,
                target_intent: "OUT_OF_SCOPE",
                faq_code: "OOS_INVESTMENT_ADVICE",
                subtype: "investment_advice",
                product_code: "GENERIC",
                product_name: "General",
            },
            // {
            //   "label": "Permintaan tugas non-perbankan",
            //   "target_id": 2005,
            //   "target_intent": "OUT_OF_SCOPE",
            //   "faq_code": "OOS_NON_BANKING_TASK",
            //   "subtype": "non_banking_task",
            //   "product_code": "GENERIC",
            //   "product_name": "General"
            // },
            // {
            //   "label": "Topik pribadi, medis, atau hukum",
            //   "target_id": 2004,
            //   "target_intent": "OUT_OF_SCOPE",
            //   "faq_code": "OOS_PERSONAL_LEGAL_MEDICAL",
            //   "subtype": "personal_legal_medical",
            //   "product_code": "GENERIC",
            //   "product_name": "General"
            // }
        ],
    },
    {
        service_category: "Loans",
        list: [
            {
                label: "Syarat pengajuan KTA",
                target_id: 2115,
                target_intent: "FAQ",
                faq_code: "FAQ_KTA_REQUIREMENTS",
                subtype: "application_requirements",
                product_code: "KTA",
                product_name: "KTA",
            },
            {
                label: "Langkah pengajuan KTA",
                target_id: 2116,
                target_intent: "FAQ",
                faq_code: "FAQ_KTA_APPLY_STEPS",
                subtype: "application_steps",
                product_code: "KTA",
                product_name: "KTA",
            },
            {
                label: "Informasi KTA",
                target_id: 2114,
                target_intent: "FAQ",
                faq_code: "FAQ_KTA_INFO",
                subtype: "product_info",
                product_code: "KTA",
                product_name: "KTA",
            },
        ],
    },
    {
        service_category: "Mortgage",
        list: [
            {
                label: "Syarat pengajuan KPR",
                target_id: 2118,
                target_intent: "FAQ",
                faq_code: "FAQ_KPR_REQUIREMENTS",
                subtype: "application_requirements",
                product_code: "KPR",
                product_name: "KPR",
            },
            {
                label: "Langkah pengajuan KPR",
                target_id: 2119,
                target_intent: "FAQ",
                faq_code: "FAQ_KPR_APPLY_STEPS",
                subtype: "application_steps",
                product_code: "KPR",
                product_name: "KPR",
            },
            {
                label: "Informasi KPR",
                target_id: 2117,
                target_intent: "FAQ",
                faq_code: "FAQ_KPR_INFO",
                subtype: "product_info",
                product_code: "KPR",
                product_name: "KPR",
            },
        ],
    },
    // {
    //   "service_category": "Payments & Transfers",
    //   "list": [
    //     {
    //       "label": "Limit transfer harian",
    //       "target_id": 2129,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_TRANSFER_LIMIT_INFO",
    //       "subtype": "general_info",
    //       "product_code": "TRANSFER",
    //       "product_name": "Transfer"
    //     },
    //     {
    //       "label": "Informasi transfer BI-FAST",
    //       "target_id": 2132,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_BIFAST_INFO",
    //       "subtype": "general_info",
    //       "product_code": "TRANSFER",
    //       "product_name": "BI-FAST"
    //     }
    //   ]
    // },
    // {
    //   "service_category": "Profile Management",
    //   "list": [
    //     {
    //       "label": "Ubah nomor ponsel atau email terdaftar",
    //       "target_id": 2134,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_CONTACT_UPDATE",
    //       "subtype": "general_info",
    //       "product_code": "PROFILE",
    //       "product_name": "Data Kontak"
    //     }
    //   ]
    // },
    {
        service_category: "Promotions",
        list: [
            {
                label: "Promo dining kartu kredit",
                target_id: 2124,
                target_intent: "FAQ",
                faq_code: "FAQ_PROMO_CC_DINING",
                subtype: "promotion_info",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            {
                label: "Promo cicilan 0% kartu kredit",
                target_id: 2125,
                target_intent: "FAQ",
                faq_code: "FAQ_PROMO_INSTALLMENT",
                subtype: "promotion_info",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            {
                label: "Program reward dan poin",
                target_id: 2126,
                target_intent: "FAQ",
                faq_code: "FAQ_REWARD_POINTS_PROGRAM",
                subtype: "promotion_info",
                product_code: "CC_ALL",
                product_name: "Kartu Kredit",
            },
            // {
            //   "label": "Promo pembukaan rekening digital",
            //   "target_id": 2127,
            //   "target_intent": "FAQ",
            //   "faq_code": "FAQ_PROMO_DIGITAL_ONBOARDING",
            //   "subtype": "promotion_info",
            //   "product_code": "SAV_REG",
            //   "product_name": "Tabungan Reguler"
            // }
        ],
    },
    {
        service_category: "Savings",
        list: [
            {
                label: "Syarat pembukaan Tabungan Reguler",
                target_id: 2102,
                target_intent: "FAQ",
                faq_code: "FAQ_SAVINGS_REGULAR_REQUIREMENTS",
                subtype: "application_requirements",
                product_code: "SAV_REG",
                product_name: "Tabungan Reguler",
            },
            {
                label: "Langkah pembukaan Tabungan Reguler",
                target_id: 2103,
                target_intent: "FAQ",
                faq_code: "FAQ_SAVINGS_REGULAR_APPLY_STEPS",
                subtype: "application_steps",
                product_code: "SAV_REG",
                product_name: "Tabungan Reguler",
            },
            {
                label: "Informasi Tabungan Reguler",
                target_id: 2101,
                target_intent: "FAQ",
                faq_code: "FAQ_SAVINGS_REGULAR_INFO",
                subtype: "product_info",
                product_code: "SAV_REG",
                product_name: "Tabungan Reguler",
            },
            // {
            //   "label": "Informasi Tabungan Premium",
            //   "target_id": 2104,
            //   "target_intent": "FAQ",
            //   "faq_code": "FAQ_SAVINGS_PREMIUM_INFO",
            //   "subtype": "product_info",
            //   "product_code": "SAV_PREM",
            //   "product_name": "Tabungan Premium"
            // }
        ],
    },
    // {
    //   "service_category": "Security",
    //   "list": [
    //     {
    //       "label": "Panduan keamanan OTP dan phishing",
    //       "target_id": 2121,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_MBANKING_SECURITY",
    //       "subtype": "security_info",
    //       "product_code": "SECURITY",
    //       "product_name": "Keamanan Digital"
    //     },
    //     {
    //       "label": "Apa yang harus dilakukan jika kartu hilang",
    //       "target_id": 2128,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_LOST_CARD_GUIDANCE",
    //       "subtype": "security_info",
    //       "product_code": "CARD",
    //       "product_name": "Kartu"
    //     }
    //   ]
    // },
    // {
    //   "service_category": "Statements",
    //   "list": [
    //     {
    //       "label": "Akses e-statement rekening dan kartu kredit",
    //       "target_id": 2131,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_ESTATEMENT_INFO",
    //       "subtype": "general_info",
    //       "product_code": "ESTMT",
    //       "product_name": "e-Statement"
    //     }
    //   ]
    // },
    // {
    //   "service_category": "Transactions",
    //   "list": [
    //     {
    //       "label": "Biaya transfer dan transaksi",
    //       "target_id": 2123,
    //       "target_intent": "FAQ",
    //       "faq_code": "FAQ_TRANSFER_FEES",
    //       "subtype": "rates_fees",
    //       "product_code": "TRANSFER",
    //       "product_name": "Transfer"
    //     }
    //   ]
    // }
];

const CC_TITLE: Record<CcProduct["card_type"], string> = {
    classic: "Hasanah Card Classic",
    gold: "Hasanah Card Gold",
    platinum: "Hasanah Card Platinum",
};

const CC_GRADIENT: Record<CcProduct["card_type"], string> = {
    classic: "linear-gradient(135deg, #c8c5bc 0%, #888780 100%)",
    gold: "linear-gradient(135deg, #FAC775 0%, #BA7517 100%)",
    platinum: "linear-gradient(135deg, #c4b5fd 0%, #7C3AED 100%)",
};

const CC_ACCENT: Record<CcProduct["card_type"], string> = {
    classic: "#888780",
    gold: "#BA7517",
    platinum: "#7C3AED",
};

const MAX_ROWS = 8;

// ---------- Sub-components ----------

function InitialSuggestions({
    groups,
    onSelect,
}: {
    groups: SuggestionGroup[];
    onSelect: (item: SuggestionItem) => void;
}) {
    return (
        <div className="shrink-0 border-t bg-background pt-3 pb-1">
            <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                What can I help you with?
            </p>
            <ScrollArea type="scroll" className="w-full">
                <div className="flex min-w-max gap-3 px-4 pb-3">
                    {groups.map((group) => (
                        <div
                            key={group.service_category}
                            className="flex flex-col gap-1.5"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                {group.service_category}
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {group.list.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => onSelect(item)}
                                        className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

function NextStepSuggestions({
    steps,
    onSelect,
}: {
    steps: NextStep[];
    onSelect: (label: string) => void;
}) {
    return (
        <div className="shrink-0 bg-background pt-4">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                <MessageSquare className="size-3.5" />
                <span>Suggested replies</span>
            </div>
            <div className="flex flex-col gap-1.5">
                {steps.map((step) => (
                    <button
                        key={step.label}
                        type="button"
                        onClick={() => onSelect(step.label)}
                        className="w-full text-left rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {step.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function CcProductCards({
    products,
    onSelect,
}: {
    products: CcProduct[];
    onSelect: (label: string) => void;
}) {
    const [openDetail, setOpenDetail] = useState<Record<string, boolean>>({});

    function toggleDetail(cardType: string) {
        setOpenDetail((prev) => ({ ...prev, [cardType]: !prev[cardType] }));
    }

    return (
        <div className="shrink-0 bg-background pt-5">
            <p className="mb-2text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pilih kartu kredit
            </p>
            <ScrollArea type="scroll" className="w-full">
                <div className="flex gap-3 pb-3">
                    {products.map((p) => (
                        <div
                            key={p.card_type}
                            className="w-52 shrink-0 flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
                        >
                            {/* Card art */}
                            <div
                                className="h-20 rounded-lg"
                                style={{ background: CC_GRADIENT[p.card_type] }}
                            />

                            {/* Title */}
                            <p className="text-sm font-medium text-foreground leading-snug">
                                {CC_TITLE[p.card_type]}
                            </p>

                            <div className="h-px bg-border" />

                            {/* Benefits */}
                            <ul className="flex flex-col gap-1.5">
                                {p.benefit.map((b) => (
                                    <li
                                        key={b}
                                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                    >
                                        <svg
                                            className="mt-0.5 size-3.5 shrink-0"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                        >
                                            <circle
                                                cx="7"
                                                cy="7"
                                                r="6.5"
                                                stroke={CC_ACCENT[p.card_type]}
                                                strokeWidth="0.8"
                                            />
                                            <path
                                                d="M4 7l2 2 4-4"
                                                stroke={CC_ACCENT[p.card_type]}
                                                strokeWidth="1.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        {b}
                                    </li>
                                ))}
                            </ul>

                            {/* Pick button */}
                            <button
                                type="button"
                                onClick={() =>
                                    onSelect(
                                        `Saya mau daftar ${CC_TITLE[p.card_type]}`,
                                    )
                                }
                                className="w-full rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                style={
                                    p.card_type === "platinum"
                                        ? {
                                              borderColor: CC_ACCENT.platinum,
                                              color: CC_ACCENT.platinum,
                                          }
                                        : {}
                                }
                            >
                                Pilih{" "}
                                {CC_TITLE[p.card_type].replace(
                                    "Hasanah Card ",
                                    "",
                                )}
                            </button>

                            {/* Detail toggle */}
                            <button
                                type="button"
                                onClick={() => toggleDetail(p.card_type)}
                                className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            >
                                {openDetail[p.card_type]
                                    ? "Sembunyikan ▲"
                                    : "Lihat detail ▼"}
                            </button>

                            {/* Detail rows */}
                            {openDetail[p.card_type] && (
                                <div className="rounded-lg bg-muted/50 px-3 py-2.5 flex flex-col gap-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Limit maks
                                        </span>
                                        <span className="font-medium">
                                            Rp{" "}
                                            {p.limit.max.toLocaleString(
                                                "id-ID",
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Welcome bonus
                                        </span>
                                        <span className="font-medium">
                                            {p.welcome_bonus > 0
                                                ? `Rp ${p.welcome_bonus.toLocaleString("id-ID")}`
                                                : "–"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Lounge bandara
                                        </span>
                                        <span className="font-medium">
                                            {p.free_lounge ? "✓ Gratis" : "–"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

// ---------- ChatDefault ----------

function ChatDefault({
    agentId,
    agentName,
}: {
    agentId: string;
    agentName: string;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [showInitialSuggestions, setShowInitialSuggestions] = useState(
        agentName.toLowerCase().includes("customer care"),
    );
    const [nextSteps, setNextSteps] = useState<NextStep[] | null>(null);
    const [ccProducts, setCcProducts] = useState<CcProduct[] | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sessionId = useRef(new Date().toLocaleTimeString()).current;

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const maxHeight = lineHeight * MAX_ROWS + 16;
        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, []);

    const mutation = useMutation({
        mutationFn: ({
            text,
            suggestion,
        }: {
            text: string;
            suggestion?: SuggestionItem;
        }) => chatWithAgent(agentId, text, sessionId, suggestion),
        onSuccess: (response) => {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: response.reply },
            ]);
            setNextSteps(response.next_step ?? null);
            setCcProducts(response.product ?? null);
        },
        onError: () => {
            // errors shown inline
        },
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, nextSteps, ccProducts]);

    function sendText(text: string, suggestion?: SuggestionItem) {
        if (!text.trim() || mutation.isPending) return;
        setShowInitialSuggestions(false);
        setNextSteps(null);
        setCcProducts(null);
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text }]);
        mutation.mutate({ text, suggestion });
        requestAnimationFrame(() => resizeTextarea());
    }

    function handleSend() {
        sendText(input);
    }
    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const lastIsAssistant =
        messages.length > 0 &&
        messages[messages.length - 1].role === "assistant";
    const showNextSteps =
        lastIsAssistant &&
        !mutation.isPending &&
        nextSteps &&
        nextSteps.length > 0;
    const showCcProducts =
        lastIsAssistant &&
        !mutation.isPending &&
        ccProducts &&
        ccProducts.length > 0;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <ScrollArea className="min-h-0 flex-1 px-4 py-4 w-full max-w-3xl mx-auto">
                {messages.length === 0 && !showInitialSuggestions && (
                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Send a message to start the conversation.
                    </p>
                )}

                <div className="flex flex-col gap-4">
                    {messages.map((msg, i) =>
                        msg.role === "user" ? (
                            <div key={i} className="flex justify-end">
                                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                                    {msg.text}
                                </div>
                            </div>
                        ) : (
                            <div key={i} className="flex justify-start">
                                <MarkdownMessage
                                    text={msg.text}
                                    className="max-w-[75%] text-sm leading-relaxed"
                                />
                            </div>
                        ),
                    )}
                    {mutation.isPending && (
                        <div className="flex justify-start">
                            <p className="text-sm text-muted-foreground animate-pulse">
                                Thinking...
                            </p>
                        </div>
                    )}
                    {mutation.isError && (
                        <div className="flex justify-start">
                            <p className="text-sm text-destructive">
                                Something went wrong. Please try again.
                            </p>
                        </div>
                    )}
                </div>
                {/* CC product cards — shown above next_step suggestions */}
                {showCcProducts && (
                    <CcProductCards
                        products={ccProducts!}
                        onSelect={sendText}
                    />
                )}

                {/* Next-step suggestions */}
                {showNextSteps && (
                    <NextStepSuggestions
                        steps={nextSteps!}
                        onSelect={sendText}
                    />
                )}

                <div ref={bottomRef} />
            </ScrollArea>

            {/* Initial grouped suggestions (only before first message) */}
            {showInitialSuggestions && messages.length === 0 && (
                <InitialSuggestions
                    groups={initialSuggestions}
                    onSelect={(item) => sendText(item.label, item)}
                />
            )}

            <div className="shrink-0 pt-3 pb-8 mx-5">
                <div className="flex items-end gap-2 w-full max-w-3xl mx-auto">
                    <textarea
                        ref={textareaRef}
                        className="h-auto flex-1 resize-none rounded-full border border-input bg-transparent px-5 py-5 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                        rows={1}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            resizeTextarea();
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={mutation.isPending}
                    />
                    <Button
                        hidden
                        onClick={handleSend}
                        disabled={!input.trim() || mutation.isPending}
                    />
                </div>
            </div>
        </div>
    );
}

// ---------- ChatSanbox (exported, owns view toggle) ----------

type ViewMode = "chatbot" | "whatsapp";

export function ChatSanbox({
    agentId,
    agentName,
}: {
    agentId: string;
    agentName: string;
}) {
    const [view, setView] = useState<ViewMode>("chatbot");

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Toggle bar */}
            <div className="shrink-0 flex items-center justify-center gap-1.5 border-b px-4 py-2 bg-background">
                <button
                    type="button"
                    onClick={() => setView("chatbot")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        view === "chatbot"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <BotMessageSquare className="size-4" />
                    Chatbot
                </button>
                <button
                    type="button"
                    onClick={() => setView("whatsapp")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        view === "whatsapp"
                            ? "bg-[#075e54] text-white"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <Smartphone className="size-4" />
                    WhatsApp
                </button>
            </div>

            {/* View content */}
            <div className="flex-1 overflow-hidden">
                {view === "chatbot" ? (
                    <ChatDefault agentId={agentId} agentName={agentName} />
                ) : (
                    <ChatSandboxWhatsApp agentId={agentId} />
                )}
            </div>
        </div>
    );
}
