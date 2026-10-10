// ============================================
// CYBER FIRST AID - ADVANCED JAVASCRIPT
// ============================================

"use strict";

// --------------------------------------------
// DOM ELEMENTS
// --------------------------------------------

const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");
const urlResult = document.getElementById("urlResult");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messageResult = document.getElementById("messageResult");

const totalScansElement = document.getElementById("totalScans");
const urlScansElement = document.getElementById("urlScans");
const messageScansElement = document.getElementById("messageScans");
const flaggedScansElement = document.getElementById("flaggedScans");

const historyBody = document.getElementById("historyBody");
const downloadReportButton = document.getElementById("downloadReport");
const clearHistoryButton = document.getElementById("clearHistory");

const languageSelect = document.getElementById("languageSelect");

const emergencySelect = document.getElementById("emergencySelect");
const emergencyButton = document.getElementById("emergencyButton");
const emergencyResult = document.getElementById("emergencyResult");

// --------------------------------------------
// BROWSER STORAGE
// --------------------------------------------

const STORAGE_KEY = "cyberFirstAidHistory";

let scanHistory = [];

try {
    const savedHistory = localStorage.getItem(STORAGE_KEY);

    if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory)) {
            scanHistory = parsedHistory.filter((item) =>
                item &&
                typeof item === "object" &&
                typeof item.type === "string" &&
                typeof item.result === "string" &&
                typeof item.time === "string"
            ).slice(0, 100);
        }
    }
} catch (error) {
    console.warn("Could not read saved scan history.", error);
}

// --------------------------------------------
// DISPLAY RESULTS SAFELY
// --------------------------------------------

function displayResult(element, title, message, level, tips = []) {
    if (!element) {
        return;
    }

    element.replaceChildren();
    element.className = `result show ${level}`;

    const heading = document.createElement("h4");
    heading.textContent = title;
    element.appendChild(heading);

    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    element.appendChild(paragraph);

    if (tips.length > 0) {
        const list = document.createElement("ul");

        tips.forEach((tip) => {
            const item = document.createElement("li");
            item.textContent = tip;
            list.appendChild(item);
        });

        element.appendChild(list);
    }
}

// --------------------------------------------
// SAVE SCAN HISTORY
// --------------------------------------------

function saveHistory() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(scanHistory)
        );

        return true;
    } catch (error) {
        console.warn("Could not save scan history.", error);

        return false;
    }
}

function recordScan(type, item, result) {
    const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: new Date().toISOString(),
        type: type,
        item: String(item).slice(0, 250),
        result: result.title,
        level: result.level
    };

    scanHistory.unshift(entry);

    // Keep the latest 100 records.
    scanHistory = scanHistory.slice(0, 100);

    saveHistory();
    updateDashboard();
    renderHistory();
}

// --------------------------------------------
// SECURITY DASHBOARD
// --------------------------------------------

function updateDashboard() {
    const total = scanHistory.length;

    const urlCount = scanHistory.filter(
        (entry) => entry.type === "URL"
    ).length;

    const messageCount = scanHistory.filter(
        (entry) => entry.type === "Message"
    ).length;

    const flaggedCount = scanHistory.filter(
        (entry) => entry.level === "warning" ||
                   entry.level === "danger"
    ).length;

    if (totalScansElement) {
        totalScansElement.textContent = total;
    }

    if (urlScansElement) {
        urlScansElement.textContent = urlCount;
    }

    if (messageScansElement) {
        messageScansElement.textContent = messageCount;
    }

    if (flaggedScansElement) {
        flaggedScansElement.textContent = flaggedCount;
    }
}

// --------------------------------------------
// RENDER SCAN HISTORY
// --------------------------------------------

function renderHistory() {
    if (!historyBody) {
        return;
    }

    historyBody.replaceChildren();

    if (scanHistory.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "No scans performed yet.";

        row.appendChild(cell);
        historyBody.appendChild(row);

        return;
    }

    scanHistory.slice(0, 20).forEach((entry) => {
        const row = document.createElement("tr");

        const timeCell = document.createElement("td");
        const typeCell = document.createElement("td");
        const itemCell = document.createElement("td");
        const resultCell = document.createElement("td");

        const date = new Date(entry.time);

        timeCell.textContent = Number.isNaN(date.getTime())
            ? "Unknown"
            : date.toLocaleString();

        typeCell.textContent = entry.type;
        itemCell.textContent = entry.item;
        resultCell.textContent = entry.result;

        row.append(
            timeCell,
            typeCell,
            itemCell,
            resultCell
        );

        historyBody.appendChild(row);
    });
}

// --------------------------------------------
// URL SCANNER
// --------------------------------------------

function scanURL(value) {
    const input = value.trim();

    if (!input) {
        return {
            level: "warning",
            title: "URL Required",
            message: "Please enter a website address.",
            tips: []
        };
    }

    let parsedURL;

    try {
        const normalized = /^https?:\/\//i.test(input)
            ? input
            : `https://${input}`;

        parsedURL = new URL(normalized);
    } catch {
        return {
            level: "danger",
            title: "Invalid URL",
            message: "The address could not be parsed as a valid HTTP or HTTPS URL.",
            tips: [
                "Check the spelling of the address.",
                "Do not open unexpected links from unknown senders."
            ]
        };
    }

    if (!["http:", "https:"].includes(parsedURL.protocol)) {
        return {
            level: "danger",
            title: "Unsupported URL Protocol",
            message: "Only HTTP and HTTPS website addresses are accepted.",
            tips: [
                "Enter a normal website address.",
                "Avoid opening unknown files or links."
            ]
        };
    }

    const hostname = parsedURL.hostname.toLowerCase();
    const fullURL = parsedURL.href.toLowerCase();
    const warnings = [];

    if (parsedURL.username || parsedURL.password) {
        warnings.push(
            "The URL contains embedded username or password information."
        );
    }

    if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
        warnings.push(
            "The domain contains encoded international characters that may imitate another domain."
        );
    }

    const ipv4Pattern =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipv4Pattern.test(hostname)) {
        warnings.push(
            "The website uses an IP address instead of a typical domain name."
        );
    }

    if (hostname.split(".").length > 4) {
        warnings.push(
            "The domain contains an unusually large number of subdomain levels."
        );
    }

    if (parsedURL.href.includes("@")) {
        warnings.push(
            "The URL contains an @ symbol that may make its destination confusing."
        );
    }

    if (parsedURL.protocol === "http:") {
        warnings.push(
            "The connection uses HTTP instead of HTTPS."
        );
    }

    const suspiciousWords = [
        "verify",
        "secure",
        "account",
        "password",
        "wallet",
        "claim",
        "prize",
        "free",
        "signin",
        "login"
    ];

    const matchedWords = suspiciousWords.filter((word) =>
        hostname.split(/[.-]/).includes(word)
    );

    if (matchedWords.length > 0) {
        warnings.push(
            `The domain contains potentially misleading terms: ${matchedWords.join(", ")}.`
        );
    }

    if (fullURL.length > 180) {
        warnings.push(
            "The URL is unusually long."
        );
    }

    if (warnings.length >= 3) {
        return {
            level: "danger",
            title: "High-Risk Indicators Found",
            message: "Several suspicious characteristics were detected. Avoid visiting the website until you verify its destination independently.",
            tips: [
                ...warnings,
                "Do not enter passwords, OTPs, or banking information.",
                "Check the official domain independently.",
                "This prototype does not check live threat-intelligence databases."
            ]
        };
    }

    if (warnings.length > 0) {
        return {
            level: "warning",
            title: "Caution: Review This URL",
            message: "Some characteristics deserve attention. They do not automatically prove that the website is malicious.",
            tips: [
                ...warnings,
                "Verify the exact domain before entering personal information."
            ]
        };
    }

    return {
        level: "safe",
        title: "No Obvious Warning Signs",
        message: "The basic scanner did not detect its selected warning patterns. This does not guarantee that the website is safe.",
        tips: [
            "Check the spelling of the domain.",
            "Use official websites for banking and important accounts.",
            "Never share OTPs or passwords."
        ]
    };
}

// --------------------------------------------
// SCAM MESSAGE CHECKER
// --------------------------------------------

function scanMessage(value) {
    const message = value.trim();

    if (!message) {
        return {
            level: "warning",
            title: "Message Required",
            message: "Please enter a message to check.",
            tips: []
        };
    }

    const checks = [
        {
            pattern: /\b(otp|one[- ]time password|verification code|banking pin)\b/i,
            warning: "The message mentions an OTP, verification code, or banking PIN."
        },
        {
            pattern: /\b(password|passcode|login credentials)\b/i,
            warning: "The message mentions passwords or login credentials."
        },
        {
            pattern: /\b(account|bank account|card)\b.{0,70}\b(blocked|suspended|closed|locked|disabled)\b/i,
            warning: "The message may be threatening account suspension."
        },
        {
            pattern: /\b(urgent|immediately|act now|last chance|right now)\b/i,
            warning: "The message uses urgency or pressure tactics."
        },
        {
            pattern: /\b(won|winner|prize|lottery|reward|claim your)\b/i,
            warning: "The message may use a prize or reward lure."
        },
        {
            pattern: /\b(send|transfer|pay|deposit)\b.{0,60}\b(money|cash|rupees|rs\.?|inr|payment)\b/i,
            warning: "The message may be requesting a money transfer."
        },
        {
            pattern: /\b(verify|restore|unlock|confirm)\b.{0,60}\b(account|identity|access|details)\b/i,
            warning: "The message asks you to verify or restore access."
        },
        {
            pattern: /\b(anydesk|teamviewer|remote access|screen sharing app)\b/i,
            warning: "The message mentions remote-access tools."
        },
        {
            pattern: /https?:\/\/|www\./i,
            warning: "The message contains a web link. Verify it independently."
        },
        {
            pattern: /\b(gift card|crypto|cryptocurrency|guaranteed returns)\b/i,
            warning: "The message mentions payment methods or offers sometimes used in scams."
        }
    ];

    const warnings = checks
        .filter((check) => check.pattern.test(message))
        .map((check) => check.warning);

    if (warnings.length >= 3) {
        return {
            level: "danger",
            title: "High-Risk Scam Indicators",
            message: "This message contains several common scam warning signs. Do not follow its instructions until you verify the sender independently.",
            tips: [
                ...warnings,
                "Never share OTPs, passwords, or banking PINs.",
                "Contact the organisation through its official website or phone number.",
                "Do not click suspicious links or send money."
            ]
        };
    }

    if (warnings.length > 0) {
        return {
            level: "warning",
            title: "Potential Scam Warning",
            message: "One or more warning signs were detected. Review the message carefully before acting.",
            tips: [
                ...warnings,
                "Verify the sender using a trusted, independent channel."
            ]
        };
    }

    return {
        level: "safe",
        title: "No Common Warning Patterns Detected",
        message: "The checker did not detect its selected patterns. This does not prove the message is genuine.",
        tips: [
            "Check the sender's identity.",
            "Be cautious of unexpected requests for money.",
            "Verify important claims using official channels."
        ]
    };
}

// --------------------------------------------
// CONNECT URL SCANNER
// --------------------------------------------

if (urlForm && urlInput && urlResult) {
    urlForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const result = scanURL(urlInput.value);

        displayResult(
            urlResult,
            result.title,
            result.message,
            result.level,
            result.tips
        );

        if (urlInput.value.trim()) {
            recordScan(
                "URL",
                urlInput.value.trim(),
                result
            );
        }
    });
}

// --------------------------------------------
// CONNECT MESSAGE CHECKER
// --------------------------------------------

if (messageForm && messageInput && messageResult) {
    messageForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const result = scanMessage(messageInput.value);

        displayResult(
            messageResult,
            result.title,
            result.message,
            result.level,
            result.tips
        );

        if (messageInput.value.trim()) {
            recordScan(
                "Message",
                messageInput.value.trim(),
                result
            );
        }
    });
}

// --------------------------------------------
// MULTILINGUAL SAFETY TIPS
// --------------------------------------------

const translations = {
    en: {
        passwordTitle: "Protect Your Passwords",
        passwordText: "Use strong, unique passwords and enable multifactor authentication.",
        linkTitle: "Verify Every Link",
        linkText: "Check the domain carefully before opening a link or entering personal information.",
        otpTitle: "Keep OTPs Private",
        otpText: "Never share OTPs, banking PINs, or passwords with callers or messages."
    },

    kn: {
        passwordTitle: "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ರಕ್ಷಿಸಿ",
        passwordText: "ಬಲವಾದ, ವಿಭಿನ್ನ ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ಬಳಸಿ ಮತ್ತು ಬಹುಹಂತದ ದೃಢೀಕರಣವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.",
        linkTitle: "ಪ್ರತಿ ಲಿಂಕ್ ಪರಿಶೀಲಿಸಿ",
        linkText: "ಲಿಂಕ್ ತೆರೆಯುವ ಮೊದಲು ಅಥವಾ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ನಮೂದಿಸುವ ಮೊದಲು ಡೊಮೇನ್ ಪರಿಶೀಲಿಸಿ.",
        otpTitle: "OTP ಅನ್ನು ಖಾಸಗಿಯಾಗಿಡಿ",
        otpText: "OTP, ಬ್ಯಾಂಕಿಂಗ್ PIN ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ."
    },

    hi: {
        passwordTitle: "अपने पासवर्ड सुरक्षित रखें",
        passwordText: "मजबूत और अलग-अलग पासवर्ड इस्तेमाल करें और मल्टीफैक्टर प्रमाणीकरण चालू करें।",
        linkTitle: "हर लिंक जाँचें",
        linkText: "लिंक खोलने या व्यक्तिगत जानकारी दर्ज करने से पहले वेबसाइट का डोमेन जाँचें।",
        otpTitle: "OTP गोपनीय रखें",
        otpText: "अपना OTP, बैंकिंग PIN या पासवर्ड किसी के साथ साझा न करें।"
    },

    ta: {
        passwordTitle: "கடவுச்சொற்களைப் பாதுகாக்கவும்",
        passwordText: "வலுவான, தனித்துவமான கடவுச்சொற்களைப் பயன்படுத்தி பலகாரணி அங்கீகாரத்தை இயக்கவும்.",
        linkTitle: "ஒவ்வொரு இணைப்பையும் சரிபார்க்கவும்",
        linkText: "இணைப்பைத் திறப்பதற்கு முன் அல்லது தனிப்பட்ட தகவல்களை உள்ளிடுவதற்கு முன் இணையதள முகவரியைச் சரிபார்க்கவும்.",
        otpTitle: "OTP-ஐ ரகசியமாக வைத்திருங்கள்",
        otpText: "OTP, வங்கி PIN அல்லது கடவுச்சொற்களை யாரிடமும் பகிர வேண்டாம்."
    }
};

function updateLanguage(language) {
    const selected = translations[language] || translations.en;

    document.querySelectorAll("[data-tip]").forEach((element) => {
        const key = element.dataset.tip;

        if (selected[key]) {
            element.textContent = selected[key];
        }
    });
}

if (languageSelect) {
    languageSelect.addEventListener("change", function () {
        updateLanguage(languageSelect.value);
    });
}

// --------------------------------------------
// EMERGENCY CYBER FIRST AID
// --------------------------------------------

const emergencyGuidance = {
    payment: {
        level: "danger",
        title: "If You May Have Lost Money",
        message: "Act quickly. Contact your bank or payment provider using its official contact details.",
        tips: [
            "Contact your bank immediately and ask about blocking or disputing the transaction.",
            "In India, call the cybercrime helpline 1930 as soon as possible for suspected financial cyber fraud.",
            "Submit a report through the official National Cyber Crime Reporting Portal at cybercrime.gov.in.",
            "Save transaction IDs, screenshots, messages, and complaint reference numbers.",
            "Do not pay anyone who promises to recover your money for an upfront fee."
        ]
    },

    password: {
        level: "warning",
        title: "If You Shared Your Password",
        message: "Secure the affected account immediately using its official website or app.",
        tips: [
            "Change the exposed password immediately.",
            "Change the same password anywhere else you reused it.",
            "Enable multifactor authentication.",
            "Sign out of other sessions if the service provides that option.",
            "Check recovery email addresses, phone numbers, and recent account activity."
        ]
    },

    otp: {
        level: "danger",
        title: "If You Shared an OTP or Banking PIN",
        message: "Treat this as urgent, particularly if it relates to a bank or payment account.",
        tips: [
            "Contact your bank or payment provider through its official channel immediately.",
            "Ask the provider to secure or block affected services if necessary.",
            "Review recent transactions and report unauthorised activity.",
            "Never share another OTP or PIN with a caller claiming to help.",
            "If money was taken fraudulently in India, call 1930 promptly."
        ]
    },

    link: {
        level: "warning",
        title: "If You Clicked a Suspicious Link",
        message: "Clicking a link alone does not necessarily mean your device or accounts are compromised.",
        tips: [
            "Close the page and do not enter personal or banking details.",
            "If you downloaded a file, do not open it; scan it with trusted security software.",
            "If you entered a password, change it using the official website from a trusted device.",
            "If you installed an app or granted remote access, disconnect from the session and seek trusted technical help.",
            "Watch for unusual account activity and install security updates."
        ]
    },

    account: {
        level: "danger",
        title: "If Your Account May Be Compromised",
        message: "Use the service's official account recovery process from a trusted device.",
        tips: [
            "Change the password if you can still access the account.",
            "Revoke unknown sessions and devices.",
            "Enable multifactor authentication.",
            "Check recovery details and remove unfamiliar changes.",
            "Notify the service provider and warn contacts if scam messages were sent from your account."
        ]
    }
};

if (emergencyButton && emergencySelect && emergencyResult) {
    emergencyButton.addEventListener("click", function () {
        const selectedSituation = emergencySelect.value;

        if (!selectedSituation) {
            displayResult(
                emergencyResult,
                "Select a Situation",
                "Choose the option that best describes what happened.",
                "warning"
            );

            return;
        }

        const guidance = emergencyGuidance[selectedSituation];

        if (guidance) {
            displayResult(
                emergencyResult,
                guidance.title,
                guidance.message,
                guidance.level,
                guidance.tips
            );
        }
    });
}

// --------------------------------------------
// DOWNLOAD SCAN REPORT
// --------------------------------------------

if (downloadReportButton) {
    downloadReportButton.addEventListener("click", function () {
        const reportLines = [
            "CYBER FIRST AID - SCAN REPORT",
            "================================",
            `Generated: ${new Date().toLocaleString()}`,
            "",
            "IMPORTANT:",
            "This report contains heuristic results, not verified threat intelligence.",
            "A result marked safe does not guarantee that an item is safe.",
            "",
            `Total scans: ${scanHistory.length}`,
            `URL scans: ${scanHistory.filter((item) => item.type === "URL").length}`,
            `Message scans: ${scanHistory.filter((item) => item.type === "Message").length}`,
            `Flagged results: ${scanHistory.filter((item) => item.level === "warning" || item.level === "danger").length}`,
            "",
            "SCAN HISTORY",
            "================================"
        ];

        if (scanHistory.length === 0) {
            reportLines.push("No scans have been recorded.");
        } else {
            scanHistory.forEach((entry, index) => {
                reportLines.push(
                    `${index + 1}. Time: ${new Date(entry.time).toLocaleString()}`
                );
                reportLines.push(`   Type: ${entry.type}`);
                reportLines.push(`   Item: ${entry.item}`);
                reportLines.push(`   Result: ${entry.result}`);
                reportLines.push("");
            });
        }

        const blob = new Blob(
            [reportLines.join("\n")],
            { type: "text/plain;charset=utf-8" }
        );

        const objectURL = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");

        downloadLink.href = objectURL;
        downloadLink.download = "cyber-first-aid-report.txt";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    });
}

// --------------------------------------------
// CLEAR HISTORY
// --------------------------------------------

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", function () {
        if (scanHistory.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete all saved scan history?"
        );

        if (!confirmed) {
            return;
        }

        scanHistory = [];
        saveHistory();
        updateDashboard();
        renderHistory();
    });
}

// --------------------------------------------
// INITIALIZE APPLICATION
// --------------------------------------------

updateDashboard();
renderHistory();

console.log("Cyber First Aid initialized successfully.");
// =====================================
// SOCIAL ENGINEERING ANALYZER
// =====================================

const socialEngineeringForm =
    document.getElementById("socialEngineeringForm");

const socialMessage =
    document.getElementById("socialMessage");

const socialEngineeringResult =
    document.getElementById("socialEngineeringResult");


if (socialEngineeringForm) {
    socialEngineeringForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const message = socialMessage.value.trim();

        if (!message) {
    socialEngineeringResult.className = "result warning show";
    socialEngineeringResult.textContent =
        "Please enter a message to analyze.";
    return;
}

        analyzeSocialEngineering(message);
    });
}


function analyzeSocialEngineering(message) {
    const text = message.toLowerCase();

    const tactics = [
        {
            name: "Artificial Urgency",
            patterns: [
                /\burgent\b/i,
                /\bimmediately\b/i,
                /\bright now\b/i,
                /\bwithin \d+ minutes?\b/i,
                /\bact now\b/i,
                /\blast chance\b/i
            ],
            explanation:
                "The message may pressure you to act before verifying the claim."
        },
        {
            name: "Fear or Intimidation",
            patterns: [
                /\baccount will be blocked\b/i,
                /\baccount suspended\b/i,
                /\barrest\b/i,
                /\blegal action\b/i,
                /\byou will lose\b/i,
                /\baccount will be closed\b/i
            ],
            explanation:
                "The message may use fear of consequences to influence your decision."
        },
        {
            name: "Sensitive Information Request",
            patterns: [
                /\bshare your otp\b/i,
                /\bsend your otp\b/i,
                /\bshare your pin\b/i,
                /\bpassword\b/i,
                /\bcard cvv\b/i,
                /\bverification code\b/i
            ],
            explanation:
                "The message may be trying to obtain sensitive information. Never disclose your OTP, PIN, or password."
        },
        {
            name: "Unexpected Reward",
            patterns: [
                /\byou have won\b/i,
                /\bclaim your prize\b/i,
                /\bfree gift\b/i,
                /\blottery winner\b/i,
                /\bcongratulations.*prize\b/i
            ],
            explanation:
                "An unexpected reward may be used to attract attention or encourage risky actions."
        },
        {
            name: "Financial Pressure",
            patterns: [
                /\bpay a registration fee\b/i,
                /\bsend money immediately\b/i,
                /\btransfer money\b/i,
                /\bpay to receive\b/i,
                /\bprocessing fee\b/i,
                /\brefund.*otp\b/i
            ],
            explanation:
                "The message may pressure you into making a payment or connecting a payment to sensitive credentials."
        },
        {
            name: "Suspicious Link",
            patterns: [
                /https?:\/\//i,
                /\bclick here\b/i,
                /\bopen this link\b/i,
                /\bverify your account online\b/i
            ],
            explanation:
                "Verify the destination independently before opening a link. The presence of a link alone does not prove a scam."
        },
        {
            name: "Authority Impersonation",
            patterns: [
                /\bwe are from your bank\b/i,
                /\bgovernment officer\b/i,
                /\bpolice department\b/i,
                /\bcustomer support\b/i,
                /\bbank representative\b/i
            ],
            explanation:
                "The sender may be claiming authority. Verify their identity through an independently obtained official contact."
        },
        {
            name: "Secrecy or Isolation",
            patterns: [
                /\bkeep this secret\b/i,
                /\bdon't tell anyone\b/i,
                /\bdo not tell anyone\b/i,
                /\bconfidential payment\b/i
            ],
            explanation:
                "Requests for secrecy can be a manipulation tactic. Pause and seek independent advice."
        }
    ];

    const findings = [];

    tactics.forEach(function (tactic) {
        const matched = tactic.patterns.some(function (pattern) {
            return pattern.test(text);
        });

        if (matched) {
            findings.push(tactic);
        }
    });

    displaySocialEngineeringFindings(message, findings);
}


function displaySocialEngineeringFindings(message, findings) {
    socialEngineeringResult.replaceChildren();

    socialEngineeringResult.classList.add("show");

    const title = document.createElement("h3");
    title.textContent = "Social Engineering Analysis";
    socialEngineeringResult.appendChild(title);

    if (findings.length === 0) {
        const messageElement = document.createElement("p");

        messageElement.textContent =
            "No predefined manipulation patterns were detected. " +
            "This does not prove the message is safe. Scams can use " +
            "subtle wording, unfamiliar links, or convincing impersonation.";

        socialEngineeringResult.appendChild(messageElement);

        return;
    }

    const riskLevel =
        findings.length >= 3 ? "HIGH" :
        findings.length === 2 ? "ELEVATED" : "REVIEW";

    const risk = document.createElement("p");
    risk.className = "risk-indicator";
    risk.textContent =
        "Attention level: " + riskLevel +
        " — " + findings.length + " potential tactic(s) detected.";

    socialEngineeringResult.appendChild(risk);

    const description = document.createElement("p");
    description.textContent =
        "These findings are warning indicators, not proof that the sender is fraudulent.";

    socialEngineeringResult.appendChild(description);

    const list = document.createElement("ul");

    findings.forEach(function (finding) {
        const item = document.createElement("li");

        const tacticName = document.createElement("strong");
        tacticName.textContent = finding.name + ": ";

        const explanation = document.createElement("span");
        explanation.textContent = finding.explanation;

        item.appendChild(tacticName);
        item.appendChild(explanation);
        list.appendChild(item);
    });

    socialEngineeringResult.appendChild(list);

    const adviceTitle = document.createElement("h4");
    adviceTitle.textContent = "Recommended actions";

    socialEngineeringResult.appendChild(adviceTitle);

    const advice = document.createElement("p");
    advice.textContent =
        "Pause before responding. Do not share OTPs, PINs, or passwords. " +
        "Verify unexpected requests through an official channel you locate independently.";

    socialEngineeringResult.appendChild(advice);
}
/* =========================================
   CYBER FIRST AID - EXTRA SECURITY TOOLS
   No AI, API key, or backend required
========================================= */

(() => {
    "use strict";

    // Password Strength Checker - reliable initialization
function initializePasswordChecker() {
    const input = document.getElementById("passwordInput");
    const button = document.getElementById("checkPasswordBtn");
    const result = document.getElementById("passwordResult");

    if (!input || !button || !result) {
        console.error("Password checker elements are not available yet.");
        return;
    }

    // Prevent attaching duplicate handlers.
    if (button.dataset.passwordCheckerReady === "true") {
        return;
    }

    button.dataset.passwordCheckerReady = "true";

    button.addEventListener("click", function () {
        const password = input.value;
        result.replaceChildren();

        if (!password) {
            result.textContent = "Please enter a password.";
            return;
        }

        const checks = [
            { valid: password.length >= 8, message: "Use at least 8 characters." },
            { valid: /[A-Z]/.test(password), message: "Add an uppercase letter." },
            { valid: /[a-z]/.test(password), message: "Add a lowercase letter." },
            { valid: /[0-9]/.test(password), message: "Add a number." },
            { valid: /[^A-Za-z0-9]/.test(password), message: "Add a special character." }
        ];

        const score = checks.filter(check => check.valid).length;
        const strength = score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong";

        const heading = document.createElement("h3");
        heading.textContent = "Password Strength: " + strength;
        result.appendChild(heading);

        const suggestions = checks.filter(check => !check.valid);

        if (suggestions.length) {
            const list = document.createElement("ul");

            suggestions.forEach(check => {
                const item = document.createElement("li");
                item.textContent = check.message;
                list.appendChild(item);
            });

            result.appendChild(list);
        } else {
            result.appendChild(
                document.createTextNode("Your password meets all five checks.")
            );
        }
    });

    console.log("Password Strength Checker initialized successfully.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePasswordChecker);
} else {
    initializePasswordChecker();
}
})();
// FIX: Phishing URL Detector
document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("phishingUrlInput");
    const button = document.getElementById("checkPhishingUrlBtn");
    const result = document.getElementById("phishingUrlResult");

    if (!input || !button || !result) {
        console.error("Phishing detector elements not found.");
        return;
    }

    if (button.dataset.phishingReady === "true") return;
    button.dataset.phishingReady = "true";

    button.addEventListener("click", function () {
        const value = input.value.trim();
        result.replaceChildren();

        if (!value) {
            result.textContent = "Please enter a URL to analyze.";
            return;
        }

        let url;

        try {
            url = new URL(value);
        } catch (error) {
            result.textContent =
                "Invalid URL. Enter a complete URL, such as https://example.com";
            return;
        }

        if (!["http:", "https:"].includes(url.protocol)) {
            result.textContent = "Only HTTP and HTTPS URLs are supported.";
            return;
        }

        const warnings = [];

        if (url.protocol !== "https:") {
            warnings.push("This URL does not use HTTPS.");
        }

        if (url.username || url.password) {
            warnings.push("The URL contains embedded login credentials.");
        }

        if (url.hostname.split(".").length >= 5) {
            warnings.push("The domain contains many subdomains.");
        }

        if (/login|verify|account|password|secure|confirm/i.test(
            url.pathname + url.search
        )) {
            warnings.push("The URL contains words sometimes used in phishing links.");
        }

        const heading = document.createElement("h3");
        heading.textContent = warnings.length
            ? "Caution: Potential Warning Signs"
            : "No Obvious Warning Signs Detected";

        result.appendChild(heading);

        if (warnings.length) {
            const list = document.createElement("ul");

            warnings.forEach(function (warning) {
                const item = document.createElement("li");
                item.textContent = warning;
                list.appendChild(item);
            });

            result.appendChild(list);
        }

        const note = document.createElement("p");
        note.textContent =
            "This is a basic URL pattern check. It cannot guarantee that a website is safe or malicious.";
        result.appendChild(note);
    });

    console.log("Phishing URL Detector initialized successfully.");
});
// FIX: Incident Response Guide
(function () {
    function initializeIncidentGuide() {
        const button = document.getElementById("incidentGuideBtn");
        const dropdown = document.getElementById("incidentType");
        const result = document.getElementById("incidentResult");

        if (!button || !dropdown || !result) {
            console.error(
                "Incident Response Guide elements are missing:",
                {
                    buttonFound: !!button,
                    dropdownFound: !!dropdown,
                    resultFound: !!result
                }
            );
            return;
        }

        const guides = {
            hacked: [
                "Change your password using the official website.",
                "Sign out of unfamiliar devices and sessions.",
                "Enable two-factor authentication.",
                "Check your account recovery details.",
                "Contact the service provider if you cannot recover your account."
            ],
            upi: [
                "Contact your bank immediately using its official contact details.",
                "If money was stolen, call India's cybercrime helpline at 1930.",
                "Report the incident at cybercrime.gov.in.",
                "Keep transaction IDs, screenshots, and messages as evidence.",
                "Never share your UPI PIN or OTP."
            ],
            phishing: [
                "Stop interacting with the suspicious website.",
                "Do not enter passwords or payment details.",
                "If you entered your password, change it through the official website.",
                "Enable two-factor authentication.",
                "Report the suspicious message or website."
            ],
            malware: [
                "Disconnect the affected device from the network if an infection is suspected.",
                "Avoid banking on the affected device.",
                "Run a scan using trusted security software.",
                "Change important passwords from a separate, trusted device if necessary.",
                "Seek professional assistance if the problem continues."
            ],
            social: [
                "Use the platform's official account recovery process.",
                "Change your password from a trusted device.",
                "Sign out of unfamiliar sessions.",
                "Enable two-factor authentication.",
                "Warn your contacts about suspicious messages from your account."
            ]
        };

        button.addEventListener("click", function () {
            const selectedType = dropdown.value;

            if (!selectedType) {
                result.textContent = "Please select an incident first.";
                return;
            }

            const steps = guides[selectedType];

            if (!steps) {
                result.textContent =
                    "No instructions are available for this incident.";
                return;
            }

            const heading = document.createElement("h3");
            heading.textContent = "Emergency Response Steps";

            const list = document.createElement("ol");

            steps.forEach(function (step) {
                const item = document.createElement("li");
                item.textContent = step;
                list.appendChild(item);
            });

            result.replaceChildren(heading, list);

            console.log("Incident Response Guide is working.");
        });

        console.log("Incident Response Guide initialized successfully.");
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeIncidentGuide
        );
    } else {
        initializeIncidentGuide();
    }
})();
// FIX: SHA-256 File Hash Generator
(function () {
    async function initializeHashGenerator() {
        const fileInput = document.getElementById("hashFileInput");
        const button = document.getElementById("generateHashBtn");
        const result = document.getElementById("hashResult");

        if (!fileInput || !button || !result) {
            console.error("File Hash Generator HTML elements are missing.");
            return;
        }

        button.addEventListener("click", async function () {
            const file = fileInput.files[0];

            if (!file) {
                result.textContent = "Please choose a file first.";
                return;
            }

            if (!window.crypto || !window.crypto.subtle) {
                result.textContent =
                    "SHA-256 is unavailable. Open this site through localhost or HTTPS.";
                return;
            }

            try {
                result.textContent = "Calculating SHA-256 hash...";

                const fileBuffer = await file.arrayBuffer();
                const hashBuffer = await crypto.subtle.digest(
                    "SHA-256",
                    fileBuffer
                );

                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray
                    .map(byte => byte.toString(16).padStart(2, "0"))
                    .join("");

                const heading = document.createElement("h3");
                heading.textContent = "SHA-256 Hash";

                const hashOutput = document.createElement("p");
                hashOutput.textContent = hashHex;
                hashOutput.style.overflowWrap = "anywhere";
                hashOutput.style.userSelect = "text";

                const copyButton = document.createElement("button");
                copyButton.type = "button";
                copyButton.textContent = "Copy Hash";

                copyButton.addEventListener("click", async function () {
                    try {
                        await navigator.clipboard.writeText(hashHex);
                        copyButton.textContent = "Copied!";
                    } catch (error) {
                        copyButton.textContent =
                            "Copy unavailable — select and copy the hash";
                    }
                });

                result.replaceChildren(heading, hashOutput, copyButton);

                console.log("File Hash Generator is working.");
            } catch (error) {
                console.error("Unable to calculate file hash:", error);
                result.textContent =
                    "Could not calculate the hash. Please try another file.";
            }
        });

        console.log("File Hash Generator initialized successfully.");
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeHashGenerator
        );
    } else {
        initializeHashGenerator();
    }
})();
// FIX: Cybersecurity Knowledge Quiz
(function () {
    function initializeQuiz() {
        const container = document.getElementById("quizContainer");
        const button = document.getElementById("submitQuizBtn");
        const result = document.getElementById("quizResult");

        if (!container || !button || !result) {
            console.error("Quiz HTML elements are missing.");
            return;
        }

        const questions = [
            {
                question: "1. What should you do if you receive a suspicious link?",
                options: [
                    "Click it to check where it goes",
                    "Forward it to all your friends",
                    "Avoid clicking and verify the sender",
                    "Enter your password to test it"
                ],
                answer: 2
            },
            {
                question: "2. What should you do if someone asks for your OTP?",
                options: [
                    "Share it if they sound trustworthy",
                    "Never share it with anyone",
                    "Post it in a message",
                    "Send it to an unknown number"
                ],
                answer: 1
            },
            {
                question: "3. Which password is generally strongest?",
                options: [
                    "password123",
                    "yourname123",
                    "12345678",
                    "A long, unique password or passphrase"
                ],
                answer: 3
            },
            {
                question: "4. What should you do if your account is hacked?",
                options: [
                    "Ignore the problem",
                    "Change your password using the official website and secure your account",
                    "Share your password with friends",
                    "Disable all security features"
                ],
                answer: 1
            },
            {
                question: "5. What does two-factor authentication provide?",
                options: [
                    "An additional layer of account security",
                    "Free internet access",
                    "Automatic virus removal",
                    "Unlimited passwords"
                ],
                answer: 0
            }
        ];

        container.replaceChildren();

        questions.forEach(function (item, questionIndex) {
            const wrapper = document.createElement("fieldset");
            wrapper.className = "quiz-question";

            const legend = document.createElement("legend");
            legend.textContent = item.question;
            wrapper.appendChild(legend);

            item.options.forEach(function (option, optionIndex) {
                const label = document.createElement("label");
                label.style.display = "block";

                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = "quizQuestion" + questionIndex;
                radio.value = optionIndex;

                label.appendChild(radio);
                label.appendChild(
                    document.createTextNode(" " + option)
                );

                wrapper.appendChild(label);
            });

            container.appendChild(wrapper);
        });

        button.addEventListener("click", function () {
            let score = 0;
            let unanswered = 0;

            questions.forEach(function (item, index) {
                const selected = container.querySelector(
                    'input[name="quizQuestion' + index + '"]:checked'
                );

                if (!selected) {
                    unanswered++;
                } else if (Number(selected.value) === item.answer) {
                    score++;
                }
            });

            if (unanswered > 0) {
                result.textContent =
                    "Please answer all " + questions.length +
                    " questions before submitting. Unanswered: " +
                    unanswered + ".";
                return;
            }

            result.replaceChildren();

            const heading = document.createElement("h3");
            heading.textContent = "Quiz Results";
            result.appendChild(heading);

            const scoreText = document.createElement("p");
            scoreText.textContent =
                "Your score: " + score + " out of " + questions.length;
            result.appendChild(scoreText);

            const message = document.createElement("p");
            message.textContent = score === questions.length
                ? "Excellent! You answered every question correctly."
                : "Good effort! Review the questions and try again.";
            result.appendChild(message);

            console.log("Cybersecurity Quiz submitted. Score:", score);
        });

        console.log("Cybersecurity Quiz initialized successfully.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeQuiz);
    } else {
        initializeQuiz();
    }
})();
// SOCIAL ENGINEERING ANALYZER
(function () {
function initializeSocialEngineeringAnalyzer() {
const form = document.getElementById("socialEngineeringForm");
const messageInput = document.getElementById("socialMessage");
const result = document.getElementById("socialEngineeringResult");

    if (!form || !messageInput || !result) {
        console.warn("Social Engineering Analyzer elements were not found.");
        return;
    }

    // Prevent duplicate event handlers if this code is initialized again.
    if (form.dataset.analyzerInitialized === "true") return;
    form.dataset.analyzerInitialized = "true";

    const patterns = [
        {
            name: "Urgency or pressure",
            words: ["urgent", "immediately", "act now", "within 24 hours", "last chance", "expires today", "right now", "limited time"],
            explanation: "The message may be pressuring you to act without checking the facts."
        },
        {
            name: "Fear or threats",
            words: ["account suspended", "account blocked", "you will be arrested", "legal action", "final warning", "account will be deleted", "security breach"],
            explanation: "Threats or frightening claims may be used to make you react quickly."
        },
        {
            name: "Impersonation",
            words: ["verify your account", "pretending to be", "bank representative", "official support", "your account has been compromised", "we are from"],
            explanation: "The sender may be claiming authority or requesting trust without proving their identity."
        },
        {
            name: "Financial pressure",
            words: ["pay now", "registration fee", "processing fee", "transfer money", "send payment", "claim your prize", "bank details", "upi pin", "otp"],
            explanation: "Requests for money, banking details, PINs, or one-time passwords require extreme caution."
        },
        {
            name: "Suspicious requests",
            words: ["click this link", "share your password", "send your password", "download this file", "remote access", "share otp", "provide your pin", "confirm your identity"],
            explanation: "The message may be requesting sensitive information or an action that could compromise your security."
        }
    ];

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const message = messageInput.value.trim().toLowerCase();

        if (!message) {
            result.textContent = "Please enter a message to analyze.";
            return;
        }

        const findings = [];

        patterns.forEach(function (pattern) {
            const matchedWords = pattern.words.filter(function (word) {
                return message.includes(word);
            });

            if (matchedWords.length > 0) {
                findings.push({
                    name: pattern.name,
                    words: matchedWords,
                    explanation: pattern.explanation
                });
            }
        });

        result.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = "Analysis Results";
        result.appendChild(heading);

        if (findings.length === 0) {
            const messageResult = document.createElement("p");
            messageResult.textContent =
                "No listed manipulation patterns were detected. This does not guarantee that the message is safe. Verify the sender and any links independently.";
            result.appendChild(messageResult);
            return;
        }

        const summary = document.createElement("p");
        summary.textContent =
            "Potential warning signs detected: " + findings.length;
        result.appendChild(summary);

        const list = document.createElement("ul");

        findings.forEach(function (finding) {
            const item = document.createElement("li");

            const title = document.createElement("strong");
            title.textContent = finding.name + ": ";
            item.appendChild(title);

            item.appendChild(
                document.createTextNode(
                    finding.explanation +
                    " Matched phrases: " +
                    finding.words.join(", ") + "."
                )
            );

            list.appendChild(item);
        });

        result.appendChild(list);

        const advice = document.createElement("p");
        advice.textContent =
            "Safety advice: Do not share passwords, OTPs, UPI PINs, or banking details. Avoid suspicious links and verify requests using an official contact method.";
        result.appendChild(advice);
    });

    console.log("Social Engineering Analyzer initialized successfully.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSocialEngineeringAnalyzer);
} else {
    initializeSocialEngineeringAnalyzer();
}

})();
// ========================================
// SCAM AWARENESS SIMULATOR
// ========================================
document.addEventListener("DOMContentLoaded", function () {
const simulatorContent = document.getElementById("simulatorContent");
const simulatorFeedback = document.getElementById("simulatorFeedback");
const simulatorButtons = document.querySelectorAll(".simulator-option");

if (!simulatorContent || !simulatorFeedback || simulatorButtons.length === 0) {
    console.error("Scam Awareness Simulator elements were not found.");
    return;
}

simulatorButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const feedback = simulatorFeedback;
        const isCorrect = button.dataset.answer === "correct";

        feedback.replaceChildren();

        const heading = document.createElement("h3");
        const explanation = document.createElement("p");

        if (isCorrect) {
            heading.textContent = "✅ Correct! Well done.";
            explanation.textContent =
                "Always independently verify the company and job offer. Never pay unexpected recruitment fees or share sensitive banking details with unverified recruiters.";

            feedback.className = "result info show";
        } else {
            heading.textContent = "❌ Not quite. Try again.";
            explanation.textContent =
                "Paying a registration fee or sharing bank details with an unverified recruiter can put you at risk. Verify the company through its official website and independently confirmed contact information.";

            feedback.className = "result warning show";
        }

        feedback.append(heading, explanation);
    });
});
});
