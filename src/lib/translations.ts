export type Locale = 'en' | 'ar'

type TranslationMap = Record<string, string>

const en: TranslationMap = {
  // ─── Nav ───
  'nav.home': 'Home',
  'nav.shopByOccasion': 'Shop by Occasion',
  'nav.shopByCategory': 'Shop by Category',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.search': 'Search',
  'nav.go': 'Go',
  'nav.cancel': 'Cancel',
  'nav.searchPlaceholder': 'Search products...',
  'nav.followGather': 'Follow Gather',

  // ─── Footer ───
  'footer.tagline': 'Everything your gathering needs.',
  'footer.quickLinks': 'Quick links',
  'footer.home': 'Home',
  'footer.myAccount': 'My account',
  'footer.usefulLinks': 'Useful links',
  'footer.shopByOccasion': 'Shop by occasion',
  'footer.shopByCategory': 'Shop by category',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.refundReturns': 'Refund and Returns Policy',
  'footer.contactInfo': 'Contact info',
  'footer.copyright': '© 2026 Gather. All rights reserved.',
  'footer.poweredBy': 'Powered by',

  // ─── Hero ───
  'hero.brandLine': 'Gather',
  'hero.headline': 'Bring Us Together',
  'hero.subtitle': 'Everything your gathering needs.',
  'hero.ctaPrimary': 'Shop Now',
  'hero.ctaSecondary': 'Shop by Occasion',

  // ─── Homepage sections ───
  'home.shopByCategory': 'Shop by Category',
  'home.shopByCategorySub': 'Everything your gathering needs',
  'home.featuredItems': 'Featured items',
  'home.featuredSub': 'Our most-loved selections',
  'home.shopByOccasion': 'Shop by Occasion',
  'home.shopByOccasionSub': 'Everything you need to make your gathering unforgettable',
  'home.offers': 'Offers & Discounts',
  'home.offersSub': 'make your gathering easier, happier, and better priced.',
  'home.gatherMoments': 'Gather Moments',
  'home.gatherMomentsSub': 'Share your happy moment with GATHER and get a chance to win shopping vouchers for your next celebration.',
  'home.shareMoment': 'Share Your Moment',
  'home.aboutGather': 'About Gather',
  'home.aboutGatherSub': 'Designing joy for every milestone, delivered to your doorstep. Make every second count',
  'home.aboutGatherBody': 'From birthday cakes to balloons, snacks to decorations — order everything you need for any gathering, delivered to your door.',
  'home.aboutUs': 'About us',
  'home.whyGather': 'Why Gather',
  'home.whyGatherSub': 'We make every celebration unforgettable',
  'home.viewAll': 'View all',
  'home.noProducts': 'No products found.',

  // ─── Why Gather cards ───
  'why.premium.title': 'Premium Quality',
  'why.premium.desc': 'Every product is carefully curated and selected from the finest suppliers.',
  'why.fast.title': 'Fast Delivery',
  'why.fast.desc': 'Get your gathering stuff delivered at your doorstep as fast as possible',
  'why.secure.title': 'Easy & Secure',
  'why.secure.desc': 'Seamless checkout with multiple payment options. Your security is our priority.',

  // ─── PreFooter CTA ───
  'prefooter.join': 'Join the',
  'prefooter.family': 'Gather Family',
  'prefooter.cta': "Don't miss to sign up to join Gather Family to enjoy attractive offers and benefits.",
  'prefooter.signUp': 'Sign Up',

  // ─── Product page ───
  'product.quantity': 'Quantity',
  'product.addToCart': 'Add to Cart',
  'product.adding': 'Adding...',
  'product.added': 'Added to Cart',
  'product.outOfStock': 'Out of Stock',
  'product.inStock': 'In stock',
  'product.onlyLeft': 'Only {count} left in stock',
  'product.addToWishlist': 'Add to Wishlist',
  'product.savedToWishlist': 'Saved to Wishlist',
  'product.category': 'Category',
  'product.occasion': 'Occasion',
  'product.relatedProducts': 'Related Products',
  'product.limitedOffer': 'Limited-time Gather offer',

  // ─── Cart ───
  'cart.title': 'Cart',
  'cart.empty': 'Your cart is empty',
  'cart.emptyDesc': 'Looks like you haven\'t added anything to your cart yet.',
  'cart.continueShopping': 'Continue Shopping',
  'cart.summary': 'Cart Summary',
  'cart.subtotal': 'Subtotal',
  'cart.shipping': 'Shipping',
  'cart.calculatedAtCheckout': 'Calculated at checkout',
  'cart.total': 'Total',
  'cart.checkout': 'Proceed to Checkout',
  'cart.frequentlyBought': 'Frequently Bought Together',
  'cart.bundleSaving': 'You save {amount}',
  'cart.remove': 'Remove',
  'cart.egp': 'EGP',

  // ─── Checkout ───
  'checkout.title': 'Checkout',
  'checkout.deliveryDetails': 'Delivery Details',
  'checkout.firstName': 'First Name',
  'checkout.lastName': 'Last Name',
  'checkout.email': 'Email',
  'checkout.phone': 'Phone Number',
  'checkout.city': 'City',
  'checkout.address': 'Address',
  'checkout.deliveryDate': 'Delivery Date',
  'checkout.deliverySlot': 'Delivery Slot',
  'checkout.orderNotes': 'Order Notes (optional)',
  'checkout.paymentMethod': 'Payment Method',
  'checkout.cashOnDelivery': 'Cash on Delivery',
  'checkout.placeOrder': 'Place Order',
  'checkout.placing': 'Placing Order...',
  'checkout.orderSummary': 'Order Summary',
  'checkout.deliveryFee': 'Delivery Fee',
  'checkout.free': 'Free',
  'checkout.selectSlot': 'Select a delivery slot',

  // ─── Checkout Success ───
  'checkout.thankYou': 'Thank You!',
  'checkout.orderPlaced': 'Your order has been placed successfully.',
  'checkout.orderNumber': 'Order Number',
  'checkout.backToHome': 'Back to Home',

  // ─── Login ───
  'login.title': 'Sign In',
  'login.welcome': 'Welcome back! Sign in to manage your orders and account.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.forgotPassword': 'Forgot password?',
  'login.submit': 'Sign In',
  'login.submitting': 'Signing in...',
  'login.noAccount': "Don't have an account?",
  'login.createOne': 'Create one',
  'login.failed': 'Login failed',

  // ─── Signup ───
  'signup.title': 'Create Account',
  'signup.subtitle': 'Create your Gather account to enjoy faster checkout and order tracking.',
  'signup.fullName': 'Full name',
  'signup.email': 'Email',
  'signup.phone': 'Phone number',
  'signup.password': 'Password',
  'signup.confirmPassword': 'Confirm password',
  'signup.passwordMismatch': 'Passwords do not match',
  'signup.passwordShort': 'Password must be at least 6 characters',
  'signup.acceptPolicies': 'You must accept the Data Policy and Terms & Conditions to create an account.',
  'signup.dataPolicy': 'I read and consent to the',
  'signup.termsAndConditions': 'I read and consent to the',
  'signup.dataPolicyLink': 'Data Policy',
  'signup.termsLink': 'Terms and Conditions',
  'signup.submit': 'Create Account',
  'signup.submitting': 'Creating account...',
  'signup.haveAccount': 'Already have an account?',
  'signup.signIn': 'Sign in',
  'signup.failed': 'Signup failed',

  // ─── My Account ───
  'account.title': 'My Account',
  'account.welcome': 'Welcome, {name}!',
  'account.orders': 'Orders',
  'account.ordersDesc': 'View your order history',
  'account.profile': 'Profile',
  'account.profileDesc': 'Edit your details',
  'account.addresses': 'Addresses',
  'account.addressesDesc': 'Manage delivery addresses',
  'account.wishlist': 'Wishlist',
  'account.wishlistDesc': 'Your saved items',
  'account.recentOrders': 'Recent Orders',
  'account.viewAll': 'View all',
  'account.signOut': 'Sign Out',

  // ─── About page ───
  'about.title': 'About Gather',
  'about.ourStory': 'Our Story',
  'about.whatWeOffer': 'What we OFFER',

  // ─── Contact page ───
  'contact.title': 'Contact Us',
  'contact.getInTouch': 'Get In Touch',
  'contact.name': 'Name',
  'contact.email': 'Email',
  'contact.message': 'Message',
  'contact.send': 'Send Message',
  'contact.sending': 'Sending...',

  // ─── Wishlist ───
  'wishlist.title': 'Wishlist',
  'wishlist.empty': 'Your wishlist is empty',
  'wishlist.emptyDesc': 'Save items you love by clicking the heart icon on any product.',

  // ─── Search ───
  'search.title': 'Search',
  'search.results': 'results for',
  'search.noResults': 'No products found. Try a different search term.',

  // ─── Forgot Password ───
  'forgotPassword.title': 'Forgot Password',
  'forgotPassword.subtitle': 'Enter your email and we\'ll send you a reset link.',
  'forgotPassword.email': 'Email',
  'forgotPassword.submit': 'Send Reset Link',
  'forgotPassword.submitting': 'Sending...',
  'forgotPassword.success': 'If an account exists with that email, a reset link has been sent.',

  // ─── Reset Password ───
  'resetPassword.title': 'Reset Password',
  'resetPassword.newPassword': 'New Password',
  'resetPassword.confirmPassword': 'Confirm Password',
  'resetPassword.submit': 'Reset Password',
  'resetPassword.submitting': 'Resetting...',
  'resetPassword.success': 'Password reset successfully. You can now sign in.',

  // ─── Page Transition ───
  'transition.loading': 'loading your happy moments...',

  // ─── Rabbit Assistant ───
  'rabbit.needHelp': 'Need help?',

  // ─── 404 / Errors ───
  'error.pageNotFound': 'Page not found',
  'error.generic': 'An error occurred. Please try again.',

  // ─── Common actions ───
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',

  // ─── Orders ───
  'order.status.pending': 'Pending',
  'order.status.confirmed': 'Confirmed',
  'order.status.shipped': 'Shipped',
  'order.status.delivered': 'Delivered',
  'order.status.cancelled': 'Cancelled',

  // ─── Empty states ───
  'empty.noProductsCategory': 'No products in this category yet.',
  'empty.noProductsOccasion': 'No products for this occasion yet.',
}

const ar: TranslationMap = {
  // ─── Nav ───
  'nav.home': 'الرئيسية',
  'nav.shopByOccasion': 'تسوق حسب المناسبة',
  'nav.shopByCategory': 'تسوق حسب الفئة',
  'nav.about': 'عن جاذر',
  'nav.contact': 'اتصل بنا',
  'nav.search': 'بحث',
  'nav.go': 'بحث',
  'nav.cancel': 'إلغاء',
  'nav.searchPlaceholder': 'ابحث عن منتجات...',
  'nav.followGather': 'تابع جاذر',

  // ─── Footer ───
  'footer.tagline': 'كل ما تحتاجه لمناسبتك.',
  'footer.quickLinks': 'روابط سريعة',
  'footer.home': 'الرئيسية',
  'footer.myAccount': 'حسابي',
  'footer.usefulLinks': 'روابط مفيدة',
  'footer.shopByOccasion': 'تسوق حسب المناسبة',
  'footer.shopByCategory': 'تسوق حسب الفئة',
  'footer.privacyPolicy': 'سياسة الخصوصية',
  'footer.refundReturns': 'سياسة الاسترداد والإرجاع',
  'footer.contactInfo': 'معلومات التواصل',
  'footer.copyright': '© ٢٠٢٦ جاذر. جميع الحقوق محفوظة.',
  'footer.poweredBy': 'مقدم من',

  // ─── Hero ───
  'hero.brandLine': 'جاذر',
  'hero.headline': 'تجمعنا اللحظات الحلوة',
  'hero.subtitle': 'كل ما تحتاجه مناسبتك.',
  'hero.ctaPrimary': 'تسوق الآن',
  'hero.ctaSecondary': 'تسوق حسب المناسبة',

  // ─── Homepage sections ───
  'home.shopByCategory': 'تسوق حسب الفئة',
  'home.shopByCategorySub': 'كل ما تحتاجه مناسبتك',
  'home.featuredItems': 'منتجات مميزة',
  'home.featuredSub': 'أكثر المنتجات المختارة بعناية',
  'home.shopByOccasion': 'تسوق حسب المناسبة',
  'home.shopByOccasionSub': 'كل ما تحتاجه لجعل مناسبتك لا تُنسى',
  'home.offers': 'العروض والتخفيضات',
  'home.offersSub': 'اجعل مناسبتك أسهل وأسعد وبسعر أفضل.',
  'home.gatherMoments': 'لحظات جاذر',
  'home.gatherMomentsSub': 'شارك لحظتك السعيدة مع جاذر واحصل على فرصة للفوز بقسائم تسوق لمناسبتك القادمة.',
  'home.shareMoment': 'شارك لحظتك',
  'home.aboutGather': 'عن جاذر',
  'home.aboutGatherSub': 'نصمم البهجة لكل مناسبة، ونوصلها لباب بيتك. اجعل كل لحظة تستحق.',
  'home.aboutGatherBody': 'من كيك أعياد الميلاد إلى البالونات، والوجبات الخفيفة إلى الديكورات — اطلب كل ما تحتاجه لأي مناسبة، ووصله لباب بيتك.',
  'home.aboutUs': 'اعرف عنا',
  'home.whyGather': 'ليه جاذر',
  'home.whyGatherSub': 'نخلي كل مناسبة لا تُنسى',
  'home.viewAll': 'عرض الكل',
  'home.noProducts': 'لا توجد منتجات.',

  // ─── Why Gather cards ───
  'why.premium.title': 'جودة ممتازة',
  'why.premium.desc': 'كل منتج يتم اختياره بعناية من أفضل الموردين.',
  'why.fast.title': 'توصيل سريع',
  'why.fast.desc': 'نوصّل مستلزمات مناسبتك لباب بيتك بأسرع وقت ممكن.',
  'why.secure.title': 'سهل وآمن',
  'why.secure.desc': 'دفع سلس مع خيارات متعددة. أمانك هو أولويتنا.',

  // ─── PreFooter CTA ───
  'prefooter.join': 'انضم إلى',
  'prefooter.family': 'عائلة جاذر',
  'prefooter.cta': 'لا تفوّت فرصة الانضمام لعائلة جاذر للاستمتاع بعروض ومزايا رائعة.',
  'prefooter.signUp': 'اشترك الآن',

  // ─── Product page ───
  'product.quantity': 'الكمية',
  'product.addToCart': 'أضف إلى السلة',
  'product.adding': 'جاري الإضافة...',
  'product.added': 'تمت الإضافة إلى السلة',
  'product.outOfStock': 'غير متوفر',
  'product.inStock': 'متوفر',
  'product.onlyLeft': 'تبقى {count} قطع فقط',
  'product.addToWishlist': 'أضف إلى المفضلة',
  'product.savedToWishlist': 'محفوظ في المفضلة',
  'product.category': 'الفئة',
  'product.occasion': 'المناسبة',
  'product.relatedProducts': 'منتجات ذات صلة',
  'product.limitedOffer': 'عرض جاذر لفترة محدودة',

  // ─── Cart ───
  'cart.title': 'سلة التسوق',
  'cart.empty': 'سلتك فارغة',
  'cart.emptyDesc': 'يبدو أنك لم تضف أي منتج إلى سلتك بعد.',
  'cart.continueShopping': 'متابعة التسوق',
  'cart.summary': 'ملخص السلة',
  'cart.subtotal': 'المجموع الفرعي',
  'cart.shipping': 'الشحن',
  'cart.calculatedAtCheckout': 'يتم حسابه عند إتمام الطلب',
  'cart.total': 'الإجمالي',
  'cart.checkout': 'إتمام الطلب',
  'cart.frequentlyBought': 'تُشترى معًا غالبًا',
  'cart.bundleSaving': 'أنت توفر {amount}',
  'cart.remove': 'إزالة',
  'cart.egp': 'ج.م',

  // ─── Checkout ───
  'checkout.title': 'إتمام الطلب',
  'checkout.deliveryDetails': 'تفاصيل التوصيل',
  'checkout.firstName': 'الاسم الأول',
  'checkout.lastName': 'الاسم الأخير',
  'checkout.email': 'البريد الإلكتروني',
  'checkout.phone': 'رقم الهاتف',
  'checkout.city': 'المدينة',
  'checkout.address': 'العنوان',
  'checkout.deliveryDate': 'تاريخ التوصيل',
  'checkout.deliverySlot': 'فترة التوصيل',
  'checkout.orderNotes': 'ملاحظات الطلب (اختياري)',
  'checkout.paymentMethod': 'طريقة الدفع',
  'checkout.cashOnDelivery': 'الدفع عند الاستلام',
  'checkout.placeOrder': 'تأكيد الطلب',
  'checkout.placing': 'جاري تأكيد الطلب...',
  'checkout.orderSummary': 'ملخص الطلب',
  'checkout.deliveryFee': 'رسوم التوصيل',
  'checkout.free': 'مجاني',
  'checkout.selectSlot': 'اختر فترة التوصيل',

  // ─── Checkout Success ───
  'checkout.thankYou': 'شكرًا لك!',
  'checkout.orderPlaced': 'تم تقديم طلبك بنجاح.',
  'checkout.orderNumber': 'رقم الطلب',
  'checkout.backToHome': 'العودة للرئيسية',

  // ─── Login ───
  'login.title': 'تسجيل الدخول',
  'login.welcome': 'مرحبًا بعودتك! سجل دخولك لإدارة طلباتك وحسابك.',
  'login.email': 'البريد الإلكتروني',
  'login.password': 'كلمة المرور',
  'login.forgotPassword': 'نسيت كلمة المرور؟',
  'login.submit': 'تسجيل الدخول',
  'login.submitting': 'جاري تسجيل الدخول...',
  'login.noAccount': 'ليس لديك حساب؟',
  'login.createOne': 'أنشئ حسابًا',
  'login.failed': 'فشل تسجيل الدخول',

  // ─── Signup ───
  'signup.title': 'إنشاء حساب',
  'signup.subtitle': 'أنشئ حساب جاذر للاستمتاع بتجربة دفع أسرع ومتابعة الطلبات.',
  'signup.fullName': 'الاسم الكامل',
  'signup.email': 'البريد الإلكتروني',
  'signup.phone': 'رقم الهاتف',
  'signup.password': 'كلمة المرور',
  'signup.confirmPassword': 'تأكيد كلمة المرور',
  'signup.passwordMismatch': 'كلمات المرور غير متطابقة',
  'signup.passwordShort': 'يجب أن تكون كلمة المرور ٦ أحرف على الأقل',
  'signup.acceptPolicies': 'يجب الموافقة على سياسة البيانات والشروط والأحكام لإنشاء حساب.',
  'signup.dataPolicy': 'أقرأت وأوافق على',
  'signup.termsAndConditions': 'أقرأت وأوافق على',
  'signup.dataPolicyLink': 'سياسة البيانات',
  'signup.termsLink': 'الشروط والأحكام',
  'signup.submit': 'إنشاء حساب',
  'signup.submitting': 'جاري إنشاء الحساب...',
  'signup.haveAccount': 'لديك حساب بالفعل؟',
  'signup.signIn': 'سجل دخولك',
  'signup.failed': 'فشل إنشاء الحساب',

  // ─── My Account ───
  'account.title': 'حسابي',
  'account.welcome': 'مرحبًا، {name}!',
  'account.orders': 'الطلبات',
  'account.ordersDesc': 'عرض سجل الطلبات',
  'account.profile': 'الملف الشخصي',
  'account.profileDesc': 'تعديل بياناتك',
  'account.addresses': 'العناوين',
  'account.addressesDesc': 'إدارة عناوين التوصيل',
  'account.wishlist': 'المفضلة',
  'account.wishlistDesc': 'العناصر المحفوظة',
  'account.recentOrders': 'أحدث الطلبات',
  'account.viewAll': 'عرض الكل',
  'account.signOut': 'تسجيل الخروج',

  // ─── About page ───
  'about.title': 'عن جاذر',
  'about.ourStory': 'قصتنا',
  'about.whatWeOffer': 'ماذا نقدم',

  // ─── Contact page ───
  'contact.title': 'اتصل بنا',
  'contact.getInTouch': 'تواصل معنا',
  'contact.name': 'الاسم',
  'contact.email': 'البريد الإلكتروني',
  'contact.message': 'الرسالة',
  'contact.send': 'إرسال',
  'contact.sending': 'جاري الإرسال...',

  // ─── Wishlist ───
  'wishlist.title': 'المفضلة',
  'wishlist.empty': 'المفضلة فارغة',
  'wishlist.emptyDesc': 'احفظ المنتجات التي تعجبك بالضغط على أيقونة القلب في أي منتج.',

  // ─── Search ───
  'search.title': 'بحث',
  'search.results': 'نتائج لـ',
  'search.noResults': 'لم يتم العثور على منتجات. جرب كلمة بحث مختلفة.',

  // ─── Forgot Password ───
  'forgotPassword.title': 'نسيت كلمة المرور',
  'forgotPassword.subtitle': 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.',
  'forgotPassword.email': 'البريد الإلكتروني',
  'forgotPassword.submit': 'إرسال رابط إعادة التعيين',
  'forgotPassword.submitting': 'جاري الإرسال...',
  'forgotPassword.success': 'إذا كان هناك حساب بهذا البريد الإلكتروني، تم إرسال رابط إعادة التعيين.',

  // ─── Reset Password ───
  'resetPassword.title': 'إعادة تعيين كلمة المرور',
  'resetPassword.newPassword': 'كلمة المرور الجديدة',
  'resetPassword.confirmPassword': 'تأكيد كلمة المرور',
  'resetPassword.submit': 'إعادة تعيين كلمة المرور',
  'resetPassword.submitting': 'جاري إعادة التعيين...',
  'resetPassword.success': 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',

  // ─── Page Transition ───
  'transition.loading': 'جاري تحميل لحظاتك السعيدة...',

  // ─── Rabbit Assistant ───
  'rabbit.needHelp': 'تحتاج مساعدة؟',

  // ─── 404 / Errors ───
  'error.pageNotFound': 'الصفحة غير موجودة',
  'error.generic': 'حدث خطأ. يرجى المحاولة مرة أخرى.',

  // ─── Common actions ───
  'common.back': 'رجوع',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',

  // ─── Orders ───
  'order.status.pending': 'قيد الانتظار',
  'order.status.confirmed': 'مؤكد',
  'order.status.shipped': 'تم الشحن',
  'order.status.delivered': 'تم التوصيل',
  'order.status.cancelled': 'ملغي',

  // ─── Empty states ───
  'empty.noProductsCategory': 'لا توجد منتجات في هذه الفئة بعد.',
  'empty.noProductsOccasion': 'لا توجد منتجات لهذه المناسبة بعد.',
}

export function t(key: string, locale: Locale = 'en', values?: Record<string, string | number>): string {
  const map = locale === 'ar' ? ar : en
  let text = map[key]
  if (text === undefined) {
    text = en[key] ?? key
  }
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

const dict: Record<Locale, TranslationMap> = { en, ar }

export function getDict(locale: Locale): TranslationMap {
  return dict[locale] ?? dict.en
}
