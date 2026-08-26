import { CONSTANTS } from "../constants/constants.js";
import { STORAGE_KEYS } from "../constants/storageKeys.js";
import { openUrl, isUrl } from "../utils/url.js";

 
function getQuickLinks() {
  const raw = localStorage.getItem(STORAGE_KEYS.quickLinks) || "{}";
 
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Corrupted quickLinks data, resetting.", err);
    return { ...CONSTANTS.default_quick_links };
  }
 
  // First run: nothing saved yet, seed with defaults.
  if (Object.keys(parsed).length === 0) {
    return { ...CONSTANTS.default_quick_links };
  }
 
  return parsed;
}
 
function saveQuickLink(keyword, url, description) {
  keyword = (keyword || "").trim().toLowerCase();
  url = (url || "").trim();
  description = (description || "").trim();
 
  if (!keyword || !url) {
    return { status: false, message: "Keyword and URL are required." };
  }

  if (!isUrl(url)) {
    return {
        status: false,
        message: "Please enter a valid URL."
    };
}
 
  const quickLinks = getQuickLinks();
  const isNewKeyword = !quickLinks[keyword];
 
  if (isNewKeyword && Object.keys(quickLinks).length >= CONSTANTS.max_quick_links) {
    return {
      status: false,
      message: `Limit of ${CONSTANTS.max_quick_links} quick links reached. Remove one first.`,
    };
  }
 
  quickLinks[keyword] = { keyword, url, description };
  localStorage.setItem(STORAGE_KEYS.quickLinks, JSON.stringify(quickLinks));
 
  return { status: true, message: "Quick link saved." };
}
 
function updateQuickLink(oldKeyword, { keyword, url, description }) {
  oldKeyword = (oldKeyword || "").trim().toLowerCase();
  const newKeyword = (keyword || oldKeyword).trim().toLowerCase();
 
  const quickLinks = getQuickLinks();
 
  if (!quickLinks[oldKeyword]) {
    return { status: false, message: "No quick link with that keyword." };
  }

  if (newKeyword !== oldKeyword && quickLinks[newKeyword]) {
    return { status: false, message: `"${newKeyword}" is already in use.` };
  }
 
  const existing = quickLinks[oldKeyword];
 
  if (newKeyword !== oldKeyword) {
    delete quickLinks[oldKeyword];
  }
 
  quickLinks[newKeyword] = {
    keyword: newKeyword,
    url: (url || existing.url).trim(),
    description: (description !== undefined ? description : existing.description).trim(),
  };
 
  localStorage.setItem(STORAGE_KEYS.quickLinks, JSON.stringify(quickLinks));
  return { status: true, message: "Quick link updated." };
}

function removeQuickLink(keyword) {
  keyword = (keyword || "").trim().toLowerCase();
  if (!keyword) {
    return { status: false, message: "Keyword is required." };
  }
 
  const quickLinks = getQuickLinks();
 
  if (!quickLinks[keyword]) {
    return { status: false, message: "No quick link with that keyword." };
  }
 
  delete quickLinks[keyword];
  localStorage.setItem(STORAGE_KEYS.quickLinks, JSON.stringify(quickLinks));
 
  return { status: true, message: "Quick link removed." };
}
 
function executeQuickLink(keyword){

  const quickLinks = getQuickLinks();
  let result =  quickLinks[keyword.toLowerCase()];
  console.log("quickLinks:", quickLinks);
  console.log(result);
  if (!result) {
    console.log('not found keyword ')
    return { status: false, message: "No quick link with that keyword." };
  }

  openUrl(result.url);
   return { status: true, message: `Opened ${result.description || result.url}` };



}
export { getQuickLinks, saveQuickLink, removeQuickLink, updateQuickLink, executeQuickLink };
 


