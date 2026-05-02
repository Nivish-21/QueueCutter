export interface FormQuestion {
  id: string;
  text: string;
  hint?: string;
  hintHi?: string; // Hindi hint for India forms
  type: "text" | "date" | "select" | "radio" | "number" | "textarea" | "yesno";
  options?: string[];
  required: boolean;
  fieldMapping: string;
  officialLabel: string;
  validationPattern?: string;
  conditionalOn?: { questionId: string; value: string };
}

export interface FormSchema {
  id: string;
  countryCode: string; // "IN" | "GB" | "US"
  name: string;
  officialName: string;
  shortDescription: string;
  longDescription: string;
  whoItIsFor: string;
  category: string;
  requiredDocuments: string[];
  questions: FormQuestion[];
  submissionOffice: string;
  submissionMethod: "walk-in" | "online" | "postal" | "walk-in or online";
  processingTime: string;
  fee: string;
  disclaimer: string;
  commonRejectionReasons: string[];
}

export const FORMS: FormSchema[] = [
  // ─────────── UNITED STATES ───────────
  {
    id: "snap-benefits",
    countryCode: "US",
    name: "SNAP Benefits Application",
    officialName: "Application for Supplemental Nutrition Assistance Program (SNAP)",
    shortDescription: "Apply for monthly food assistance benefits for your household.",
    longDescription:
      "SNAP provides monthly benefits to help low-income households buy the food they need for good health. This guided form helps you prepare your application with the correct information before submitting to your local SNAP office.",
    whoItIsFor: "Low-income individuals and families needing food assistance",
    category: "Food Assistance",
    submissionMethod: "walk-in or online",
    requiredDocuments: [
      "Government-issued photo ID (driver's license, state ID, or passport)",
      "Proof of address (utility bill, lease agreement, or mail with your name)",
      "Social Security card or ITIN for all household members",
      "Proof of income (pay stubs, employer letter, or benefit award letters)",
      "Proof of expenses (rent/mortgage receipt, utility bills, childcare costs)",
      "Bank account statements for all accounts (last 30 days)",
    ],
    commonRejectionReasons: [
      "Income exceeds the gross income limit for household size",
      "Missing or incomplete identity documentation",
      "Social Security Number not provided for all household members",
      "Assets exceed the allowable limit",
      "Non-citizen status not verified with immigration documents",
    ],
    questions: [
      { id: "first_name", text: "What is your first name?", hint: "Enter your legal first name as it appears on your ID.", type: "text", required: true, fieldMapping: "applicant_first_name", officialLabel: "Applicant First Name" },
      { id: "last_name", text: "What is your last name?", hint: "Enter your legal last name as it appears on your ID.", type: "text", required: true, fieldMapping: "applicant_last_name", officialLabel: "Applicant Last Name" },
      { id: "date_of_birth", text: "What is your date of birth?", hint: "Enter your birth date in MM/DD/YYYY format.", type: "date", required: true, fieldMapping: "applicant_dob", officialLabel: "Date of Birth", validationPattern: "^(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/(19|20)\\d{2}$" },
      { id: "ssn", text: "What is your Social Security Number (SSN) or ITIN?", hint: "Enter your 9-digit SSN without dashes, or your ITIN. Required for identity verification.", type: "text", required: true, fieldMapping: "applicant_ssn", officialLabel: "Social Security Number / ITIN", validationPattern: "^\\d{9}$" },
      { id: "street_address", text: "What is your current home address?", hint: "Include apartment or unit number if applicable.", type: "text", required: true, fieldMapping: "address_street", officialLabel: "Street Address" },
      { id: "city", text: "What city do you live in?", type: "text", required: true, fieldMapping: "address_city", officialLabel: "City" },
      { id: "state", text: "What state do you live in?", type: "select", options: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"], required: true, fieldMapping: "address_state", officialLabel: "State" },
      { id: "zip_code", text: "What is your ZIP code?", type: "text", required: true, fieldMapping: "address_zip", officialLabel: "ZIP Code", validationPattern: "^\\d{5}(-\\d{4})?$" },
      { id: "household_size", text: "How many people live in your household, including yourself?", hint: "Include everyone you buy and prepare food with, even if they are not applying for SNAP.", type: "number", required: true, fieldMapping: "household_size", officialLabel: "Household Size" },
      { id: "monthly_income", text: "What is your household's total monthly income before taxes?", hint: "Include wages, salaries, tips, Social Security, disability, child support, and any other regular income. Enter 0 if no income.", type: "number", required: true, fieldMapping: "monthly_gross_income", officialLabel: "Monthly Gross Income ($)" },
      { id: "has_assets", text: "Do you or anyone in your household have bank accounts, stocks, or bonds worth more than $2,750 total?", hint: "This amount is higher ($4,250) if someone is 60+ or has a disability.", type: "yesno", required: true, fieldMapping: "has_countable_assets", officialLabel: "Countable Assets Exceeds Limit" },
      { id: "monthly_rent", text: "How much do you pay each month for rent or mortgage?", hint: "Enter 0 if you do not pay rent or mortgage.", type: "number", required: false, fieldMapping: "monthly_shelter_cost", officialLabel: "Monthly Shelter Cost ($)" },
      { id: "citizenship", text: "Are you a U.S. citizen or a qualified non-citizen?", hint: "Qualified non-citizens include lawful permanent residents, refugees, asylees, and others with certain immigration statuses.", type: "radio", options: ["U.S. Citizen", "Qualified Non-Citizen", "Neither"], required: true, fieldMapping: "citizenship_status", officialLabel: "Citizenship / Immigration Status" },
      { id: "phone", text: "What is your phone number?", hint: "Your caseworker may use this to contact you.", type: "text", required: false, fieldMapping: "contact_phone", officialLabel: "Phone Number", validationPattern: "^\\d{10}$" },
      { id: "email", text: "What is your email address? (Optional)", hint: "Providing an email allows you to receive updates electronically.", type: "text", required: false, fieldMapping: "contact_email", officialLabel: "Email Address" },
    ],
    submissionOffice: "Your local SNAP/DHHS office or online at your state's benefits portal",
    processingTime: "30 days from date of application (7 days for expedited processing if eligible)",
    fee: "No fee",
    disclaimer: "This tool helps you prepare your SNAP application but is not an official filing system. QueueCutter is not affiliated with any government agency.",
  },
  {
    id: "ss5-replacement",
    countryCode: "US",
    name: "Social Security Card Replacement",
    officialName: "Form SS-5: Application for a Social Security Card",
    shortDescription: "Replace a lost, stolen, or damaged Social Security card.",
    longDescription:
      "Use Form SS-5 to apply for a replacement Social Security card if your original was lost, stolen, or damaged. You may also use it to request a name change on your card. The Social Security Administration (SSA) allows up to 3 replacement cards per year and 10 in a lifetime.",
    whoItIsFor: "U.S. citizens and eligible non-citizens who need to replace their Social Security card",
    category: "Identity Documents",
    submissionMethod: "walk-in",
    requiredDocuments: [
      "Government-issued photo ID (driver's license, state ID, or U.S. passport)",
      "Proof of U.S. citizenship (U.S. birth certificate, U.S. passport, or Certificate of Naturalization)",
      "Proof of immigration status (if non-citizen — Form I-551, I-94, or work authorization)",
      "Original documents only — photocopies are not accepted",
    ],
    commonRejectionReasons: [
      "Photocopied documents submitted instead of originals",
      "Name on ID does not match the name on your application",
      "Insufficient proof of identity or age",
      "Application submitted by proxy without proper legal authorization",
      "Exceeded the annual or lifetime replacement card limit",
    ],
    questions: [
      { id: "full_name_first", text: "What is your first name?", hint: "As it should appear on the new card.", type: "text", required: true, fieldMapping: "name_first", officialLabel: "First Name" },
      { id: "full_name_middle", text: "What is your middle name? (Optional)", type: "text", required: false, fieldMapping: "name_middle", officialLabel: "Middle Name" },
      { id: "full_name_last", text: "What is your last name?", type: "text", required: true, fieldMapping: "name_last", officialLabel: "Last Name" },
      { id: "date_of_birth", text: "What is your date of birth?", hint: "Enter in MM/DD/YYYY format.", type: "date", required: true, fieldMapping: "date_of_birth", officialLabel: "Date of Birth" },
      { id: "place_of_birth_city", text: "What city were you born in?", type: "text", required: true, fieldMapping: "place_of_birth_city", officialLabel: "City of Birth" },
      { id: "place_of_birth_state", text: "What state or country were you born in?", type: "text", required: true, fieldMapping: "place_of_birth_state", officialLabel: "State / Country of Birth" },
      { id: "citizenship_status", text: "What is your citizenship status?", type: "radio", options: ["U.S. Citizen", "Legal Permanent Resident", "Other Non-Citizen"], required: true, fieldMapping: "citizenship_status", officialLabel: "Citizenship / Immigration Status" },
      { id: "reason", text: "Why are you applying for a replacement card?", type: "radio", options: ["Lost or stolen card", "Damaged card", "Name change", "Never received original card"], required: true, fieldMapping: "replacement_reason", officialLabel: "Reason for Application" },
      { id: "existing_ssn", text: "What is your Social Security Number? (if you know it)", hint: "Leave blank only if you have never been assigned one.", type: "text", required: false, fieldMapping: "existing_ssn", officialLabel: "Social Security Number (if known)" },
      { id: "mailing_address", text: "What is your mailing address?", hint: "The card will be mailed here.", type: "text", required: true, fieldMapping: "mailing_address", officialLabel: "Mailing Address" },
      { id: "phone", text: "What is your daytime phone number?", type: "text", required: false, fieldMapping: "phone", officialLabel: "Daytime Phone Number" },
    ],
    submissionOffice: "Local Social Security Administration (SSA) office — walk-in only. Find your nearest office at ssa.gov/locator",
    processingTime: "2-4 weeks after application is accepted",
    fee: "No fee",
    disclaimer: "This tool prepares your SS-5 application but does not submit it. Original documents are required at the SSA office. QueueCutter is not affiliated with the SSA.",
  },

  // ─────────── INDIA ───────────
  {
    id: "income-certificate-in",
    countryCode: "IN",
    name: "Income Certificate",
    officialName: "Income Certificate (आय प्रमाण पत्र)",
    shortDescription: "Apply for an official income certificate for government schemes, admissions, and subsidies.",
    longDescription:
      "An Income Certificate is an official document issued by the Revenue Department stating your annual family income. It is required for applying to government schemes, BPL/APL classification, educational fee waivers, and scholarships. High rejection rates are common due to incomplete Aadhaar details or mismatched income figures.",
    whoItIsFor: "Individuals needing proof of income for government schemes, education, or subsidies",
    category: "Financial Documents",
    submissionMethod: "walk-in",
    requiredDocuments: [
      "Aadhaar Card (original and photocopy)",
      "Ration Card (if available)",
      "Self-declaration of income (prescribed format)",
      "Salary slip or employer certificate (if employed)",
      "Land records or property documents (if applicable)",
      "Passport-size photographs (2 copies)",
      "Bank passbook (first page photocopy)",
    ],
    commonRejectionReasons: [
      "Aadhaar number mismatch with other documents",
      "Income figure inconsistent with occupation or lifestyle",
      "Missing self-declaration affidavit",
      "Name variation between Aadhaar and Ration Card",
      "Address not matching Aadhaar-linked address",
      "Application not submitted in the correct Tehsil/Taluk jurisdiction",
    ],
    questions: [
      { id: "full_name", text: "What is your full name?", hint: "Enter exactly as it appears on your Aadhaar card.", hintHi: "अपना पूरा नाम आधार कार्ड के अनुसार लिखें।", type: "text", required: true, fieldMapping: "applicant_name", officialLabel: "Full Name (as per Aadhaar)" },
      { id: "father_name", text: "What is your father's full name?", hint: "Required for official identification.", hintHi: "अपने पिता का पूरा नाम लिखें।", type: "text", required: true, fieldMapping: "father_name", officialLabel: "Father's / Husband's Name" },
      { id: "date_of_birth", text: "What is your date of birth?", hint: "Enter in DD/MM/YYYY format as on your Aadhaar.", hintHi: "जन्म तिथि आधार कार्ड के अनुसार दर्ज करें।", type: "date", required: true, fieldMapping: "date_of_birth", officialLabel: "Date of Birth" },
      { id: "gender", text: "What is your gender?", type: "radio", options: ["Male", "Female", "Transgender"], required: true, fieldMapping: "gender", officialLabel: "Gender" },
      { id: "aadhaar_number", text: "What is your 12-digit Aadhaar number?", hint: "Do not share your Aadhaar number over phone or email. Only enter it on official forms.", hintHi: "अपना 12 अंकों का आधार नंबर दर्ज करें।", type: "text", required: true, fieldMapping: "aadhaar_number", officialLabel: "Aadhaar Number", validationPattern: "^\\d{12}$" },
      { id: "address", text: "What is your current residential address?", hint: "Include village/ward, tehsil, and district.", hintHi: "अपना पूरा पता लिखें — गाँव/वार्ड, तहसील और जिला।", type: "textarea", required: true, fieldMapping: "residential_address", officialLabel: "Residential Address" },
      { id: "district", text: "Which district do you live in?", hintHi: "अपना जिला चुनें।", type: "text", required: true, fieldMapping: "district", officialLabel: "District" },
      { id: "state_india", text: "Which state do you live in?", type: "select", options: ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"], required: true, fieldMapping: "state", officialLabel: "State" },
      { id: "occupation", text: "What is your occupation?", hint: "E.g., Daily wage labourer, Farmer, Government employee, Private sector employee, Self-employed.", hintHi: "अपना पेशा लिखें — जैसे किसान, मजदूर, सरकारी कर्मचारी।", type: "text", required: true, fieldMapping: "occupation", officialLabel: "Occupation" },
      { id: "annual_income", text: "What is your total annual family income (in rupees)?", hint: "Include all sources — agriculture, wages, business, rent, etc. Enter approximate figure.", hintHi: "परिवार की कुल वार्षिक आय दर्ज करें — खेती, मजदूरी, व्यापार सभी मिलाकर।", type: "number", required: true, fieldMapping: "annual_income", officialLabel: "Annual Family Income (INR)" },
      { id: "purpose", text: "What is the purpose of this income certificate?", hint: "E.g., Scholarship, government scheme application, educational fee waiver, job reservation.", hintHi: "यह प्रमाण पत्र किसलिए चाहिए? उदाहरण: छात्रवृत्ति, योजना, आरक्षण।", type: "text", required: true, fieldMapping: "purpose", officialLabel: "Purpose of Certificate" },
      { id: "mobile", text: "What is your mobile number?", hintHi: "अपना मोबाइल नंबर दर्ज करें।", type: "text", required: true, fieldMapping: "mobile", officialLabel: "Mobile Number", validationPattern: "^[6-9]\\d{9}$" },
    ],
    submissionOffice: "Tehsildar / SDM office or Common Service Centre (CSC) in your district. Many states allow online submission via state e-district portal.",
    processingTime: "7–30 days depending on state. Some states offer same-day certificates via CSC.",
    fee: "₹10–₹50 depending on state. Often free via CSC or e-district portal.",
    disclaimer: "This tool helps you prepare your income certificate application. QueueCutter is not affiliated with any government office. Income figures should be truthful and accurate.",
  },
  {
    id: "domicile-certificate-in",
    countryCode: "IN",
    name: "Domicile / Residence Certificate",
    officialName: "Domicile Certificate (निवास प्रमाण पत्र)",
    shortDescription: "Prove your permanent residence in a state for jobs, admissions, and government schemes.",
    longDescription:
      "A Domicile Certificate proves that you are a permanent resident of a particular state. It is required for state government jobs, state-quota college admissions, state-specific reservations, and many welfare schemes. The certificate is issued by the Revenue Department after verifying your years of residence.",
    whoItIsFor: "Individuals who are permanent residents of a state and need to prove domicile for government benefits",
    category: "Identity & Residence",
    submissionMethod: "walk-in",
    requiredDocuments: [
      "Aadhaar Card (original and photocopy)",
      "Ration Card showing residential address",
      "Birth certificate or school leaving certificate",
      "Voter ID card (if available)",
      "Land records, lease agreement, or utility bill showing address",
      "Self-declaration affidavit on stamp paper",
      "Passport-size photographs (2 copies)",
    ],
    commonRejectionReasons: [
      "Aadhaar address does not match current residential address",
      "Insufficient proof of years of continuous residence",
      "Missing self-declaration affidavit on stamp paper",
      "Birth state and current state conflict without supporting documents",
      "Application filed in wrong jurisdiction (wrong tehsil or district)",
    ],
    questions: [
      { id: "full_name", text: "What is your full name?", hint: "Enter exactly as it appears on your Aadhaar card.", hintHi: "अपना पूरा नाम आधार कार्ड के अनुसार लिखें।", type: "text", required: true, fieldMapping: "applicant_name", officialLabel: "Full Name" },
      { id: "father_name", text: "What is your father's or husband's name?", hintHi: "पिता या पति का नाम लिखें।", type: "text", required: true, fieldMapping: "father_name", officialLabel: "Father's / Husband's Name" },
      { id: "date_of_birth", text: "What is your date of birth?", type: "date", required: true, fieldMapping: "date_of_birth", officialLabel: "Date of Birth" },
      { id: "gender", text: "What is your gender?", type: "radio", options: ["Male", "Female", "Transgender"], required: true, fieldMapping: "gender", officialLabel: "Gender" },
      { id: "aadhaar_number", text: "What is your 12-digit Aadhaar number?", hintHi: "12 अंकों का आधार नंबर दर्ज करें।", type: "text", required: true, fieldMapping: "aadhaar_number", officialLabel: "Aadhaar Number", validationPattern: "^\\d{12}$" },
      { id: "current_address", text: "What is your current residential address?", hint: "Include village/ward, tehsil, and district.", hintHi: "वर्तमान निवास का पूरा पता लिखें।", type: "textarea", required: true, fieldMapping: "current_address", officialLabel: "Current Residential Address" },
      { id: "state_of_domicile", text: "Which state are you claiming domicile in?", hintHi: "किस राज्य का निवास प्रमाण पत्र चाहिए?", type: "select", options: ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"], required: true, fieldMapping: "state_of_domicile", officialLabel: "State of Domicile" },
      { id: "years_of_residence", text: "How many years have you continuously lived in this state?", hint: "Most states require 3–15 years of continuous residence. Check your state's specific rule.", hintHi: "आप इस राज्य में कितने वर्षों से रह रहे हैं?", type: "number", required: true, fieldMapping: "years_of_residence", officialLabel: "Years of Continuous Residence" },
      { id: "birth_state", text: "Which state were you born in?", hintHi: "जन्म राज्य का नाम लिखें।", type: "text", required: true, fieldMapping: "birth_state", officialLabel: "State of Birth" },
      { id: "purpose", text: "What is the purpose of this domicile certificate?", hint: "E.g., Government job application, college admission, state scheme.", hintHi: "यह प्रमाण पत्र किसलिए चाहिए?", type: "text", required: true, fieldMapping: "purpose", officialLabel: "Purpose" },
      { id: "mobile", text: "What is your mobile number?", hintHi: "मोबाइल नंबर दर्ज करें।", type: "text", required: true, fieldMapping: "mobile", officialLabel: "Mobile Number", validationPattern: "^[6-9]\\d{9}$" },
    ],
    submissionOffice: "Tehsildar office, SDM office, or Common Service Centre (CSC) / e-district portal for your district.",
    processingTime: "7–30 days. Expedited processing available in some states.",
    fee: "₹10–₹100 depending on state. Often free via e-district portal.",
    disclaimer: "This tool helps you prepare your domicile certificate application. Residence claims must be truthful and supported by genuine documents. QueueCutter is not affiliated with any government authority.",
  },

  // ─────────── UNITED KINGDOM ───────────
  {
    id: "council-tax-reduction-gb",
    countryCode: "GB",
    name: "Council Tax Reduction Application",
    officialName: "Council Tax Reduction / Local Council Tax Support Application",
    shortDescription: "Apply for a reduction in your Council Tax bill based on low income or benefits.",
    longDescription:
      "Council Tax Reduction (CTR) is a local discount for people on low incomes or who receive certain benefits. The scheme varies by local authority, but most councils offer up to 100% reduction for those on the lowest incomes. Applications are processed by your local council.",
    whoItIsFor: "Residents on low income, receiving Universal Credit, or eligible benefits who need help paying Council Tax",
    category: "Financial Support",
    submissionMethod: "online",
    requiredDocuments: [
      "National Insurance (NI) number",
      "Proof of identity (passport, driving licence, or birth certificate)",
      "Proof of address (utility bill, bank statement, or tenancy agreement dated within 3 months)",
      "Proof of income (payslips, Universal Credit award letter, or benefit statements)",
      "Bank statements for the last 2 months (all accounts)",
      "Tenancy agreement or mortgage statement",
      "Evidence of savings and investments (if any)",
    ],
    commonRejectionReasons: [
      "National Insurance number not provided or incorrect",
      "Income or savings exceed the local authority threshold",
      "Proof of address is older than 3 months",
      "Council Tax account reference number missing",
      "Capital/savings over £16,000 (usually disqualifies applicants)",
      "Application not submitted to the correct local council",
    ],
    questions: [
      { id: "full_name", text: "What is your full name?", hint: "Enter your name exactly as it appears on your National Insurance card or passport.", type: "text", required: true, fieldMapping: "applicant_name", officialLabel: "Full Name" },
      { id: "date_of_birth", text: "What is your date of birth?", type: "date", required: true, fieldMapping: "date_of_birth", officialLabel: "Date of Birth" },
      { id: "ni_number", text: "What is your National Insurance (NI) number?", hint: "Format: two letters, six numbers, one letter. Example: AB123456C", type: "text", required: true, fieldMapping: "ni_number", officialLabel: "National Insurance Number", validationPattern: "^[A-Z]{2}\\d{6}[A-Z]$" },
      { id: "address", text: "What is your current home address?", hint: "Include postcode.", type: "textarea", required: true, fieldMapping: "address", officialLabel: "Current Address" },
      { id: "council_name", text: "Which local council do you pay your Council Tax to?", hint: "This is the council responsible for your area — not the county or parish.", type: "text", required: true, fieldMapping: "council_name", officialLabel: "Local Council Name" },
      { id: "council_tax_ref", text: "What is your Council Tax account reference number?", hint: "This is on your Council Tax bill. It usually starts with letters or numbers.", type: "text", required: false, fieldMapping: "council_tax_ref", officialLabel: "Council Tax Reference Number" },
      { id: "income_type", text: "What is your main source of income?", type: "radio", options: ["Employment (PAYE)", "Self-employment", "Universal Credit", "Pension / Pension Credit", "Other benefits", "No income"], required: true, fieldMapping: "income_type", officialLabel: "Main Income Source" },
      { id: "weekly_income", text: "What is your total weekly household income (after tax)?", hint: "Include wages, benefits, pensions, and any other regular income. Enter in pounds (£).", type: "number", required: true, fieldMapping: "weekly_income", officialLabel: "Total Weekly Household Income (£)" },
      { id: "savings", text: "What is the total value of your savings and investments?", hint: "Include bank accounts, ISAs, shares, and other investments. Savings over £16,000 usually means you are not eligible.", type: "number", required: true, fieldMapping: "savings", officialLabel: "Total Savings and Capital (£)" },
      { id: "household_adults", text: "How many adults (aged 18 or over) live in your household?", hint: "Include yourself. Students in full-time education may be disregarded.", type: "number", required: true, fieldMapping: "household_adults", officialLabel: "Number of Adults in Household" },
      { id: "has_dependants", text: "Do you have any dependent children living with you?", type: "yesno", required: true, fieldMapping: "has_dependants", officialLabel: "Dependent Children" },
      { id: "tenancy_type", text: "Are you renting or do you own your home?", type: "radio", options: ["Renting from private landlord", "Renting from council / housing association", "Owner-occupier (mortgage or owned outright)", "Living with family / no tenancy"], required: true, fieldMapping: "tenancy_type", officialLabel: "Tenancy / Ownership Type" },
    ],
    submissionOffice: "Your local council's website or housing benefit / Council Tax reduction team. Most councils accept online applications at gov.uk/apply-council-tax-reduction.",
    processingTime: "Up to 4 weeks. Urgent cases may be processed faster.",
    fee: "No fee",
    disclaimer: "Council Tax Reduction schemes vary by local authority. QueueCutter helps you prepare your application. Contact your local council to confirm current eligibility rules.",
  },
  {
    id: "proof-of-address-gb",
    countryCode: "GB",
    name: "Proof of Address Letter for Benefits",
    officialName: "Confirmation of Address / Proof of Residency Letter for DWP / Benefits",
    shortDescription: "Prepare a formal proof of address letter required by DWP or your local benefits office.",
    longDescription:
      "When applying for Universal Credit, housing benefit, or other DWP payments, you often need to submit a formal proof of address letter. This guided form helps you prepare that letter and understand exactly what documentation the DWP requires to accept it.",
    whoItIsFor: "Anyone applying for UK benefits who needs to formally confirm their residential address",
    category: "Identity & Residence",
    submissionMethod: "walk-in or online",
    requiredDocuments: [
      "National Insurance (NI) number",
      "Passport or UK driving licence (primary photo ID)",
      "Utility bill, bank statement, or council tax bill dated within 3 months",
      "Tenancy agreement (if renting — helps confirm address)",
      "GP registration letter (if recently moved and utilities not set up yet)",
    ],
    commonRejectionReasons: [
      "Proof of address document is older than 3 months",
      "Name on the utility bill or bank statement does not match the applicant's name",
      "Using a PO Box or care-of address",
      "Document is a mobile phone bill (generally not accepted)",
      "Photocopied documents not certified",
    ],
    questions: [
      { id: "full_name", text: "What is your full name?", hint: "Must match the name on your ID exactly.", type: "text", required: true, fieldMapping: "full_name", officialLabel: "Full Name" },
      { id: "date_of_birth", text: "What is your date of birth?", type: "date", required: true, fieldMapping: "date_of_birth", officialLabel: "Date of Birth" },
      { id: "ni_number", text: "What is your National Insurance number?", hint: "Example: AB123456C", type: "text", required: true, fieldMapping: "ni_number", officialLabel: "National Insurance Number", validationPattern: "^[A-Z]{2}\\d{6}[A-Z]$" },
      { id: "current_address", text: "What is your current full home address (including postcode)?", type: "textarea", required: true, fieldMapping: "current_address", officialLabel: "Current Residential Address" },
      { id: "date_moved_in", text: "When did you move to this address?", hint: "If you are unsure, enter an approximate date.", type: "date", required: true, fieldMapping: "date_moved_in", officialLabel: "Date of Moving In" },
      { id: "benefit_type", text: "Which benefit are you applying for or providing proof for?", type: "radio", options: ["Universal Credit", "Housing Benefit", "Jobseeker's Allowance (JSA)", "Employment and Support Allowance (ESA)", "Personal Independence Payment (PIP)", "Other"], required: true, fieldMapping: "benefit_type", officialLabel: "Benefit Being Applied For" },
      { id: "proof_doc_type", text: "What document do you have to prove your address?", hint: "Must be dated within the last 3 months and show your name and address.", type: "radio", options: ["Utility bill (gas, electric, water)", "Bank or building society statement", "Council Tax bill", "Tenancy agreement", "NHS / GP registration letter", "Other official letter"], required: true, fieldMapping: "proof_doc_type", officialLabel: "Proof of Address Document Type" },
      { id: "phone", text: "What is your phone number?", type: "text", required: false, fieldMapping: "phone", officialLabel: "Phone Number" },
    ],
    submissionOffice: "DWP (Department for Work and Pensions) local Jobcentre Plus, or submitted online via your Universal Credit account at gov.uk",
    processingTime: "Proof letters are reviewed within 5–10 working days of submission.",
    fee: "No fee",
    disclaimer: "This tool helps you prepare documents for UK benefit applications. QueueCutter is not affiliated with the DWP or any UK government body. Always verify current requirements at gov.uk.",
  },

  // ─────────── Keep Change of Address ───────────
  {
    id: "change-of-address",
    countryCode: "US",
    name: "Change of Address Request",
    officialName: "USPS-Style Change of Address / Voter Registration Address Update",
    shortDescription: "Update your mailing address with postal and voter registration authorities.",
    longDescription:
      "Moving? This guided form helps you prepare the paperwork to update your address with USPS for mail forwarding and with your local election office to keep your voter registration current.",
    whoItIsFor: "Anyone who has moved or is planning to move to a new address",
    category: "Address Change",
    submissionMethod: "walk-in or online",
    requiredDocuments: [
      "Government-issued photo ID showing your old or new address",
      "Proof of new address (utility bill, lease/rental agreement, or bank statement)",
      "Your current voter registration card (if updating voter registration)",
    ],
    commonRejectionReasons: [
      "Old and new address are the same",
      "Missing photo ID",
      "Move date is more than 1 year ago (mail forwarding window expired)",
    ],
    questions: [
      { id: "first_name", text: "What is your first name?", type: "text", required: true, fieldMapping: "first_name", officialLabel: "First Name" },
      { id: "middle_name", text: "What is your middle name or initial? (Optional)", type: "text", required: false, fieldMapping: "middle_name", officialLabel: "Middle Name / Initial" },
      { id: "last_name", text: "What is your last name?", type: "text", required: true, fieldMapping: "last_name", officialLabel: "Last Name" },
      { id: "move_type", text: "Is this address change for just you, or for your entire household?", type: "radio", options: ["Just me (individual)", "My entire household (family)"], required: true, fieldMapping: "move_type", officialLabel: "Type of Move" },
      { id: "old_street", text: "What is your current (old) street address?", hint: "Include apartment or unit number.", type: "text", required: true, fieldMapping: "old_address_street", officialLabel: "Old Street Address" },
      { id: "old_city", text: "What city is your old address in?", type: "text", required: true, fieldMapping: "old_address_city", officialLabel: "Old City" },
      { id: "old_state", text: "What state is your old address in?", type: "select", options: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"], required: true, fieldMapping: "old_address_state", officialLabel: "Old State" },
      { id: "old_zip", text: "What is your old ZIP code?", type: "text", required: true, fieldMapping: "old_address_zip", officialLabel: "Old ZIP Code", validationPattern: "^\\d{5}(-\\d{4})?$" },
      { id: "new_street", text: "What is your new street address?", hint: "Include apartment or unit number.", type: "text", required: true, fieldMapping: "new_address_street", officialLabel: "New Street Address" },
      { id: "new_city", text: "What city is your new address in?", type: "text", required: true, fieldMapping: "new_address_city", officialLabel: "New City" },
      { id: "new_state", text: "What state is your new address in?", type: "select", options: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"], required: true, fieldMapping: "new_address_state", officialLabel: "New State" },
      { id: "new_zip", text: "What is your new ZIP code?", type: "text", required: true, fieldMapping: "new_address_zip", officialLabel: "New ZIP Code", validationPattern: "^\\d{5}(-\\d{4})?$" },
      { id: "effective_date", text: "When did you (or when will you) move to the new address?", type: "date", required: true, fieldMapping: "effective_date", officialLabel: "Effective Date of Move" },
      { id: "update_voter", text: "Would you also like to update your voter registration address?", type: "yesno", required: true, fieldMapping: "update_voter_registration", officialLabel: "Update Voter Registration" },
      { id: "date_of_birth", text: "What is your date of birth?", hint: "Required for voter registration update.", type: "date", required: false, fieldMapping: "date_of_birth", officialLabel: "Date of Birth", conditionalOn: { questionId: "update_voter", value: "yes" } },
    ],
    submissionOffice: "Local post office (USPS) for mail forwarding; County Clerk / Board of Elections for voter registration update",
    processingTime: "Mail forwarding starts within 7-10 business days; Voter registration update within 2-4 weeks",
    fee: "USPS Online Change of Address: $1.10 identity verification fee; In-person at post office: Free",
    disclaimer: "This tool helps you prepare your change of address paperwork but is not an official filing system. QueueCutter is not affiliated with USPS or any election authority.",
  },
];

export const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", description: "Federal and state government forms" },
  { code: "IN", name: "India", flag: "🇮🇳", description: "State and central government certificates" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", description: "DWP, council, and benefits forms" },
];

export function getFormById(id: string): FormSchema | undefined {
  return FORMS.find((f) => f.id === id);
}

export function getFormsByCountry(countryCode: string): FormSchema[] {
  return FORMS.filter((f) => f.countryCode === countryCode);
}

export function getCountryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}
