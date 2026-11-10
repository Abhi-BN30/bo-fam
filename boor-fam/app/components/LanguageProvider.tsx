"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "te";

const translations: Record<string, string> = {
  "Our history, our legacy. Connect with the roots and branches of our family.": "మన చరిత్ర, మన వారసత్వం. మన కుటుంబ మూలాలు మరియు తరాలతో అనుసంధానం అవ్వండి.",
  "Access Portal": "పోర్టల్‌లోకి వెళ్లండి", "Join the Tree": "కుటుంబ వృక్షంలో చేరండి",
  "Family Portal": "కుటుంబ పోర్టల్", "Welcome back! Please enter your details.": "తిరిగి స్వాగతం! దయచేసి మీ వివరాలను నమోదు చేయండి.",
  "New to the family?": "కుటుంబానికి కొత్తగా వచ్చారా?", "Register here": "ఇక్కడ నమోదు చేసుకోండి",
  "Create Your Profile": "మీ ప్రొఫైల్ సృష్టించండి", "Join the digital home of the Boorlagadda family.": "బూర్లగడ్డ కుటుంబ డిజిటల్ ఇంటిలో చేరండి.",
  "Full Name": "పూర్తి పేరు", "Contact Number": "సంప్రదింపు నంబర్", "Date of Birth": "పుట్టిన తేదీ", "Primary Email": "ప్రధాన ఈమెయిల్", "Gender": "లింగం", "Select Gender": "లింగాన్ని ఎంచుకోండి", "Select": "ఎంచుకోండి", "Male": "పురుషుడు", "Female": "స్త్రీ", "Others": "ఇతరులు", "Security PIN": "భద్రతా పిన్",
  "Spouse Information": "జీవిత భాగస్వామి వివరాలు", "Location Details": "చిరునామా వివరాలు", "Select Country": "దేశాన్ని ఎంచుకోండి", "Select State": "రాష్ట్రాన్ని ఎంచుకోండి", "Select City": "నగరాన్ని ఎంచుకోండి",
  "The Home": "హోమ్", "Relationship Finder": "బంధుత్వ అన్వేషణ", "Your Generation": "మీ తరం", "Generation": "తరం", "Same Generation": "అదే తరం", "Welcome": "స్వాగతం", "Birthdays in": "ఈ నెల పుట్టినరోజులు:", "Birthdays": "పుట్టినరోజులు", "Anniversaries": "వివాహ వార్షికోత్సవాలు", "Total Family Size": "కుటుంబ సభ్యుల మొత్తం సంఖ్య", "No birthdays this month": "ఈ నెలలో పుట్టినరోజులు లేవు", "No anniversaries this month": "ఈ నెలలో వివాహ వార్షికోత్సవాలు లేవు",
  "Edit Profile": "ప్రొఫైల్ సవరించండి", "Update your information": "మీ వివరాలను నవీకరించండి", "Edit Login PIN": "లాగిన్ పిన్ మార్చండి", "Change your security PIN": "మీ భద్రతా పిన్ మార్చండి", "Notification Preferences": "నోటిఫికేషన్ ప్రాధాన్యతలు", "Birthdays and anniversaries": "పుట్టినరోజులు మరియు వివాహ వార్షికోత్సవాలు", "Logout": "లాగ్ అవుట్", "Sign out of your account": "మీ ఖాతా నుండి నిష్క్రమించండి",
  "Add to Family Tree": "కుటుంబ వృక్షంలో చేర్చండి", "Deceased": "మరణించారు", "No family tree data found yet.": "కుటుంబ వృక్ష సమాచారం ఇంకా అందుబాటులో లేదు.", "Finish Reordering": "క్రమాన్ని ఖరారు చేయండి", "Enable Reordering": "క్రమాన్ని మార్చండి", "Zoom out": "చిన్నదిగా చూడండి", "Zoom in": "పెద్దదిగా చూడండి", "Reset view": "వీక్షణను రీసెట్ చేయండి", "Collapse all": "అన్నింటినీ మూసివేయండి", "Expand all": "అన్నింటినీ విస్తరించండి",
  "Member Search": "కుటుంబ సభ్యుల శోధన", "Search by name, spouse, email or contact": "పేరు, జీవిత భాగస్వామి, ఈమెయిల్ లేదా ఫోన్ ద్వారా వెతకండి", "Select or search a member…": "సభ్యుడిని ఎంచుకోండి లేదా వెతకండి…", "No members found": "సభ్యులు ఎవరూ కనబడలేదు", "All members": "అందరు సభ్యులు", "No results found": "ఫలితాలు కనబడలేదు", "Email": "ఈమెయిల్", "Contact": "ఫోన్ నంబర్", "Address": "చిరునామా", "Lives in": "నివసించే ప్రాంతం", "Anniversary": "వివాహ వార్షికోత్సవం", "Spouse": "జీవిత భాగస్వామి", "Name": "పేరు", "Family Below": "తదుపరి తరాలు", "total descendants": "మొత్తం వారసులు",
  "Family Tambola": "కుటుంబ తంబోలా", "Housie with family member clues — first to a row wins!": "కుటుంబ సభ్యుల ఆధారాలతో హౌసీ — ముందుగా ఒక వరుస పూర్తి చేసినవారు గెలుస్తారు!", "Need at least 15 members with details to play": "ఆడటానికి కనీసం 15 మంది సభ్యుల వివరాలు అవసరం", "Who is this?": "ఇది ఎవరు?", "Press \"Call\" to start the game": "ఆట ప్రారంభించడానికి ‘కాల్’ నొక్కండి", "Your Card — tap to mark": "మీ కార్డు — గుర్తించడానికి నొక్కండి", "Recently Called": "ఇటీవల పిలిచినవి",
  "Notification preferences": "నోటిఫికేషన్ ప్రాధాన్యతలు", "Choose the family reminders you receive.": "మీరు పొందాలనుకునే కుటుంబ రిమైండర్‌లను ఎంచుకోండి.", "Phone notifications": "ఫోన్ నోటిఫికేషన్‌లు", "Allow this device to receive family reminders.": "ఈ పరికరంలో కుటుంబ రిమైండర్‌లను స్వీకరించడానికి అనుమతించండి.", "Enable separately on each phone or computer.": "ప్రతి ఫోన్ లేదా కంప్యూటర్‌లో విడిగా ప్రారంభించండి.", "Reminders for family birthdays": "కుటుంబ సభ్యుల పుట్టినరోజుల రిమైండర్‌లు", "Reminders for couple anniversaries": "దంపతుల వివాహ వార్షికోత్సవ రిమైండర్‌లు", "When should we remind you?": "ఎప్పుడు గుర్తు చేయాలి?", "How early should we remind you?": "ఎన్ని రోజుల ముందుగా గుర్తు చేయాలి?", "On the day only": "ఆ రోజున మాత్రమే", "1 day before and on the day": "ఒక రోజు ముందు మరియు ఆ రోజున", "3 days before and on the day": "మూడు రోజులు ముందు మరియు ఆ రోజున", "7 days before and on the day": "ఏడు రోజులు ముందు మరియు ఆ రోజున", "Test your notifications": "నోటిఫికేషన్‌లను పరీక్షించండి", "Saving…": "సేవ్ అవుతోంది…", "Loading notification settings…": "నోటిఫికేషన్ సెట్టింగ్‌లు లోడ్ అవుతున్నాయి…", "Back to family": "కుటుంబ పేజీకి తిరిగి వెళ్లండి",
  "Add BoorFam to your device": "మీ పరికరంలో BoorFam ను జోడించండి", "Got it": "అర్థమైంది", "Open BoorFam in Chrome": "Chrome లో BoorFam తెరవండి", "Install app": "యాప్‌ను ఇన్‌స్టాల్ చేయండి", "Add to Home Screen": "హోమ్ స్క్రీన్‌కు జోడించండి",
  "Old PIN": "పాత పిన్", "New PIN": "కొత్త పిన్", "Verify your old PIN, then set a new one.": "ముందుగా పాత పిన్‌ను ధృవీకరించి, కొత్త పిన్ సెట్ చేయండి.",
  "Fill in the details to expand our family connections.": "మన కుటుంబ బంధాలను విస్తరించడానికి వివరాలను నమోదు చేయండి.",
  "New Member": "కొత్త సభ్యుడు", "Join the Tree": "కుటుంబ వృక్షంలో చేరండి", "Add to Tree": "వృక్షంలో చేర్చండి", "User already exists": "ఈ సభ్యుడు ఇప్పటికే ఉన్నారు", "Other / Not Listed": "ఇతరులు / జాబితాలో లేరు", "Living In": "నివసించే ప్రాంతం", "Spouse Details": "జీవిత భాగస్వామి వివరాలు", "Spouse Details (Optional)": "జీవిత భాగస్వామి వివరాలు (ఐచ్ఛికం)", "Full Address": "పూర్తి చిరునామా", "Not recorded": "నమోదు చేయలేదు", "Reviewing family member information.": "కుటుంబ సభ్యుల వివరాలను పరిశీలిస్తున్నారు.", "Update information to keep the tree accurate.": "కుటుంబ వృక్షాన్ని ఖచ్చితంగా ఉంచడానికి వివరాలను నవీకరించండి.", "Update information": "వివరాలను నవీకరించండి", "Edit Details": "వివరాలను సవరించండి", "Add User": "సభ్యుడిని చేర్చండి", "Profile View": "ప్రొఫైల్ వీక్షణ", "Profile View": "ప్రొఫైల్ వీక్షణ", "Couple photo & framing": "దంపతుల ఫోటో మరియు అమరిక", "Choose a photo to adjust its card and profile framing.": "కార్డు మరియు ప్రొఫైల్‌లో ఫోటో అమరికను సర్దుబాటు చేయడానికి ఫోటోను ఎంచుకోండి.", "Drag photo freely in any direction": "ఫోటోను ఏ దిశలోనైనా లాగి సర్దుబాటు చేయండి", "Preview frame": "ప్రివ్యూ ఫ్రేమ్", "Profile View": "ప్రొఫైల్ వీక్షణ", "Remove photo": "ఫోటో తొలగించండి", "Delete": "తొలగించండి", "Delete this member?": "ఈ సభ్యుడిని తొలగించాలా?", "Enter deletion PIN to confirm *": "నిర్ధారించడానికి తొలగింపు పిన్ నమోదు చేయండి *", "Save framing": "ఫోటో అమరికను సేవ్ చేయండి", "Saving…": "సేవ్ అవుతోంది…", "Upload photo & save framing": "ఫోటో అప్‌లోడ్ చేసి అమరికను సేవ్ చేయండి", "JPG, PNG or WebP · up to 5 MB": "JPG, PNG లేదా WebP · గరిష్ఠంగా 5 MB", "Contact *": "ఫోన్ నంబర్ *", "Date of Birth *": "పుట్టిన తేదీ *", "Full Name *": "పూర్తి పేరు *", "Gender *": "లింగం *", "Primary Email *": "ప్రధాన ఈమెయిల్ *", "Security PIN *": "భద్రతా పిన్ *",
  "How you're connected": "మీ బంధుత్వం", "Your Relationship": "మీ బంధుత్వం", "You": "మీరు", "generations deep": "తరాల దూరంలో", "child": "సంతానం", "children": "సంతానం", "Select Country": "దేశాన్ని ఎంచుకోండి", "Select State/Province": "రాష్ట్రం / ప్రావిన్స్ ఎంచుకోండి",
  "This app was built for an older version of Android": "ఈ యాప్ పాత Android సంస్కరణ కోసం రూపొందించబడింది", "Open this page in": "ఈ పేజీని ఇందులో తెరవండి", "Tap the": "దీనిని నొక్కండి", "Choose": "ఎంచుకోండి", "Share": "షేర్ చేయండి", "Safari": "Safari", "Google Chrome": "Google Chrome",
  "Send a sample push notification to this device only. It won't affect birthday or anniversary reminders.": "ఈ పరికరానికి మాత్రమే పరీక్ష నోటిఫికేషన్ పంపండి. ఇది పుట్టినరోజు లేదా వివాహ వార్షికోత్సవ రిమైండర్‌లను ప్రభావితం చేయదు.", "Push notifications aren't supported here. Try installing the website on your phone and opening it from its home-screen icon.": "ఇక్కడ పుష్ నోటిఫికేషన్‌లకు మద్దతు లేదు. వెబ్‌సైట్‌ను ఫోన్‌లో ఇన్‌స్టాల్ చేసి హోమ్ స్క్రీన్ ఐకాన్ ద్వారా తెరవండి.", "Your choices apply across your devices. Phone permission is managed separately on each device.": "మీ ఎంపికలు అన్ని పరికరాలకు వర్తిస్తాయి. ఫోన్ అనుమతులు ప్రతి పరికరంలో విడిగా నిర్వహించబడతాయి.", "Enable": "ప్రారంభించండి", "Turn off": "ఆపివేయండి", "Setting up…": "సిద్ధం అవుతోంది…",
  "Family member": "కుటుంబ సభ్యుడు", "Call": "పిలవండి", "Edit": "సవరించండి", "Cancel": "రద్దు చేయండి", "Save": "సేవ్ చేయండి", "Close": "మూసివేయండి", "Search": "శోధించండి", "Back": "వెనక్కి", "Continue": "కొనసాగించండి", "Submit": "సమర్పించండి", "Loading…": "లోడ్ అవుతోంది…", "Optional": "ఐచ్ఛికం", "Required": "తప్పనిసరి",
};

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (value: string) => string }>({
  language: "en", setLanguage: () => {}, t: (value) => value,
});

export function useLanguage() { return useContext(LanguageContext); }

const reverseTranslations = Object.fromEntries(Object.entries(translations).map(([english, telugu]) => [telugu, english]));

function translateText(value: string, language: Language) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const translated = language === "te" ? translations[trimmed] : reverseTranslations[trimmed];
  if (!translated) return value;
  return value.replace(trimmed, translated);
}

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="fixed top-3 right-3 z-[100] flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
      <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${language === "en" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>EN</button>
      <button type="button" onClick={() => setLanguage("te")} aria-pressed={language === "te"} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${language === "te" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>తెలుగు</button>
    </div>
  );
}

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try { localStorage.setItem("boorfam-language", next); } catch {}
  }, []);
  const t = useCallback((value: string) => translateText(value, language), [language]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("boorfam-language");
      if (saved === "te" || saved === "en") setLanguageState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "te" ? "te" : "en";
    document.documentElement.classList.toggle("telugu-language", language === "te");
    // Translate rendered UI text and common form/accessibility attributes. Switching back
    // reverses the same strings; user-entered names and family data are not translated.
    const translateTree = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      nodes.forEach((node) => {
        const original = node.textContent || "";
        const next = translateText(original, language);
        if (next !== original) node.textContent = next;
      });
      if (root instanceof Element && root.matches("input,textarea,button,[title],[aria-label]")) translateAttributes(root);
      root.querySelectorAll?.("input,textarea,button,[title],[aria-label]").forEach((el) => translateAttributes(el as Element));
    };
    const translateAttributes = (el: Element) => {
      ["placeholder", "title", "aria-label", "value"].forEach((key) => {
        const current = el.getAttribute(key);
        if (current) {
          const next = translateText(current, language);
          if (next !== current) el.setAttribute(key, next);
        }
      });
    };
    translateTree(document.body);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "characterData" && record.target instanceof Text) {
          const current = record.target.textContent || "";
          const next = translateText(current, language);
          if (next !== current) record.target.textContent = next;
        }
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) translateTree(node);
          else if (node instanceof Text) {
            const current = node.textContent || "";
            const next = translateText(current, language);
            if (next !== current) node.textContent = next;
          }
        });
      });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={contextValue}><LanguageToggle />{children}</LanguageContext.Provider>;
}
