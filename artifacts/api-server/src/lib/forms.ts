export interface FormQuestion {
  id: string;
  text: string;
  hint?: string;
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
  name: string;
  officialName: string;
  shortDescription: string;
  longDescription: string;
  whoItIsFor: string;
  category: string;
  requiredDocuments: string[];
  questions: FormQuestion[];
  submissionOffice: string;
  processingTime: string;
  fee: string;
  disclaimer: string;
}

export const FORMS: FormSchema[] = [
  {
    id: "snap-benefits",
    name: "SNAP Benefits Application",
    officialName: "Application for Supplemental Nutrition Assistance Program (SNAP)",
    shortDescription: "Apply for monthly food assistance benefits for your household.",
    longDescription:
      "SNAP provides monthly benefits to help low-income households buy the food they need for good health. This guided form helps you prepare your application with the correct information before submitting to your local SNAP office.",
    whoItIsFor: "Low-income individuals and families needing food assistance",
    category: "Food Assistance",
    requiredDocuments: [
      "Government-issued photo ID (driver's license, state ID, or passport)",
      "Proof of address (utility bill, lease agreement, or mail with your name)",
      "Social Security card or ITIN for all household members",
      "Proof of income (pay stubs, employer letter, or benefit award letters)",
      "Proof of expenses (rent/mortgage receipt, utility bills, childcare costs)",
      "Bank account statements for all accounts (last 30 days)",
    ],
    questions: [
      {
        id: "first_name",
        text: "What is your first name?",
        hint: "Enter your legal first name as it appears on your ID.",
        type: "text",
        required: true,
        fieldMapping: "applicant_first_name",
        officialLabel: "Applicant First Name",
      },
      {
        id: "last_name",
        text: "What is your last name?",
        hint: "Enter your legal last name as it appears on your ID.",
        type: "text",
        required: true,
        fieldMapping: "applicant_last_name",
        officialLabel: "Applicant Last Name",
      },
      {
        id: "date_of_birth",
        text: "What is your date of birth?",
        hint: "Enter your birth date in MM/DD/YYYY format.",
        type: "date",
        required: true,
        fieldMapping: "applicant_dob",
        officialLabel: "Date of Birth",
        validationPattern: "^(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/(19|20)\\d{2}$",
      },
      {
        id: "ssn",
        text: "What is your Social Security Number (SSN) or ITIN?",
        hint: "Enter your 9-digit SSN without dashes, or your ITIN. This is required for identity verification.",
        type: "text",
        required: true,
        fieldMapping: "applicant_ssn",
        officialLabel: "Social Security Number / ITIN",
        validationPattern: "^\\d{9}$",
      },
      {
        id: "street_address",
        text: "What is your current home address?",
        hint: "Include apartment or unit number if applicable.",
        type: "text",
        required: true,
        fieldMapping: "address_street",
        officialLabel: "Street Address",
      },
      {
        id: "city",
        text: "What city do you live in?",
        type: "text",
        required: true,
        fieldMapping: "address_city",
        officialLabel: "City",
      },
      {
        id: "state",
        text: "What state do you live in?",
        type: "select",
        options: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"],
        required: true,
        fieldMapping: "address_state",
        officialLabel: "State",
      },
      {
        id: "zip_code",
        text: "What is your ZIP code?",
        type: "text",
        required: true,
        fieldMapping: "address_zip",
        officialLabel: "ZIP Code",
        validationPattern: "^\\d{5}(-\\d{4})?$",
      },
      {
        id: "household_size",
        text: "How many people live in your household, including yourself?",
        hint: "Include everyone you buy and prepare food with, even if they are not applying for SNAP.",
        type: "number",
        required: true,
        fieldMapping: "household_size",
        officialLabel: "Household Size",
      },
      {
        id: "monthly_income",
        text: "What is your household's total monthly income before taxes?",
        hint: "Include wages, salaries, tips, Social Security, disability payments, child support, and any other regular income. Enter 0 if no income.",
        type: "number",
        required: true,
        fieldMapping: "monthly_gross_income",
        officialLabel: "Monthly Gross Income ($)",
      },
      {
        id: "has_assets",
        text: "Do you or anyone in your household have bank accounts, stocks, or bonds worth more than $2,750 total?",
        hint: "This amount is higher ($4,250) if someone in the household is 60+ or has a disability.",
        type: "yesno",
        required: true,
        fieldMapping: "has_countable_assets",
        officialLabel: "Countable Assets Exceeds Limit",
      },
      {
        id: "monthly_rent",
        text: "How much do you pay each month for rent or mortgage?",
        hint: "Enter 0 if you do not pay rent or mortgage.",
        type: "number",
        required: false,
        fieldMapping: "monthly_shelter_cost",
        officialLabel: "Monthly Shelter Cost ($)",
      },
      {
        id: "citizenship",
        text: "Are you a U.S. citizen or a qualified non-citizen?",
        hint: "Qualified non-citizens include lawful permanent residents, refugees, asylees, and others with certain immigration statuses.",
        type: "radio",
        options: ["U.S. Citizen", "Qualified Non-Citizen", "Neither"],
        required: true,
        fieldMapping: "citizenship_status",
        officialLabel: "Citizenship / Immigration Status",
      },
      {
        id: "phone",
        text: "What is your phone number?",
        hint: "We will use this if your caseworker needs to contact you.",
        type: "text",
        required: false,
        fieldMapping: "contact_phone",
        officialLabel: "Phone Number",
        validationPattern: "^\\d{10}$",
      },
      {
        id: "email",
        text: "What is your email address? (Optional)",
        hint: "Providing an email allows you to receive updates electronically.",
        type: "text",
        required: false,
        fieldMapping: "contact_email",
        officialLabel: "Email Address",
      },
    ],
    submissionOffice: "Your local SNAP/DHHS office or online at your state's benefits portal",
    processingTime: "30 days from date of application (7 days for expedited processing if eligible)",
    fee: "No fee",
    disclaimer:
      "This tool helps you prepare your SNAP application but is not an official filing system. QueueCutter is not affiliated with any government agency. Benefits eligibility is determined by your state agency after reviewing your official application.",
  },
  {
    id: "change-of-address",
    name: "Change of Address Request",
    officialName: "USPS-Style Change of Address / Voter Registration Address Update",
    shortDescription: "Update your mailing address with postal and voter registration authorities.",
    longDescription:
      "Moving? This guided form helps you prepare the paperwork to update your address with USPS for mail forwarding and with your local election office to keep your voter registration current. Completing both ensures you receive important mail and remain an active registered voter.",
    whoItIsFor: "Anyone who has moved or is planning to move to a new address",
    category: "Address Change",
    requiredDocuments: [
      "Government-issued photo ID showing your old or new address",
      "Proof of new address (utility bill, lease/rental agreement, or bank statement)",
      "Your current voter registration card (if updating voter registration)",
    ],
    questions: [
      {
        id: "first_name",
        text: "What is your first name?",
        type: "text",
        required: true,
        fieldMapping: "first_name",
        officialLabel: "First Name",
      },
      {
        id: "middle_name",
        text: "What is your middle name or initial? (Optional)",
        type: "text",
        required: false,
        fieldMapping: "middle_name",
        officialLabel: "Middle Name / Initial",
      },
      {
        id: "last_name",
        text: "What is your last name?",
        type: "text",
        required: true,
        fieldMapping: "last_name",
        officialLabel: "Last Name",
      },
      {
        id: "move_type",
        text: "Is this address change for just you, or for your entire household?",
        type: "radio",
        options: ["Just me (individual)", "My entire household (family)"],
        required: true,
        fieldMapping: "move_type",
        officialLabel: "Type of Move",
      },
      {
        id: "old_street",
        text: "What is your current (old) street address?",
        hint: "Include apartment or unit number.",
        type: "text",
        required: true,
        fieldMapping: "old_address_street",
        officialLabel: "Old Street Address",
      },
      {
        id: "old_city",
        text: "What city is your old address in?",
        type: "text",
        required: true,
        fieldMapping: "old_address_city",
        officialLabel: "Old City",
      },
      {
        id: "old_state",
        text: "What state is your old address in?",
        type: "select",
        options: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"],
        required: true,
        fieldMapping: "old_address_state",
        officialLabel: "Old State",
      },
      {
        id: "old_zip",
        text: "What is your old ZIP code?",
        type: "text",
        required: true,
        fieldMapping: "old_address_zip",
        officialLabel: "Old ZIP Code",
        validationPattern: "^\\d{5}(-\\d{4})?$",
      },
      {
        id: "new_street",
        text: "What is your new street address?",
        hint: "Include apartment or unit number.",
        type: "text",
        required: true,
        fieldMapping: "new_address_street",
        officialLabel: "New Street Address",
      },
      {
        id: "new_city",
        text: "What city is your new address in?",
        type: "text",
        required: true,
        fieldMapping: "new_address_city",
        officialLabel: "New City",
      },
      {
        id: "new_state",
        text: "What state is your new address in?",
        type: "select",
        options: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"],
        required: true,
        fieldMapping: "new_address_state",
        officialLabel: "New State",
      },
      {
        id: "new_zip",
        text: "What is your new ZIP code?",
        type: "text",
        required: true,
        fieldMapping: "new_address_zip",
        officialLabel: "New ZIP Code",
        validationPattern: "^\\d{5}(-\\d{4})?$",
      },
      {
        id: "effective_date",
        text: "When did you (or when will you) move to the new address?",
        hint: "Enter the date in MM/DD/YYYY format.",
        type: "date",
        required: true,
        fieldMapping: "effective_date",
        officialLabel: "Effective Date of Move",
        validationPattern: "^(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/(19|20)\\d{2}$",
      },
      {
        id: "update_voter",
        text: "Would you also like to update your voter registration address?",
        hint: "Keeping your voter registration current ensures you receive the correct ballot.",
        type: "yesno",
        required: true,
        fieldMapping: "update_voter_registration",
        officialLabel: "Update Voter Registration",
      },
      {
        id: "date_of_birth",
        text: "What is your date of birth?",
        hint: "Required for voter registration update.",
        type: "date",
        required: false,
        fieldMapping: "date_of_birth",
        officialLabel: "Date of Birth",
        conditionalOn: { questionId: "update_voter", value: "yes" },
        validationPattern: "^(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/(19|20)\\d{2}$",
      },
    ],
    submissionOffice: "Local post office (USPS) for mail forwarding; County Clerk / Board of Elections for voter registration update",
    processingTime: "Mail forwarding starts within 7-10 business days; Voter registration update within 2-4 weeks",
    fee: "USPS Online Change of Address: $1.10 identity verification fee; In-person at post office: Free",
    disclaimer:
      "This tool helps you prepare your change of address paperwork but is not an official filing system. QueueCutter is not affiliated with USPS, any election authority, or government agency. Always verify requirements with your local post office and election office.",
  },
];

export function getFormById(id: string): FormSchema | undefined {
  return FORMS.find((f) => f.id === id);
}
