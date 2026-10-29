export type SellerLanguage = 'en' | 'hinglish' | 'hi';

export interface LanguageOption {
  id: SellerLanguage;
  label: string;
  subLabel: string;
  flag: string;
}

export const SELLER_LANGUAGES: LanguageOption[] = [
  {
    id: 'hinglish',
    label: 'Hinglish',
    subLabel: 'हिंदी (English Script) - "Product ka naam", "Selling Price"',
    flag: '🇮🇳',
  },
  {
    id: 'hi',
    label: 'हिंदी',
    subLabel: 'आसान बोलचाल - "प्रोडक्ट का नाम", "सेलिंग प्राइस"',
    flag: '🇮🇳',
  },
  {
    id: 'en',
    label: 'English',
    subLabel: 'Standard English - "Product Title", "Selling Price"',
    flag: '🇬🇧',
  },
];

export const SELLER_DICTIONARY = {
  // Navigation Links
  nav: {
    dashboard: {
      en: 'Dashboard',
      hinglish: 'Dashboard (Mukhya Page)',
      hi: 'डैशबोर्ड (मुख्य पेज)',
    },
    analytics: {
      en: 'Sales Analytics',
      hinglish: 'Bikri Hisab-Kitab (Analytics)',
      hi: 'बिक्री का हिसाब-किताब (Analytics)',
    },
    payouts: {
      en: 'Financial Payouts',
      hinglish: 'Kamayi & Bank Payouts',
      hi: 'कमाई और बैंक पेआउट (Payouts)',
    },
    vacation: {
      en: 'Apply Leave (Vacation)',
      hinglish: 'Dukan Chhutti (Vacation Mode)',
      hi: 'दुकान की छुट्टी (Vacation Mode)',
    },
    shop: {
      en: 'Shop Customization',
      hinglish: 'Dukan ki Setting (Shop Profile)',
      hi: 'दुकान की सेटिंग (Shop Profile)',
    },
    products: {
      en: 'Products Catalog',
      hinglish: 'Mere Products (Catalog)',
      hi: 'मेरे प्रोडक्ट्स (Products Catalog)',
    },
    inventory: {
      en: 'Inventory & Stocks',
      hinglish: 'Stock & Maal (Inventory)',
      hi: 'स्टॉक और माल (Inventory)',
    },
    orders: {
      en: 'Vendor Orders',
      hinglish: 'Aaye Hue Orders',
      hi: 'आए हुए ऑर्डर्स (Orders)',
    },
    profile: {
      en: 'Merchant Profile',
      hinglish: 'Seller Profile (Mera Khata)',
      hi: 'सेलर प्रोफाइल (मेरा खाता)',
    },
    settings: {
      en: 'Settings & Bank',
      hinglish: 'Bank Khata & Settings',
      hi: 'बैंक खाता और सेटिंग्स',
    },
    viewStorefront: {
      en: 'View Storefront',
      hinglish: 'Dukan Dekhein',
      hi: 'दुकान देखें',
    },
    addProduct: {
      en: '+ Add Product',
      hinglish: '+ Naya Product Dalein',
      hi: '+ नया प्रोडक्ट जोड़ें',
    },
    signOut: {
      en: 'Sign Out',
      hinglish: 'Log Out Karein',
      hi: 'लॉग आउट करें',
    },
    activeVendor: {
      en: 'ACTIVE VENDOR',
      hinglish: 'ACTIVE SELLER',
      hi: 'एक्टिव सेलर',
    },
  },

  // Language Modal & Switcher
  langModal: {
    title: {
      en: 'Choose Your Preferred Language',
      hinglish: 'Namaste! Apni Pasandida Bhasha Chunein',
      hi: 'नमस्ते! अपनी पसंदीदा भाषा चुनें',
    },
    subtitle: {
      en: 'You can change this anytime from the top header bar.',
      hinglish: 'Aap is bhasha ko upar header se kisi bhi waqt badal sakte hain.',
      hi: 'आप इस भाषा को ऊपर दिए गए बटन से कभी भी बदल सकते हैं।',
    },
    recommended: {
      en: 'Recommended for Indian Sellers',
      hinglish: 'Indian Sellers ke liye Best',
      hi: 'भारतीय सेलर्स के लिए सबसे आसान',
    },
    continueBtn: {
      en: 'Continue / Save',
      hinglish: 'Shuru Karein (Save)',
      hi: 'शुरू करें (सेव करें)',
    },
    tipBanner: {
      en: 'Language updated! You can change it anytime from the top header.',
      hinglish: 'Bhasha badal di gayi hai! Aap upar button se ise kabhi bhi change kar sakte hain.',
      hi: 'भाषा बदल दी गई है! आप ऊपर दिए गए बटन से इसे कभी भी बदल सकते हैं।',
    },
  },

  // Product Form (Upload & Edit)
  form: {
    pageTitleNew: {
      en: 'Add New Product',
      hinglish: 'Naya Product Add Karein',
      hi: 'नया प्रोडक्ट जोड़ें',
    },
    pageTitleEdit: {
      en: 'Edit Product',
      hinglish: 'Product ki Jankari Badlein',
      hi: 'प्रोडक्ट की जानकारी बदलें',
    },
    pageSubtitle: {
      en: 'Fill in product details, pricing, images and stock accurately.',
      hinglish: 'Product ka naam, kimat, photos aur stock sahi se bharein.',
      hi: 'प्रोडक्ट का नाम, कीमत, फोटो और स्टॉक सही से भरें।',
    },

    // Basic Info Section
    sectionBasic: {
      en: 'Basic Information',
      hinglish: 'Product ki Mukhya Jankari',
      hi: 'प्रोडक्ट की मुख्य जानकारी',
    },
    productTitle: {
      en: 'Product Title / Name',
      hinglish: 'Product ka Pura Naam (Title)',
      hi: 'प्रोडक्ट का पूरा नाम (Title)',
    },
    productTitlePlaceholder: {
      en: "e.g. Men's Cotton Slim Fit Full Sleeve Casual Shirt",
      hinglish: 'jaise: Men Cotton Slim Fit Full Sleeve Shirt ya Banarasi Silk Saree',
      hi: 'जैसे: Men Cotton Slim Fit Full Sleeve Shirt या Banarasi Silk Saree',
    },
    productTitleHint: {
      en: 'Include brand, type, color, and key feature for best customer visibility.',
      hinglish:
        'Product ke naam me kapda, rang aur style zaroor likhein taaki customer asani se search kar sake.',
      hi: 'प्रोडक्ट के नाम में कपड़ा, रंग और स्टाइल ज़रूर लिखें ताकि ग्राहक आसानी से खोज सकें।',
    },

    // Category & Gender
    category: {
      en: 'Category',
      hinglish: 'Category (Kis Category me aata hai)',
      hi: 'कैटेगरी (किस कैटेगरी में आता है)',
    },
    categoryPlaceholder: {
      en: 'Select Category',
      hinglish: 'Category chunein (Shirts, Jeans, Sarees, Kurti, etc.)',
      hi: 'कैटेगरी चुनें (Shirts, Jeans, Sarees, Kurti, आदि)',
    },
    gender: {
      en: 'Target Gender / Department',
      hinglish: 'Yeh Kiske Liye Hai? (Men, Women, Kids)',
      hi: 'यह किसके लिए है? (Men, Women, Kids)',
    },
    genderMen: {
      en: "Men's Fashion",
      hinglish: "Men's (Purushon ke liye)",
      hi: 'पुरुषों के कपड़े (Men)',
    },
    genderWomen: {
      en: "Women's Fashion",
      hinglish: "Women's (Mahilaon ke liye)",
      hi: 'महिलाओं के कपड़े (Women)',
    },
    genderKids: {
      en: 'Kids & Baby Wear',
      hinglish: 'Kids & Baby (Bachhon ke liye)',
      hi: 'बच्चों के कपड़े (Kids & Baby)',
    },
    genderUnisex: {
      en: 'Unisex',
      hinglish: 'Unisex (Sabhi ke liye)',
      hi: 'यूनिसेक्स (सभी के लिए)',
    },

    // Pricing Section
    sectionPricing: {
      en: 'Pricing & Costing',
      hinglish: 'Kimat & Munafa (Pricing)',
      hi: 'कीमत और मुनाफा (Pricing)',
    },
    sellingPrice: {
      en: 'Selling Price (₹)',
      hinglish: 'Selling Price / Bikri Kimat (₹)',
      hi: 'सेलिंग प्राइस / बिक्री की कीमत (₹)',
    },
    sellingPriceHint: {
      en: 'The actual price customer will pay at checkout.',
      hinglish: 'Jis rate par customer website par khareedega.',
      hi: 'जिस रेट पर ग्राहक वेबसाइट पर खरीदेगा।',
    },
    comparePrice: {
      en: 'Compare at Price / MRP (₹)',
      hinglish: 'Asli MRP / Compare Price (₹)',
      hi: 'असली MRP / डिस्काउंट से पहले का भाव (₹)',
    },
    comparePriceHint: {
      en: 'Original MRP. Must be higher than selling price to show discount cut-off.',
      hinglish: 'Original MRP jo cut hokar dikhegi taaki customer ko discount dikhe.',
      hi: 'ओरिजिनल MRP जो कट कर दिखेगी ताकि ग्राहक को डिस्काउंट दिखे।',
    },
    costPrice: {
      en: 'Cost Price (₹) - Private',
      hinglish: 'Aapki Khareed / Laagat Kimat (₹) - Secret',
      hi: 'आपकी खरीद / लागत कीमत (₹) - गुप्त',
    },
    costPriceHint: {
      en: 'Only visible to you. Used to calculate your net profit margins.',
      hinglish: 'Yeh kimat customer ko nahi dikhegi, sirf aapke munafey ke hisaab ke liye hai.',
      hi: 'यह कीमत ग्राहक को नहीं दिखेगी, सिर्फ आपके मुनाफे के हिसाब के लिए है।',
    },

    // Stock & Inventory Section
    sectionInventory: {
      en: 'Inventory & SKU',
      hinglish: 'Stock & Item Code (Inventory)',
      hi: 'स्टॉक और आइटम कोड (Inventory)',
    },
    stock: {
      en: 'Available Stock Quantity',
      hinglish: 'Kul Stock (Dukan me kitne piece tayyar hain)',
      hi: 'कुल स्टॉक (दुकान/गोदाम में कितने पीस उपलब्ध हैं)',
    },
    stockHint: {
      en: 'When stock reaches 0, the item will be marked out-of-stock automatically.',
      hinglish: 'Stock 0 hone par product apne aap out-of-stock ho jayega.',
      hi: 'स्टॉक 0 होने पर प्रोडक्ट अपने आप आउट-ऑफ़-स्टॉक हो जाएगा।',
    },
    sku: {
      en: 'SKU / Barcode (Optional)',
      hinglish: 'SKU / Item Code / Barcode (Optional)',
      hi: 'SKU / आइटम कोड / बारकोड (वैकल्पिक)',
    },
    skuPlaceholder: {
      en: 'e.g. NVC-SHIRT-001',
      hinglish: 'jaise: SHOP-SHIRT-01 ya aapka dukan code',
      hi: 'जैसे: SHOP-SHIRT-01 या आपका दुकान कोड',
    },
    skuHint: {
      en: 'Unique inventory tracking code for your store internal use.',
      hinglish: 'Aapki dukan me maal pehchanne ka code ya tag number.',
      hi: 'आपकी दुकान में माल पहचानने का कोड या टैग नंबर।',
    },

    // Shipping Section
    sectionShippingTitle: {
      en: 'Section 4: Shipping & Packaging Specifications',
      hinglish: 'Section 4: Delivery & Packing Jankari (Shipping)',
      hi: 'सेक्शन 4: डिलीवरी व पैकेजिंग जानकारी (Shipping)',
    },
    sectionShippingSubtitle: {
      en: 'Physical package dead weight and dimensions used for courier rate estimation.',
      hinglish: 'Courier aur delivery ke hisaab ke liye packet ka wajan aur size bharein.',
      hi: 'कूरियर और डिलीवरी के हिसाब के लिए पैकेट का वज़न और साइज़ भरें।',
    },
    deadWeight: {
      en: 'Dead Weight (Grams)',
      hinglish: 'Packet ka Wajan (Grams me)',
      hi: 'पैकेट का वज़न (Grams में)',
    },
    packageLength: {
      en: 'Package Length (cm)',
      hinglish: 'Packet ki Lambai (Length cm)',
      hi: 'पैकेट की लंबाई (cm)',
    },
    packageWidth: {
      en: 'Package Width (cm)',
      hinglish: 'Packet ki Choudai (Width cm)',
      hi: 'पैकेट की चौड़ाई (cm)',
    },
    packageHeight: {
      en: 'Package Height (cm)',
      hinglish: 'Packet ki Unchai (Height cm)',
      hi: 'पैकेट की ऊंचाई (cm)',
    },
    countryOfOrigin: {
      en: 'Country of Origin',
      hinglish: 'Kis Desh me Bana Hai (Country of Origin)',
      hi: 'किस देश में बना है (Country of Origin)',
    },
    manufacturerDetails: {
      en: 'Manufacturer / Packer Details',
      hinglish: 'Factory ya Dukan ki Jankari (Manufacturer/Packer)',
      hi: 'फैक्ट्री या दुकान की जानकारी (Manufacturer/Packer)',
    },

    // Return & Replacement Policy
    sectionReturnTitle: {
      en: 'Section 5: Return & Replacement Policy',
      hinglish: 'Section 5: Customer Wapasi / Exchange Niyam (Return Policy)',
      hi: 'सेक्शन 5: ग्राहक वापसी / एक्सचेंज नियम (Return Policy)',
    },
    sectionReturnSubtitle: {
      en: 'Select one of the 3 standardized customer return & replacement options.',
      hinglish: 'Customer ke liye 3 me se koi 1 return/exchange option chunein.',
      hi: 'ग्राहक के लिए 3 में से कोई 1 रिटर्न/एक्सचेंज विकल्प चुनें।',
    },
    returnOptionA: {
      en: 'Return + Replacement',
      hinglish: 'Wapasi aur Exchange Dono Manzoor (Return + Replacement)',
      hi: 'वापसी और एक्सचेंज दोनों मंजूर (Return + Replacement)',
    },
    returnOptionADesc: {
      en: 'Allows customers to request either a full return or a product replacement within eligibility windows.',
      hinglish: 'Customer ko pasand na aane par wapas ya size badalwane ki poori chhoot.',
      hi: 'ग्राहक को पसंद न आने पर वापस करने या साइज़ बदलवाने की पूरी छूट।',
    },
    returnOptionB: {
      en: 'Replacement Only',
      hinglish: 'Sirf Size Exchange Hoga (Replacement Only - Paise wapas nahi)',
      hi: 'सिर्फ साइज़ एक्सचेंज होगा (Replacement Only - पैसे वापस नहीं)',
    },
    returnOptionBDesc: {
      en: 'Defect or size exchange allowed. No monetary returns allowed.',
      hinglish: 'Sirf size chhota/bada hone par piece badla jayega, paise wapas nahi honge.',
      hi: 'सिर्फ साइज़ छोटा/बड़ा होने पर पीस बदला जाएगा, पैसे वापस नहीं होंगे।',
    },
    returnOptionC: {
      en: 'No Returns (Non-Returnable)',
      hinglish: 'Koi Wapasi Nahi (Non-Returnable / Final Sale)',
      hi: 'कोई वापसी नहीं (Non-Returnable / Final Sale)',
    },
    returnOptionCDesc: {
      en: 'Zero return or exchange allowed unless physically damaged during delivery transit.',
      hinglish: 'Delivery ke baad product na wapas hoga na exchange hoga.',
      hi: 'डिलीवरी के बाद प्रोडक्ट न वापस होगा न एक्सचेंज होगा।',
    },

    // Variants (Sizes & Colors)
    sectionVariantsTitle: {
      en: 'Section 6: Product Variant Matrix & Photo Gallery',
      hinglish: 'Section 6: Sizes, Rang aur Photos (Variants & Gallery)',
      hi: 'सेक्शन 6: साइज़, रंग और फोटो (Variants & Gallery)',
    },
    sectionVariantsSubtitle: {
      en: 'Color-first grouped matrix with variant-specific photos and category sizes.',
      hinglish: 'Alag-alag size aur rang ke hisaab se photos aur stock jodein.',
      hi: 'अलग-अलग साइज़ और रंग के हिसाब से फोटो और स्टॉक जोड़ें।',
    },
    variantSingle: {
      en: 'Single Product (No Variants)',
      hinglish: 'Ek hi Size / Ek hi Rang (No Variants)',
      hi: 'एक ही साइज़ / एक ही रंग (No Variants)',
    },
    variantSizeOnly: {
      en: 'Size Only Variants',
      hinglish: 'Alag-alag Sizes (S, M, L, XL...)',
      hi: 'अलग-अलग साइज़ (S, M, L, XL...)',
    },
    variantColorOnly: {
      en: 'Color Only Variants',
      hinglish: 'Alag-alag Rang (Colors Only)',
      hi: 'अलग-अलग रंग (Colors Only)',
    },
    variantBoth: {
      en: 'Color + Size Matrix',
      hinglish: 'Size aur Rang Dono (Color + Size)',
      hi: 'साइज़ और रंग दोनों (Color + Size)',
    },
    step1Sizes: {
      en: 'Step 1: Select Available Sizes',
      hinglish: 'Step 1: Dukan me kon-kon se Sizes available hain chunein',
      hi: 'स्टेप 1: दुकान में कौन-कौन से साइज़ उपलब्ध हैं चुनें',
    },
    step2Colors: {
      en: 'Step 2: Select Product Colors',
      hinglish: 'Step 2: Product ke Rang (Colors) chunein',
      hi: 'स्टेप 2: प्रोडक्ट के रंग (Colors) चुनें',
    },
    addSizeBtn: {
      en: 'Add Size',
      hinglish: '+ Size Jodein',
      hi: '+ साइज़ जोड़ें',
    },
    customSizePlaceholder: {
      en: 'Custom size (e.g. Free Size, Plus 46)',
      hinglish: 'Apna size likhein (jaise: Free Size, 28, 30, 3XL)',
      hi: 'अपना साइज़ लिखें (जैसे: Free Size, 28, 30, 3XL)',
    },
    addColorBtn: {
      en: 'Add Color',
      hinglish: '+ Rang Jodein',
      hi: '+ रंग जोड़ें',
    },

    // Variants (Sizes & Colors)
    sectionVariants: {
      en: 'Variants (Sizes & Colors)',
      hinglish: 'Sizes aur Rang (Variants)',
      hi: 'साइज़ और रंग (Variants)',
    },
    hasVariantsToggle: {
      en: 'This product has multiple sizes or colors',
      hinglish: 'Is product me alag-alag Size ya Color options hain',
      hi: 'इस प्रोडक्ट में अलग-अलग साइज़ या कलर ऑप्शन्स हैं',
    },
    addVariantBtn: {
      en: '+ Add Size / Color Variant',
      hinglish: '+ Naya Size ya Color Jodein',
      hi: '+ नया साइज़ या कलर जोड़ें',
    },
    sizeLabel: {
      en: 'Size',
      hinglish: 'Size (S, M, L, XL, 32, 34)',
      hi: 'साइज़ (S, M, L, XL, 32, 34)',
    },
    colorLabel: {
      en: 'Color',
      hinglish: 'Rang (Color)',
      hi: 'रंग (Color)',
    },
    variantStock: {
      en: 'Stock for this size',
      hinglish: 'Is size me kitne piece hain',
      hi: 'इस साइज़ में कितने पीस हैं',
    },
    variantPrice: {
      en: 'Price for this size (₹)',
      hinglish: 'Is size ki kimat (₹)',
      hi: 'इस साइज़ की कीमत (₹)',
    },

    // Media & Photos
    sectionMedia: {
      en: 'Product Images',
      hinglish: 'Product ki Photos (Tasveerein)',
      hi: 'प्रोडक्ट की फोटो (तस्वीरें)',
    },
    mediaUploadBtn: {
      en: 'Click to Upload Images',
      hinglish: 'Photos Upload Karne ke Liye Click Karein',
      hi: 'फोटो अपलोड करने के लिए क्लिक करें',
    },
    mediaHint: {
      en: 'Upload clear, well-lit photos. First image will be the primary cover photo.',
      hinglish: 'Saaf aur acchi lighting wali photos dalein. Pehli photo main cover photo banegi.',
      hi: 'साफ़ और अच्छी लाइटिंग वाली फोटो डालें। पहली फोटो मुख्य कवर फोटो बनेगी।',
    },

    // Garment Details
    sectionDetails: {
      en: 'Garment & Fabric Details',
      hinglish: 'Kapda & Design ki Jankari',
      hi: 'कपड़ा और डिज़ाइन की जानकारी',
    },
    fabric: {
      en: 'Fabric / Material',
      hinglish: 'Kapda (Fabric / Material)',
      hi: 'कपड़ा (Fabric / Material)',
    },
    fabricPlaceholder: {
      en: 'e.g. 100% Pure Cotton, Banarasi Silk, Georgette, Denim',
      hinglish: 'jaise: Pure Cotton, Silk, Denim, Rayon, Woolen, Chiffon',
      hi: 'जैसे: Pure Cotton, Silk, Denim, Rayon, Woolen, Chiffon',
    },
    occasion: {
      en: 'Occasion / Style',
      hinglish: 'Kab Pehanne ke Liye Hai (Occasion)',
      hi: 'कब पहनने के लिए है (Occasion)',
    },
    occasionPlaceholder: {
      en: 'e.g. Casual Wear, Daily Wear, Party Wear, Wedding, Festive',
      hinglish: 'jaise: Daily Wear, Party Wear, Shadi/Festive, Office Wear',
      hi: 'जैसे: Daily Wear, Party Wear, शादी/त्योहार, Office Wear',
    },
    description: {
      en: 'Product Description',
      hinglish: 'Product ke Baare me Jankari (Description)',
      hi: 'प्रोडक्ट के बारे में जानकारी (Description)',
    },
    descriptionPlaceholder: {
      en: 'Describe your product quality, fit, styling tips and packaging...',
      hinglish:
        'Product ki khasiyat, kapde ki quality aur design ke baare me 2-3 linein likhein...',
      hi: 'प्रोडक्ट की खासियत, कपड़े की क्वालिटी और डिज़ाइन के बारे में 2-3 लाइनें लिखें...',
    },

    // Shipping & Returns
    sectionShipping: {
      en: 'Shipping & Return Policy',
      hinglish: 'Delivery & Wapsi (Return Policy)',
      hi: 'डिलीवरी और वापसी (Return Policy)',
    },
    returnPolicy: {
      en: 'Return & Replacement Facility',
      hinglish: 'Wapasi ya Exchange Suvidha',
      hi: 'वापसी या एक्सचेंज सुविधा',
    },
    returnBoth: {
      en: 'Return and Replacement Allowed',
      hinglish: 'Wapasi aur Exchange dono manzoor hain',
      hi: 'वापसी और एक्सचेंज दोनों मंजूर हैं',
    },
    replacementOnly: {
      en: 'Replacement Only (No cash return)',
      hinglish: 'Sirf Exchange (Size change) hoga, paise wapas nahi',
      hi: 'सिर्फ एक्सचेंज (साइज़ चेंज) होगा, पैसे वापस नहीं',
    },
    noReturn: {
      en: 'No Returns (Non-returnable)',
      hinglish: 'Koi Return Nahi (Non-returnable)',
      hi: 'कोई रिटर्न नहीं (Non-returnable)',
    },

    // Action Buttons
    saveActive: {
      en: 'Publish Product (Make Live)',
      hinglish: 'Product Live Karein (Website par Dikhayein)',
      hi: 'प्रोडक्ट लाइव करें (वेबसाइट पर दिखाएं)',
    },
    saveDraft: {
      en: 'Save as Draft (Private)',
      hinglish: 'Draft me Save Karein (Baad me Live Karein)',
      hi: 'ड्राफ्ट में सेव करें (बाद में लाइव करें)',
    },
    cancel: {
      en: 'Cancel',
      hinglish: 'Cancel Karein',
      hi: 'कैंसिल करें',
    },
    saving: {
      en: 'Saving Product...',
      hinglish: 'Product Save Ho Raha Hai...',
      hi: 'प्रोडक्ट सेव हो रहा है...',
    },
  },

  // Products List & Inventory
  productList: {
    title: {
      en: 'Product Catalog',
      hinglish: 'Mere Products ki List',
      hi: 'मेरे प्रोडक्ट्स की लिस्ट',
    },
    searchPlaceholder: {
      en: 'Search by product name, SKU...',
      hinglish: 'Product ka naam ya SKU likhkar khojein...',
      hi: 'प्रोडक्ट का नाम या SKU लिखकर खोजें...',
    },
    tabAll: {
      en: 'All Products',
      hinglish: 'Sabhi Products',
      hi: 'सभी प्रोडक्ट्स',
    },
    tabActive: {
      en: 'Active / Live',
      hinglish: 'Live Products',
      hi: 'लाइव प्रोडक्ट्स',
    },
    tabDraft: {
      en: 'Drafts',
      hinglish: 'Drafts (Jo Live Nahi Hain)',
      hi: 'ड्राफ्ट्स (जो लाइव नहीं हैं)',
    },
    tabArchived: {
      en: 'Archived',
      hinglish: 'Archived / Purane',
      hi: 'आर्काइव्ड / पुराने',
    },
    edit: {
      en: 'Edit',
      hinglish: 'Badlein (Edit)',
      hi: 'बदलें (Edit)',
    },
    delete: {
      en: 'Delete',
      hinglish: 'Hatayein (Delete)',
      hi: 'हटाएं (Delete)',
    },
    inStock: {
      en: 'In Stock',
      hinglish: 'Stock Me Hai',
      hi: 'स्टॉक में है',
    },
    outOfStock: {
      en: 'Out of Stock',
      hinglish: 'Stock Khatam',
      hi: 'स्टॉक खत्म',
    },
    lowStock: {
      en: 'Low Stock',
      hinglish: 'Kam Stock Bacha Hai',
      hi: 'कम स्टॉक बचा है',
    },
    subtitle: {
      en: 'Manage your boutique products, variants, prices, inventory stock levels, and publication status.',
      hinglish: 'Apni dukan ke products, sizes, kimat aur stock ka hisaab yahan dekhein.',
      hi: 'अपनी दुकान के प्रोडक्ट्स, साइज़, कीमत और स्टॉक का हिसाब यहाँ देखें।',
    },
    thItem: {
      en: 'Product Item',
      hinglish: 'Product / Samaan',
      hi: 'प्रोडक्ट / सामान',
    },
    thSku: {
      en: 'SKU / Category',
      hinglish: 'SKU & Category',
      hi: 'SKU और कैटेगरी',
    },
    thPrice: {
      en: 'Selling Price',
      hinglish: 'Bikri Kimat (Price)',
      hi: 'बिक्री कीमत (Price)',
    },
    thStock: {
      en: 'Inventory Stock',
      hinglish: 'Kul Stock (Pieces)',
      hi: 'कुल स्टॉक (Pieces)',
    },
    thReturn: {
      en: 'Return Policy',
      hinglish: 'Wapasi Suvidha',
      hi: 'वापसी सुविधा',
    },
    thStatus: {
      en: 'Status',
      hinglish: 'Status (Haal)',
      hi: 'स्थिति (Status)',
    },
    thActions: {
      en: 'Actions',
      hinglish: 'Actions / Badlav',
      hi: 'कार्रवाई (Actions)',
    },
    searchBtn: {
      en: 'Search',
      hinglish: 'Khojein',
      hi: 'खोजें',
    },
    noProducts: {
      en: 'No products found in this category.',
      hinglish: 'Is category me koi product nahi mila.',
      hi: 'इस कैटेगरी में कोई प्रोडक्ट नहीं मिला।',
    },
    noProductsHint: {
      en: 'Click "Add New Product" to create your boutique listing.',
      hinglish: 'Naya product dalne ke liye "+ Naya Product Dalein" button par click karein.',
      hi: 'नया प्रोडक्ट डालने के लिए "+ नया प्रोडक्ट जोड़ें" बटन पर क्लिक करें।',
    },
  },

  // Inventory & Stock Specific
  inventory: {
    totalListings: {
      en: 'Total Listings',
      hinglish: 'Kul Products (Listings)',
      hi: 'कुल प्रोडक्ट्स (Listings)',
    },
    subtitle: {
      en: 'Easily increase or decrease live stock quantities, archive off-season products, or delete unwanted listings in 1 click.',
      hinglish: 'Dukan ka stock asani se kam ya jyada karein, ya purane product hatayein.',
      hi: 'दुकान का स्टॉक आसानी से कम या ज्यादा करें, या पुराने प्रोडक्ट हटाएं।',
    },
    refreshBtn: {
      en: 'Refresh',
      hinglish: 'Refresh Karein',
      hi: 'रिफ्रेश करें',
    },
  },
};
