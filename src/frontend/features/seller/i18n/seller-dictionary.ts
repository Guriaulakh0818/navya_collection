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
  },
};
