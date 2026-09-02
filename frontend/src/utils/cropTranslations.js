/**
 * Crop Names with Hindi Translations
 * Provides dual English / Hindi naming across all modules
 */

export const CROP_HINDI_MAP = {
  'Onion': 'प्याज',
  'Wheat': 'गेहूं',
  'Groundnut': 'मूंगफली',
  'Cotton': 'कपास',
  'Tomato': 'टमाटर',
  'Potato': 'आलू',
  'Bajra(Pearl Millet/Cumbu)': 'बाजरा',
  'Bajra': 'बाजरा',
  'Paddy(Dhan)': 'धान / चावल',
  'Paddy': 'धान',
  'Rice': 'चावल',
  'Maize': 'मक्का',
  'Sesamum(Sesame,Gingelly,Til)': 'तिल',
  'Sesame': 'तिल',
  'Til': 'तिल',
  'Castor Seed': 'अरंडी',
  'Coriander(Leaves)': 'हरा धनिया',
  'Corriander Seed': 'धनिया बीज',
  'Coriander': 'धनिया',
  'Cumin Seed(Jeera)': 'जीरा',
  'Cumin': 'जीरा',
  'Jeera': 'जीरा',
  'Mustard': 'सरसों / राई',
  'Soyabean': 'सोयाबीन',
  'Gram(Chana)': 'चना',
  'Gram': 'चना',
  'Chana': 'चना',
  'Moath Dal': 'मोठ दाल',
  'Moong(Green Gram)': 'मूंग दाल',
  'Moong': 'मूंग',
  'Urad': 'उड़द दाल',
  'Tur(Arhar)': 'अरहर / तुअर',
  'Tur': 'तुअर',
  'Banana': 'केला',
  'Brinjal': 'बैंगन',
  'Bhindi(Ladies Finger)': 'भिंडी',
  'Bottle Gourd': 'लौकी',
  'Bitter Gourd': 'करेला',
  'Cabbage': 'पत्तागोभी',
  'Cauliflower': 'फूलगोभी',
  'Green Chilli': 'हरी मिर्च',
  'Chilli': 'लाल/हरी मिर्च',
  'Garlic': 'लहसुन',
  'Ginger(Green)': 'ताजा अदरक',
  'Ginger': 'अदरक',
  'Turmeric': 'हल्दी',
  'Fenugreek(Leaves)': 'हरी मेथी',
  'Methi': 'मेथी',
  'Fennel': 'सौंफ',
  'Guar': 'ग्वार फली',
  'Cluster Beans': 'ग्वार फली',
  'Apple': 'सेब',
  'Mango': 'आम',
  'Lemon': 'नींबू',
  'Water Melon': 'तरबूज',
  'Papaya': 'पपीता',
  'Pomegranate': 'अनार',
  'Sweet Potato': 'शकरकंद',
  'Drumstick': 'सहजन / मोरिंगा',
  'Spinach': 'पालक',
  'Carrot': 'गाजर',
  'Radish': 'मूली',
  'Peas': 'मटर',
  'Green Peas': 'हरी मटर',
  'Pumpkin': 'कद्दू',
  'Capsicum': 'शिमला मिर्च'
};

// Backwards compatibility alias
export const CROP_GUJARATI_MAP = CROP_HINDI_MAP;

/**
 * Returns a bilingual display label like "Onion (प्याज)"
 */
export function getCropDisplayName(cropName) {
  if (!cropName) return '';
  const clean = cropName.trim();
  if (CROP_HINDI_MAP[clean]) {
    return `${clean} (${CROP_HINDI_MAP[clean]})`;
  }
  
  // Partial lookup
  const cleanLower = clean.toLowerCase();
  for (const [key, val] of Object.entries(CROP_HINDI_MAP)) {
    if (cleanLower.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanLower)) {
      return `${clean} (${val})`;
    }
  }
  return clean;
}

/**
 * Returns only the Hindi name or empty string if not found
 */
export function getCropHindiOnly(cropName) {
  if (!cropName) return '';
  const clean = cropName.trim();
  if (CROP_HINDI_MAP[clean]) return CROP_HINDI_MAP[clean];
  const cleanLower = clean.toLowerCase();
  for (const [key, val] of Object.entries(CROP_HINDI_MAP)) {
    if (cleanLower.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanLower)) {
      return val;
    }
  }
  return '';
}

// Backwards compatibility alias
export const getCropGujaratiOnly = getCropHindiOnly;
