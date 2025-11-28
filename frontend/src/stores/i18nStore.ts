import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'tl';

interface Translations {
  [key: string]: {
    en: string;
    tl: string;
  };
}

// Comprehensive translations for the entire app
const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', tl: 'Tahanan' },
  'nav.library': { en: 'Library', tl: 'Aklatan' },
  'nav.create': { en: 'Create', tl: 'Lumikha' },
  'nav.social': { en: 'Social', tl: 'Lipunan' },
  'nav.profile': { en: 'Profile', tl: 'Propil' },
  
  // Home Page
  'home.title': { en: 'Pixel Tales', tl: 'Pixel Tales' },
  'home.subtitle': { en: 'Where Stories Come to Life', tl: 'Kung Saan Nabubuhay ang mga Kuwento' },
  'home.heroSubtitle': { en: 'Create magical stories that come alive with wonder and creativity!', tl: 'Lumikha ng mahiwagang mga kuwento na nabubuhay sa pagkamangha at pagkamalikhain!' },
  'home.welcome': { en: 'Welcome back', tl: 'Maligayang pagbabalik' },
  'home.startCreating': { en: 'Start Creating', tl: 'Magsimulang Lumikha' },
  'home.continueStory': { en: 'Continue Story', tl: 'Ipagpatuloy ang Kuwento' },
  'home.dailyChallenge': { en: 'Daily Challenge', tl: 'Pang-araw-araw na Hamon' },
  'home.quickActions': { en: 'Quick Actions', tl: 'Mabilis na Aksyon' },
  'home.createYourStory': { en: 'Create Your Story', tl: 'Lumikha ng Iyong Kuwento' },
  'home.createWithAI': { en: 'Create with AI', tl: 'Lumikha gamit ang AI' },
  'home.createWithAIDesc': { en: 'Let AI generate your story with beautiful illustrations and magical adventures', tl: 'Hayaang bumuo ang AI ng iyong kuwento na may magagandang ilustrasyon at mahiwagang pakikipagsapalaran' },
  'home.startAIStory': { en: 'Start AI Story', tl: 'Simulan ang AI Kuwento' },
  'home.createManually': { en: 'Create Manually', tl: 'Lumikha nang Manu-mano' },
  'home.createManuallyDesc': { en: 'Write and illustrate your story from scratch with full creative control', tl: 'Sumulat at gumuhit ng iyong kuwento mula sa simula na may ganap na kontrol sa paglikha' },
  'home.useTemplate': { en: 'Use Template', tl: 'Gumamit ng Template' },
  'home.useTemplateDesc': { en: 'Choose from magical story templates to jumpstart your creativity', tl: 'Pumili mula sa mahiwagang mga template ng kuwento upang simulan ang iyong pagkamalikhain' },
  'home.browseTemplates': { en: 'Browse Templates', tl: 'Mag-browse ng mga Template' },
  'home.continueWorking': { en: 'Continue Working', tl: 'Magpatuloy sa Paggawa' },
  'home.noDrafts': { en: 'No drafts yet', tl: 'Walang draft pa' },
  'home.startFirstStory': { en: 'Start your first story above!', tl: 'Simulan ang iyong unang kuwento sa itaas!' },
  'home.continue': { en: 'Continue', tl: 'Magpatuloy' },
  'home.lastEdited': { en: 'Last edited', tl: 'Huling na-edit' },
  'home.words': { en: 'words', tl: 'salita' },
  
  // Creation Options
  'create.aiAssisted': { en: 'AI-Assisted Story', tl: 'Kuwentong may Tulong ng AI' },
  'create.aiDesc': { en: 'Let AI help you write', tl: 'Hayaang tulungan ka ng AI sa pagsulat' },
  'create.manual': { en: 'Manual Creation', tl: 'Manwal na Paggawa' },
  'create.manualDesc': { en: 'Draw and write yourself', tl: 'Gumuhit at sumulat nang mag-isa' },
  'create.template': { en: 'Use Template', tl: 'Gumamit ng Template' },
  'create.templateDesc': { en: 'Start with a template', tl: 'Magsimula sa template' },
  'create.storyLanguage': { en: 'Story Language', tl: 'Wika ng Kuwento' },
  'create.storyLanguageDesc': { en: 'Choose the language for your story content', tl: 'Pumili ng wika para sa nilalaman ng iyong kuwento' },
  'create.english': { en: 'English', tl: 'Ingles' },
  'create.tagalog': { en: 'Tagalog', tl: 'Tagalog' },
  'create.englishDesc': { en: 'Story will be written in English', tl: 'Ang kuwento ay isusulat sa Ingles' },
  'create.tagalogDesc': { en: 'Story will be written in Tagalog', tl: 'Ang kuwento ay isusulat sa Tagalog' },
  
  // Library Page
  'library.title': { en: 'My Library', tl: 'Aking Aklatan' },
  'library.myStories': { en: 'My Stories', tl: 'Aking mga Kuwento' },
  'library.discover': { en: 'Discover', tl: 'Tuklasin' },
  'library.bookmarks': { en: 'Bookmarks', tl: 'mga Bookmark' },
  'library.offline': { en: 'Offline Stories', tl: 'Offline na mga Kuwento' },
  'library.createNew': { en: 'Create New Story', tl: 'Lumikha ng Bagong Kuwento' },
  'library.read': { en: 'Read', tl: 'Basahin' },
  'library.edit': { en: 'Edit', tl: 'I-edit' },
  'library.share': { en: 'Share', tl: 'Ibahagi' },
  'library.delete': { en: 'Delete', tl: 'Tanggalin' },
  'library.author': { en: 'by', tl: 'ni' },
  'library.pages': { en: 'pages', tl: 'pahina' },
  'library.stories': { en: 'Stories', tl: 'mga Kuwento' },
  'library.wordCount': { en: 'Words', tl: 'mga Salita' },
  'library.illustrations': { en: 'Illustrations', tl: 'mga Ilustrasyon' },
  'library.streak': { en: 'Day Streak', tl: 'Araw na Sunod-sunod' },
  'library.searchPlaceholder': { en: 'Search stories...', tl: 'Maghanap ng mga kuwento...' },
  'library.filter': { en: 'Filter', tl: 'I-filter' },
  'library.featured': { en: 'Featured Story', tl: 'Pangunahing Kuwento' },
  'library.trending': { en: 'Trending Stories', tl: 'Uso na mga Kuwento' },
  'library.downloads': { en: 'Downloads', tl: 'mga Download' },
  'library.downloaded': { en: 'Downloaded', tl: 'Na-download na' },
  'library.download': { en: 'Download', tl: 'I-download' },
  'library.offlineReading': { en: 'Offline Reading', tl: 'Offline na Pagbabasa' },
  'library.availableOffline': { en: 'Available offline', tl: 'Available offline' },
  'library.category': { en: 'Category', tl: 'Kategorya' },
  'library.rating': { en: 'Rating', tl: 'Rating' },
  'library.views': { en: 'views', tl: 'views' },
  'library.likes': { en: 'likes', tl: 'likes' },
  'library.drafts': { en: 'Drafts', tl: 'mga Draft' },
  'library.savedWorks': { en: 'Saved Works', tl: 'mga Naka-save na Gawa' },
  'library.characters': { en: 'Characters', tl: 'mga Karakter' },
  'library.noDrafts': { en: 'No drafts yet', tl: 'Walang draft pa' },
  'library.startCreating': { en: 'Start creating your first story!', tl: 'Magsimulang lumikha ng iyong unang kuwento!' },
  'library.createFirst': { en: 'Create Your First Story', tl: 'Lumikha ng Iyong Unang Kuwento' },
  'library.view': { en: 'View', tl: 'Tingnan' },
  'library.saveStory': { en: 'Save', tl: 'I-save' },
  'library.publishToPublic': { en: 'Publish', tl: 'I-publish' },
  'library.unpublish': { en: 'Unpublish', tl: 'I-unpublish' },
  'library.yourWorks': { en: 'Your Works', tl: 'Iyong mga Gawa' },
  'library.noWorks': { en: 'No saved works yet', tl: 'Walang naka-save na gawa pa' },
  'library.saveFirstStory': { en: 'Save your first story from drafts!', tl: 'I-save ang iyong unang kuwento mula sa mga draft!' },
  
  // Settings Page
  'settings.title': { en: 'Settings', tl: 'mga Setting' },
  'settings.subtitle': { en: 'Manage your account and app preferences', tl: 'Pamahalaan ang iyong account at kagustuhan sa app' },
  'settings.account': { en: 'Account', tl: 'Account' },
  'settings.appearance': { en: 'Appearance', tl: 'Hitsura' },
  'settings.privacy': { en: 'Privacy & Security', tl: 'Pribasya at Seguridad' },
  'settings.notifications': { en: 'Notifications', tl: 'mga Abiso' },
  'settings.language': { en: 'Language', tl: 'Wika' },
  'settings.languageDesc': { en: 'Choose your preferred language', tl: 'Pumili ng iyong gustong wika' },
  'settings.professionalTools': { en: 'Professional Tools', tl: 'Propesyonal na mga Kasangkapan' },
  'settings.support': { en: 'Support', tl: 'Suporta' },
  'settings.signOut': { en: 'Sign Out', tl: 'Mag-sign Out' },
  'settings.deleteAccount': { en: 'Delete Account', tl: 'Tanggalin ang Account' },
  
  // Settings - Account
  'settings.profileInfo': { en: 'Profile Information', tl: 'Impormasyon ng Propil' },
  'settings.email': { en: 'Email Address', tl: 'Email Address' },
  'settings.password': { en: 'Password', tl: 'Password' },
  'settings.change': { en: 'Change', tl: 'Baguhin' },
  'settings.update': { en: 'Update', tl: 'I-update' },
  
  // Settings - Appearance
  'settings.darkMode': { en: 'Dark Mode', tl: 'Dark Mode' },
  'settings.darkModeEnabled': { en: 'Dark theme enabled', tl: 'Naka-enable ang dark theme' },
  'settings.lightModeEnabled': { en: 'Light theme enabled', tl: 'Naka-enable ang light theme' },
  'settings.animations': { en: 'Animations', tl: 'mga Animasyon' },
  'settings.animationsEnabled': { en: 'Smooth animations and transitions', tl: 'Maayos na mga animasyon at transisyon' },
  'settings.animationsDisabled': { en: 'Reduced motion for better performance', tl: 'Binawasan ang paggalaw para sa mas magandang performance' },
  'settings.homeTheme': { en: 'Home Theme', tl: 'Theme ng Tahanan' },
  'settings.homeThemeColorful': { en: 'Vibrant colors and gradients', tl: 'Makulay at may gradient' },
  'settings.homeThemeMinimal': { en: 'Clean and simple design', tl: 'Malinis at simpleng disenyo' },
  'settings.homeThemeMagical': { en: 'Enchanted with sparkles', tl: 'Mahiwaga na may kislap' },
  
  // Settings - Privacy
  'settings.profileVisibility': { en: 'Profile Visibility', tl: 'Visibility ng Propil' },
  'settings.storySharing': { en: 'Story Sharing', tl: 'Pagbabahagi ng Kuwento' },
  'settings.blockList': { en: 'Block List', tl: 'Listahan ng mga Naka-block' },
  'settings.manage': { en: 'Manage', tl: 'Pamahalaan' },
  'settings.public': { en: 'Public', tl: 'Pampubliko' },
  'settings.friends': { en: 'Friends', tl: 'mga Kaibigan' },
  'settings.private': { en: 'Private', tl: 'Pribado' },
  
  // Settings - Notifications
  'settings.friendRequests': { en: 'Friend Requests', tl: 'mga Kahilingan ng Kaibigan' },
  'settings.friendRequestsDesc': { en: 'Get notified when someone wants to be your friend', tl: 'Makatanggap ng abiso kapag may gustong maging kaibigan mo' },
  'settings.storyLikes': { en: 'Story Likes', tl: 'mga Like sa Kuwento' },
  'settings.storyLikesDesc': { en: 'Get notified when someone likes your stories', tl: 'Makatanggap ng abiso kapag may nag-like ng iyong kuwento' },
  'settings.contestUpdates': { en: 'Contest Updates', tl: 'mga Update sa Paligsahan' },
  'settings.contestUpdatesDesc': { en: 'Stay updated on writing contests and events', tl: 'Manatiling updated sa mga paligsahan at kaganapan' },
  
  // Settings - Professional Tools
  'settings.advancedDrawing': { en: 'Advanced Drawing', tl: 'Advanced na Pagguhit' },
  'settings.gridLayers': { en: 'Grid & Layers', tl: 'Grid at mga Layer' },
  'settings.exportOptions': { en: 'Export Options', tl: 'mga Opsyon sa Pag-export' },
  'settings.enable': { en: 'Enable', tl: 'I-enable' },
  'settings.upgrade': { en: 'Upgrade', tl: 'Mag-upgrade' },
  'settings.off': { en: 'Off', tl: 'Naka-off' },
  'settings.basic': { en: 'Basic', tl: 'Basic' },
  
  // Settings - Support
  'settings.helpCenter': { en: 'Help Center', tl: 'Help Center' },
  'settings.helpCenterDesc': { en: 'Get answers to common questions', tl: 'Makakuha ng sagot sa mga karaniwang tanong' },
  'settings.contactUs': { en: 'Contact Us', tl: 'Makipag-ugnayan sa Amin' },
  'settings.contactUsDesc': { en: 'Report issues or send feedback', tl: 'Mag-ulat ng mga isyu o magpadala ng feedback' },
  'settings.open': { en: 'Open', tl: 'Buksan' },
  'settings.contact': { en: 'Contact', tl: 'Makipag-ugnayan' },
  
  // Settings - App Info
  'settings.appVersion': { en: 'Version', tl: 'Bersyon' },
  'settings.appTagline': { en: 'Made with ✨ for young creators', tl: 'Ginawa ng may ✨ para sa mga batang lumikha' },
  
  // Auth Page
  'auth.signIn': { en: 'Sign In', tl: 'Mag-sign In' },
  'auth.signUp': { en: 'Sign Up', tl: 'Mag-sign Up' },
  'auth.email': { en: 'Email', tl: 'Email' },
  'auth.password': { en: 'Password', tl: 'Password' },
  'auth.name': { en: 'Name', tl: 'Pangalan' },
  'auth.confirmPassword': { en: 'Confirm Password', tl: 'Kumpirmahin ang Password' },
  'auth.forgotPassword': { en: 'Forgot password?', tl: 'Nakalimutan ang password?' },
  'auth.continueWithoutAccount': { en: 'Continue without account', tl: 'Magpatuloy nang walang account' },
  'auth.createAccount': { en: 'Create Account', tl: 'Lumikha ng Account' },
  'auth.alreadyHaveAccount': { en: 'Already have an account?', tl: 'Mayroon nang account?' },
  'auth.dontHaveAccount': { en: "Don't have an account?", tl: 'Walang account?' },
  
  // AI Story Generation
  'ai.generateStory': { en: 'Generate Story', tl: 'Bumuo ng Kuwento' },
  'ai.storyPrompt': { en: 'Story Idea', tl: 'Ideya ng Kuwento' },
  'ai.storyPromptPlaceholder': { en: 'Describe your story idea...', tl: 'Ilarawan ang iyong ideya ng kuwento...' },
  'ai.selectGenre': { en: 'Select Genre', tl: 'Pumili ng Genre' },
  'ai.selectAgeGroup': { en: 'Age Group', tl: 'Edad' },
  'ai.selectArtStyle': { en: 'Art Style', tl: 'Estilo ng Sining' },
  'ai.generating': { en: 'Generating your story...', tl: 'Binubuo ang iyong kuwento...' },
  'ai.generatingImages': { en: 'Creating illustrations...', tl: 'Lumilikha ng mga ilustrasyon...' },
  
  // Canvas Drawing
  'canvas.title': { en: 'Canvas Drawing', tl: 'Pagguhit sa Canvas' },
  'canvas.brush': { en: 'Brush', tl: 'Brush' },
  'canvas.eraser': { en: 'Eraser', tl: 'Pambura' },
  'canvas.fill': { en: 'Fill', tl: 'Punan' },
  'canvas.shapes': { en: 'Shapes', tl: 'mga Hugis' },
  'canvas.undo': { en: 'Undo', tl: 'I-undo' },
  'canvas.redo': { en: 'Redo', tl: 'I-redo' },
  'canvas.clear': { en: 'Clear', tl: 'Linisin' },
  'canvas.done': { en: 'Done', tl: 'Tapos na' },
  'canvas.close': { en: 'Close', tl: 'Isara' },
  
  // Manual Story Creation
  'manual.title': { en: 'Create Your Story', tl: 'Lumikha ng Iyong Kuwento' },
  'manual.storyTitle': { en: 'Story Title', tl: 'Pamagat ng Kuwento' },
  'manual.storyTitlePlaceholder': { en: 'Enter your story title...', tl: 'Ilagay ang pamagat ng kuwento...' },
  'manual.editCanvas': { en: 'Edit Canvas', tl: 'I-edit ang Canvas' },
  'manual.addPage': { en: 'Add Page', tl: 'Magdagdag ng Pahina' },
  'manual.page': { en: 'Page', tl: 'Pahina' },
  'manual.writeYourStory': { en: 'Write your story here...', tl: 'Isulat ang iyong kuwento dito...' },
  'manual.characterCount': { en: 'characters', tl: 'karakter' },
  'manual.aiAssistant': { en: 'AI Assistant', tl: 'AI Assistant' },
  'manual.save': { en: 'Save', tl: 'I-save' },
  'manual.back': { en: 'Back', tl: 'Bumalik' },
  
  // Common Actions
  'common.save': { en: 'Save', tl: 'I-save' },
  'common.cancel': { en: 'Cancel', tl: 'Kanselahin' },
  'common.delete': { en: 'Delete', tl: 'Tanggalin' },
  'common.edit': { en: 'Edit', tl: 'I-edit' },
  'common.share': { en: 'Share', tl: 'Ibahagi' },
  'common.close': { en: 'Close', tl: 'Isara' },
  'common.back': { en: 'Back', tl: 'Bumalik' },
  'common.next': { en: 'Next', tl: 'Susunod' },
  'common.previous': { en: 'Previous', tl: 'Nakaraan' },
  'common.loading': { en: 'Loading...', tl: 'Naglo-load...' },
  'common.error': { en: 'Error', tl: 'Error' },
  'common.success': { en: 'Success', tl: 'Tagumpay' },
  'common.all': { en: 'All', tl: 'Lahat' },
  'common.view': { en: 'View', tl: 'Tingnan' },
  'common.by': { en: 'by', tl: 'ni' },
  
  // Messages
  'message.saveSuccess': { en: 'Saved successfully!', tl: 'Matagumpay na na-save!' },
  'message.deleteConfirm': { en: 'Are you sure you want to delete this?', tl: 'Sigurado ka bang gusto mong tanggalin ito?' },
  'message.noStories': { en: 'No stories yet', tl: 'Walang kuwento pa' },
  'message.createFirst': { en: 'Create your first story!', tl: 'Lumikha ng iyong unang kuwento!' },
  
  // Guest/Anonymous User
  'guest.browsing': { en: 'Browsing without account', tl: 'Nanonood nang walang account' },
  'guest.signInPrompt': { en: 'Sign up for a free account to access all features', tl: 'Mag-sign up para sa libreng account upang ma-access ang lahat ng feature' },
  'guest.createFreeAccount': { en: 'Create Free Account', tl: 'Lumikha ng Libreng Account' },
  
  // Language Options
  'language.english': { en: 'English', tl: 'Ingles' },
  'language.tagalog': { en: 'Tagalog', tl: 'Tagalog' },
  'language.spanish': { en: 'Spanish', tl: 'Espanyol' },
  'language.french': { en: 'French', tl: 'Pranses' },
  
  // Voice Input
  'voice.clickToSpeak': { en: 'Click to speak', tl: 'Magsalita para mag-type' },
  'voice.stopRecording': { en: 'Stop recording', tl: 'Ihinto ang recording' },
  'voice.listening': { en: 'Listening...', tl: 'Nakikinig...' },
  'voice.noSpeech': { en: 'No speech detected. Please try again.', tl: 'Walang narinig na boses. Subukang magsalita ulit.' },
  'voice.micAccessDenied': { en: 'Microphone access denied.', tl: 'Hindi ma-access ang mikropono.' },
  'voice.micPermission': { en: 'Microphone permission required.', tl: 'Kailangan ng pahintulot para sa mikropono.' },
  'voice.networkError': { en: 'Network error. Check your connection.', tl: 'Problema sa network. Suriin ang koneksyon.' },
  'voice.notSupported': { en: 'Voice input not supported in this browser', tl: 'Hindi suportado ang voice input sa browser na ito' },
  'voice.speakNow': { en: 'Speak now...', tl: 'Magsalita ngayon...' },
  'voice.processing': { en: 'Processing...', tl: 'Pinoproseso...' },
  
  // Text-to-Speech
  'tts.listen': { en: 'Listen to Story', tl: 'Pakinggan ang Kuwento' },
  'tts.play': { en: 'Play', tl: 'I-play' },
  'tts.pause': { en: 'Pause', tl: 'I-pause' },
  'tts.resume': { en: 'Resume', tl: 'Ipagpatuloy' },
  'tts.stop': { en: 'Stop', tl: 'Ihinto' },
  'tts.settings': { en: 'Voice Settings', tl: 'mga Setting ng Boses' },
  'tts.voice': { en: 'Voice', tl: 'Boses' },
  'tts.speed': { en: 'Speed', tl: 'Bilis' },
  'tts.volume': { en: 'Volume', tl: 'Lakas ng Tunog' },
  'tts.slow': { en: 'Slow', tl: 'Mabagal' },
  'tts.normal': { en: 'Normal', tl: 'Normal' },
  'tts.fast': { en: 'Fast', tl: 'Mabilis' },
};

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',
      
      setLanguage: (lang: Language) => {
        set({ language: lang });
      },
      
      t: (key: string): string => {
        const { language } = get();
        const translation = translations[key];
        
        if (!translation) {
          console.warn(`Translation missing for key: ${key}`);
          return key;
        }
        
        return translation[language] || translation.en || key;
      },
    }),
    {
      name: 'i18n-storage',
    }
  )
);
