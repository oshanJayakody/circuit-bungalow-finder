"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Curated English/Sinhala dictionary for UI chrome only (nav, buttons,
// headings, forms). Listing content (bungalow names, descriptions, towns)
// stays in its original language because it comes from the database.
// Note: Sinhala strings were written by Muse, not a professional translator.

export type Lang = "en" | "si";

const en = {
  nav_explore: "Explore",
  nav_bungalows: "Government bungalows",
  nav_places: "Places",
  nav_contribute: "Become a contributor",
  login: "Log in",
  signup_suffix: "/ Sign up",
  profile: "Profile",
  admin_link: "Admin",
  logout: "Log out",
  help: "Help",
  back: "Back",
  home_label: "Home",
  hero_kicker: "Stay somewhere with a story",
  hero_title: "Find your quiet corner of Sri Lanka.",
  hero_sub: "Discover welcoming government bungalows, tucked into the island's most beautiful places.",
  hero_cta: "Find a bungalow",
  hero_badge: "A slower way to see the island",
  search_where: "Where",
  search_where_ph: "District, town or bungalow",
  search_department: "Department",
  search_all_departments: "All departments",
  search_button: "Search",
  dest_kicker: "A little inspiration",
  dest_title: "Explore by destination",
  browse_all: "Browse all stays ↗",
  bung_kicker: "Thoughtfully selected",
  bung_title: "Government bungalows",
  bung_sub: "A good place to begin your next journey.",
  explore_map: "Explore the map ↗",
  loading_places: "Finding lovely places…",
  no_results_title: "No approved bungalows found yet",
  no_results_sub: "Try another destination or clear your search.",
  clear_search: "Clear search",
  government_stay: "Government stay",
  view_details: "View bungalow details →",
  showing_many: "Showing {n} bungalows",
  showing_one: "Showing 1 bungalow",
  seen_all: " — you've seen them all",
  load_more: "Load more bungalows",
  loading_more: "Loading more…",
  map_kicker: "Find your way",
  map_title: "A beautiful stay is closer than you think.",
  map_sub: "See approved bungalows across Sri Lanka and find a peaceful base for your travels.",
  open_map: "Open bungalow map ↗",
  contrib_kicker: "Know a special place?",
  contrib_title: "Help someone discover it.",
  contrib_sub: "Share a government bungalow with the community. Listings are reviewed before they go live.",
  become_contributor: "Become a contributor ↗",
  footer_map: "Map",
  footer_contribute: "Contribute",
  footer_account: "Account",
  form_title: "Add a circuit bungalow",
  form_sub: "Share a listing with the community. Submissions are reviewed before they appear in search.",
  f_name: "Bungalow name",
  f_department: "Department",
  f_select_department: "Select a department",
  f_other_department: "Other department…",
  f_enter_department: "Enter department name",
  f_district: "District",
  f_select_district: "Select a district",
  f_town: "Town / area",
  f_select_town: "Select a town / area",
  f_choose_district_first: "Choose a district first",
  f_other_town: "Other town / area…",
  f_enter_town: "Enter town / area",
  f_address: "Address",
  f_description: "Description",
  f_phone: "Contact phone",
  f_booking_url: "Booking URL",
  f_photos: "Photos (up to {n})",
  f_photos_hint: "Optional. Photos are compressed in your browser before upload to save storage.",
  f_max_photos: "You can attach up to {n} photos.",
  f_submit: "Submit bungalow",
  f_submitting: "Submitting…",
  s_signin: "Sign in to suggest a correction.",
  s_intro: "Suggest corrections to the listing. Changes will be visible after an admin approves them.",
  s_send: "Send edit suggestion",
  s_sending: "Sending…",
  f_facebook_url: "Facebook URL",
  f_rooms: "Number of rooms",
  f_guests: "Max guests",
  f_ac: "Air conditioning",
  f_not_specified: "Not specified",
  ac_ac: "AC",
  ac_nonac: "Non-AC",
  ac_mixed: "Mixed (some rooms AC)",
  a_kicker: "Management",
  a_title: "Admin dashboard",
  a_sub: "Review community submissions and track the directory.",
  a_pending: "Awaiting review",
  a_published: "Published bungalows",
  a_contributors: "Contributors",
  a_queue_title: "Contribution queue",
  a_queue_sub: "Approve a listing to make it visible in search and on the map.",
  a_queue_count: "{n} pending · latest 100 shown",
  a_view_details: "View details",
  a_hide_details: "Hide details",
  a_approve: "Approve listing",
  a_approving: "Approving…",
  a_suggest_title: "Edit suggestions",
  a_suggest_sub: "Approved changes are copied onto the live bungalow listing.",
  a_reject: "Reject",
  a_saving: "Saving…",
  a_approve_edits: "Approve edits",
  a_no_submissions: "No submissions yet.",
  a_no_suggestions: "No edit suggestions awaiting review.",
  a_loading: "Loading submissions…",
  a_loading_suggestions: "Loading suggestions…",
  a_submitted_photos: "Submitted photos",
  au_welcome_back: "Welcome back",
  au_welcome_aboard: "Welcome aboard",
  au_login_title: "Sign in to your account",
  au_signup_title: "Create your account",
  au_login_sub: "Pick up where you left off and plan your next stay.",
  au_signup_sub: "Save time planning your next stay across Sri Lanka.",
  au_or_email: "or continue with email",
  au_email: "Email address",
  au_password: "Password",
  au_password_ph: "At least 6 characters",
  au_signin_btn: "Sign in",
  au_signup_btn: "Create account",
  au_wait: "Please wait…",
  au_have_account: "Already have an account?",
  au_new_here: "New to Circuit Bungalow Finder?",
  au_signin_link: "Sign in",
  au_signup_link: "Create an account",
};

export type StringKey = keyof typeof en;

const si: Record<StringKey, string> = {
  nav_explore: "ගවේෂණය",
  nav_bungalows: "රජයේ බංගලා",
  nav_places: "ස්ථාන",
  nav_contribute: "දායකයෙකු වන්න",
  login: "ඇතුළු වන්න",
  signup_suffix: "/ ලියාපදිංචි වන්න",
  profile: "පැතිකඩ",
  admin_link: "පරිපාලක",
  logout: "ඉවත් වන්න",
  help: "උදව්",
  back: "ආපසු",
  home_label: "මුල් පිටුව",
  hero_kicker: "කතාවක් ඇති තැනක නවතින්න",
  hero_title: "ශ්‍රී ලංකාවේ ඔබේ නිස්කලංක කොන සොයාගන්න.",
  hero_sub: "දිවයිනේ ලස්සනම තැන්වල සැඟවුණු ආගන්තුක සත්කාර රජයේ බංගලා සොයාගන්න.",
  hero_cta: "බංගලාවක් සොයන්න",
  hero_badge: "දිවයින නැරඹීමට නිදහස් මඟක්",
  search_where: "කොහෙද",
  search_where_ph: "දිස්ත්‍රික්කය, නගරය හෝ බංගලාව",
  search_department: "දෙපාර්තමේන්තුව",
  search_all_departments: "සියලු දෙපාර්තමේන්තු",
  search_button: "සොයන්න",
  dest_kicker: "ආශ්වාදයක් සඳහා",
  dest_title: "ගමනාන්තය අනුව ගවේෂණය",
  browse_all: "සියලු නවාතැන් බලන්න ↗",
  bung_kicker: "අගේකළ තේරීමක්",
  bung_title: "රජයේ බංගලා",
  bung_sub: "ඔබේ මීළඟ ගමන අරඹන්න හොඳ තැනක්.",
  explore_map: "සිතියම බලන්න ↗",
  loading_places: "ලස්සන තැන් සොයමින්…",
  no_results_title: "අනුමත බංගලා හමු නොවුණි",
  no_results_sub: "වෙනත් ගමනාන්තයක් උත්සාහ කරන්න හෝ සෙවුම හිස් කරන්න.",
  clear_search: "සෙවුම හිස් කරන්න",
  government_stay: "රජයේ නවාතැන",
  view_details: "බංගලා විස්තර බලන්න →",
  showing_many: "බංගලා {n}ක් පෙන්වයි",
  showing_one: "බංගලා 1ක් පෙන්වයි",
  seen_all: " — ඔබ සියල්ල බැලුවා",
  load_more: "තවත් බංගලා පෙන්වන්න",
  loading_more: "තවත් පූරණය වෙමින්…",
  map_kicker: "ඔබේ මඟ සොයාගන්න",
  map_title: "ලස්සන නවාතැනක් ඔබ සිතනවාට වඩා ළඟයි.",
  map_sub: "ශ්‍රී ලංකාව පුරා අනුමත බංගලා දැක ඔබේ ගමන් සඳහා සාමකාමී තැනක් සොයාගන්න.",
  open_map: "බංගලා සිතියම අරින්න ↗",
  contrib_kicker: "විශේෂ තැනක් දන්නවාද?",
  contrib_title: "එය සොයාගන්න කෙනෙකුට උදව් කරන්න.",
  contrib_sub: "ප්‍රජාව සමඟ රජයේ බංගලාවක් බෙදාගන්න. ප්‍රකාශයට පෙර ලැයිස්තු සමාලෝචනය කෙරේ.",
  become_contributor: "දායකයෙකු වන්න ↗",
  footer_map: "සිතියම",
  footer_contribute: "දායක වන්න",
  footer_account: "ගිණුම",
  form_title: "සර්කිට් බංගලාවක් එක් කරන්න",
  form_sub: "ප්‍රජාව සමඟ ලැයිස්තුවක් බෙදාගන්න. සෙවුමේ පෙනීමට පෙර ඉදිරිපත් කිරීම් සමාලෝචනය කෙරේ.",
  f_name: "බංගලාවේ නම",
  f_department: "දෙපාර්තමේන්තුව",
  f_select_department: "දෙපාර්තමේන්තුවක් තෝරන්න",
  f_other_department: "වෙනත් දෙපාර්තමේන්තුවක්…",
  f_enter_department: "දෙපාර්තමේන්තුවේ නම ඇතුළත් කරන්න",
  f_district: "දිස්ත්‍රික්කය",
  f_select_district: "දිස්ත්‍රික්කයක් තෝරන්න",
  f_town: "නගරය / ප්‍රදේශය",
  f_select_town: "නගරයක් / ප්‍රදේශයක් තෝරන්න",
  f_choose_district_first: "පළමුව දිස්ත්‍රික්කයක් තෝරන්න",
  f_other_town: "වෙනත් නගරයක් / ප්‍රදේශයක්…",
  f_enter_town: "නගරය / ප්‍රදේශය ඇතුළත් කරන්න",
  f_address: "ලිපිනය",
  f_description: "විස්තරය",
  f_phone: "සම්බන්ධතා දුරකථනය",
  f_booking_url: "වෙන්කිරීමේ සබැඳිය",
  f_photos: "ඡායාරූප ({n} දක්වා)",
  f_photos_hint: "අත්‍යවශ්‍ය නොවේ. ගබඩාව ඉතිරි කිරීමට ඡායාරූප උඩුගත කිරීමට පෙර ඔබේ බ්‍රවුසරයේදීම කුඩා කෙරේ.",
  f_max_photos: "ඔබට ඡායාරූප {n}ක් දක්වා ඇමිණිය හැක.",
  f_submit: "බංගලාව ඉදිරිපත් කරන්න",
  f_submitting: "ඉදිරිපත් කරමින්…",
  s_signin: "නිවැරදි කිරීමක් යෝජනා කිරීමට ඇතුළු වන්න.",
  s_intro: "ලැයිස්තුවට නිවැරදි කිරීම් යෝජනා කරන්න. පරිපාලකයෙකු අනුමත කළ පසු වෙනස්කම් දිස්වේ.",
  s_send: "සංස්කරණ යෝජනාව යවන්න",
  s_sending: "යවමින්…",
  f_facebook_url: "ෆේස්බුක් සබැඳිය",
  f_rooms: "කාමර ගණන",
  f_guests: "උපරිම අමුත්තන්",
  f_ac: "වායු සමනය",
  f_not_specified: "නිශ්චිත නැත",
  ac_ac: "වායු සමන සහිත",
  ac_nonac: "වායු සමන රහිත",
  ac_mixed: "මිශ්‍ර (සමහර කාමර වායු සමන සහිත)",
  a_kicker: "කළමනාකරණය",
  a_title: "පරිපාලක පුවරුව",
  a_sub: "ප්‍රජා ඉදිරිපත් කිරීම් සමාලෝචනය කර නාමාවලිය නිරීක්ෂණය කරන්න.",
  a_pending: "සමාලෝචනයට ඇති",
  a_published: "ප්‍රකාශිත බංගලා",
  a_contributors: "දායකයින්",
  a_queue_title: "දායකත්ව පෝලිම",
  a_queue_sub: "සෙවුමේ සහ සිතියමේ පෙනීමට ලැයිස්තුවක් අනුමත කරන්න.",
  a_queue_count: "{n} සමාලෝචනයට · නවතම 100 පෙන්වයි",
  a_view_details: "විස්තර බලන්න",
  a_hide_details: "විස්තර සඟවන්න",
  a_approve: "ලැයිස්තුව අනුමත කරන්න",
  a_approving: "අනුමත කරමින්…",
  a_suggest_title: "සංස්කරණ යෝජනා",
  a_suggest_sub: "අනුමත වෙනස්කම් සජීවී බංගලා ලැයිස්තුවට පිටපත් කෙරේ.",
  a_reject: "ප්‍රතික්ෂේප කරන්න",
  a_saving: "සුරකිමින්…",
  a_approve_edits: "සංස්කරණ අනුමත කරන්න",
  a_no_submissions: "තවම ඉදිරිපත් කිරීම් නැත.",
  a_no_suggestions: "සමාලෝචනයට සංස්කරණ යෝජනා නැත.",
  a_loading: "ඉදිරිපත් කිරීම් පූරණය වෙමින්…",
  a_loading_suggestions: "යෝජනා පූරණය වෙමින්…",
  a_submitted_photos: "ඉදිරිපත් කළ ඡායාරූප",
  au_welcome_back: "ආයුබෝවන්",
  au_welcome_aboard: "ආයුබෝවන්",
  au_login_title: "ඔබේ ගිණුමට ඇතුළු වන්න",
  au_signup_title: "ඔබේ ගිණුම සාදන්න",
  au_login_sub: "නතර කළ තැනින් අරඹා ඔබේ මීළඟ නවාතැන සැලසුම් කරන්න.",
  au_signup_sub: "ශ්‍රී ලංකාව පුරා ඔබේ මීළඟ නවාතැන සැලසුම් කිරීමට කාලය ඉතිරි කරන්න.",
  au_or_email: "හෝ ඊමේල් මගින් ඉදිරියට",
  au_email: "ඊමේල් ලිපිනය",
  au_password: "මුරපදය",
  au_password_ph: "අක්ෂර 6කට වැඩි",
  au_signin_btn: "ඇතුළු වන්න",
  au_signup_btn: "ගිණුම සාදන්න",
  au_wait: "මඳක් රැඳී සිටින්න…",
  au_have_account: "දැනටමත් ගිණුමක් තිබේද?",
  au_new_here: "Circuit Bungalow Finder ට අලුත්ද?",
  au_signin_link: "ඇතුළු වන්න",
  au_signup_link: "ගිණුමක් සාදන්න",
};

const dictionaries: Record<Lang, Record<StringKey, string>> = { en, si };
const STORAGE_KEY = "cbf-lang";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "si" || saved === "en") {
        setLangState(saved);
        document.documentElement.lang = saved === "si" ? "si" : "en";
      }
    } catch {
      // localStorage unavailable; stay on English.
    }
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    document.documentElement.lang = next === "si" ? "si" : "en";
  }

  function t(key: StringKey, vars?: Record<string, string | number>) {
    let value = dictionaries[lang][key] ?? en[key];
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-[#dce3dc] dark:border-[#243830] p-1" role="group" aria-label="Language / භාෂාව">
      {(["en", "si"] as Lang[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
            lang === option
              ? "bg-[#244f3d] dark:bg-[#3d7a5c] text-white"
              : "text-[#51655b] dark:text-[#a9bcae] hover:bg-[#f2f3ed] dark:hover:bg-[#1a2620]"
          }`}
        >
          {option === "en" ? "EN" : "සිං"}
        </button>
      ))}
    </div>
  );
}
