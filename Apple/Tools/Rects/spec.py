def R(i): return 'https://i.redd.it/'+i
def RP(i):
    import json; return json.load(open('rd/index.json'))['https://i.redd.it/'+i]['post']
specs += [
 dict(name='iOS26.2.Settings.InsetGroupedSections', src='rd/9v8lwa87fazf1.png', platform='iOS 26.2 beta (iPhone 16/17 Pro Max, 1320 px)', native=True, mockup=False,
      shows='Settings > Notifications > Enhanced Safety Alerts: inset grouped list sections (white cards on system grouped background), PNG', source_page_url=RP('9v8lwa87fazf1.png'), image_url=R('9v8lwa87fazf1.png'), short=None,
      crops=[('Section1','tl',(20,365,440,650)),('Section1','tr',(880,365,1300,650)),('Section2','bl',(20,1110,440,1350)),('Section2','br',(880,1110,1300,1350))]),
 dict(name='iOS27.Widget.Large.AppleTV', src='rd/p6cad1xejleh1.jpeg', platform='iOS 27 beta 4 (1320 px wide crop)', native=True, mockup=False,
      shows='Large Apple TV widget in light mode (white card, photo header) plus rounded thumbnail tiles', source_page_url=RP('p6cad1xejleh1.jpeg'), image_url=R('p6cad1xejleh1.jpeg'),
      crops=[('Widget','bl',(35,820,480,1280)),('Widget','br',(840,820,1285,1280)),('Thumbnail','tl',(115,745,330,960))]),
 dict(name='iOS27.Widget.Medium.Reminders.Icons', src='rd/xvgun82nxheh1.jpeg', platform='iOS 27 beta 4 (iPhone 15/16 Pro, 1179 px)', native=True, mockup=False,
      shows='Home Screen, dark mode: medium Reminders widget (black) and dark app icons over blurred grey wallpaper', source_page_url=RP('xvgun82nxheh1.jpeg'), image_url=R('xvgun82nxheh1.jpeg'),
      crops=[('Widget','tl',(10,200,480,600)),('Widget','br',(700,420,1160,790)),('SettingsIcon','tl',(10,780,190,960))]),
 dict(name='iOS27.Notification.WalletBanner', src='rd/qb4zgxi3287h1.jpeg', platform='iOS 27 beta 1 (1205 px wide crop)', native=True, mockup=False,
      shows='White notification banner on dark photo, with small Wallet app icon', source_page_url=RP('qb4zgxi3287h1.jpeg'), image_url=R('qb4zgxi3287h1.jpeg'),
      crops=[('Banner','tl',(0,0,420,300)),('Banner','br',(790,0,1205,308))]),
]
specs += [
 dict(name='iOS27.ControlCenter.Tiles.iPhoneSE', src='rd/p8mddubib5jh1.png', platform='iOS 27 beta 5 (iPhone SE / 8, 750 px, 2x)', native=True, mockup=False,
      shows='Expanded Connectivity group in Control Center: square glass tiles (Wi-Fi, AirDrop, Cellular, Bluetooth), PNG', source_page_url=RP('p8mddubib5jh1.png'), image_url=R('p8mddubib5jh1.png'),
      crops=[('WiFiTile','tl',(50,280,300,530),None,None,'nomeasure'),('AirDropTile','tr',(440,280,690,530),None,None,'nomeasure')]),
 dict(name='iOS26.HomeScreen.Folders.OnBlack', src='rd/moza5fs4tzvg1.jpeg', platform='iOS 26 (iPhone X/XS/11 Pro, 1125 px)', native=True, mockup=False,
      shows='Home Screen folders (grey platters) and a red Quora app icon on a pure black wallpaper', source_page_url=RP('moza5fs4tzvg1.jpeg'), image_url=R('moza5fs4tzvg1.jpeg'),
      crops=[('FolderA','tl',(20,170,200,350)),('FolderA','br',(110,260,290,440)),('QuoraIcon','tl',(800,1020,980,1200)),('QuoraIcon','br',(900,1110,1080,1290))]),
 dict(name='iOS27.Weather.Cards.Dark', src='rd/ftthaczyv66h1.jpeg', platform='iOS 27 beta 1 (iPhone 15/16 Pro Max, 1290 px)', native=True, mockup=False,
      shows='Weather app list: "Stay Informed" grey card and city cards on black', source_page_url=RP('ftthaczyv66h1.jpeg'), image_url=R('ftthaczyv66h1.jpeg'),
      crops=[('StayInformedCard','tl',(0,290,420,700)),('StayInformedCard','br',(870,440,1290,890))]),
 dict(name='iOS27.Settings.SiriCards.Dark', src='rd/7qohj5i6z76h1.jpeg', platform='iOS 27 beta 1 (1319 px wide crop)', native=True, mockup=False,
      shows='Siri settings: "Indexing in Progress" grouped card and "Set up Talk to Siri" row card, dark mode', source_page_url=RP('7qohj5i6z76h1.jpeg'), image_url=R('7qohj5i6z76h1.jpeg'),
      crops=[('IndexingCard','tl',(10,0,430,420)),('IndexingCard','br',(880,100,1300,520)),('TalkToSiriRow','tl',(10,550,420,784))]),
]
NRI='https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/'
NRP='https://www.apple.com/newsroom/2025/06/ipados-26-introduces-powerful-new-features-that-push-ipad-even-further/'
NRM='https://www.apple.com/newsroom/2025/06/macos-tahoe-26-makes-the-mac-more-capable-productive-and-intelligent-than-ever/'
NRL='https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/'
NI='nr/Images-of-Apple-WWDC25-iOS-26-250609/'; NP='nr/Images-of-Apple-WWDC25-iPadOS-26-250609/Images-of-Apple-WWDC25-iPadOS-26-250609/'; NM='nr/Images-of-Apple-WWDC25-macOS-Tahoe-26-250609/Images-of-Apple-WWDC25-macOS-Tahoe-26-250609/'
def ZI(z): return 'https://www.apple.com/newsroom/images/2025/06/'+z
NOTE='Apple Newsroom press image (3840 px original from the article zip). Real OS 26 UI composited into a device render by Apple; screen is scaled (not device-native pixels) but corners are Apple-rendered.'
specs += [
 dict(name='Newsroom.iOS26.LiveActivity.LockScreen', src=NI+'Apple-WWDC25-iOS-26-Live-Activities-250609.jpg', platform='iOS 26 (WWDC25 press image)', native=False, mockup=False, notes=NOTE,
      shows='Lock Screen Live Activity (black rounded rect on blue photo)', source_page_url=NRI, image_url=ZI('apple-elevates-the-iphone-experience-with-ios-26/article/Images-of-Apple-WWDC25-iOS-26-250609.zip'),
      crops=[('LiveActivity','tl',(655,2440,1155,2940)),('LiveActivity','br',(1590,2640,2085,3140))]),
 dict(name='Newsroom.iOS26.Wallet.BoardingPass', src=NI+'Apple-WWDC25-iOS-26-Wallet-refreshed-boarding-pass-250609.jpg', platform='iOS 26 (WWDC25 press image)', native=False, mockup=False, notes=NOTE,
      shows='Wallet boarding pass card (blue) and white action tiles on grouped background', source_page_url=NRI, image_url=ZI('apple-elevates-the-iphone-experience-with-ios-26/article/Images-of-Apple-WWDC25-iOS-26-250609.zip'),
      crops=[('Pass','tl',(650,800,1150,1300)),('Pass','br',(1600,2250,2100,2750)),('TerminalTile','tl',(650,2970,1050,3370))]),
 dict(name='Newsroom.iOS26.FindMy.Sheet.Tiles', src=NI+'Apple-WWDC25-iOS-26-Find-My-AirTag-250609.jpg', platform='iOS 26 (WWDC25 press image)', native=False, mockup=False, notes=NOTE,
      shows='Find My item sheet: rounded action tiles (Play Sound, Find) on a translucent sheet', source_page_url=NRI, image_url=ZI('apple-elevates-the-iphone-experience-with-ios-26/article/Images-of-Apple-WWDC25-iOS-26-250609.zip'),
      crops=[('FindTile','tr',(1620,2410,2070,2810))]),
 dict(name='Newsroom.iPadOS26.HomeScreen.Widgets', src=NP+'Apple-WWDC25-iPadOS-26-Home-Screen-250609.jpg', platform='iPadOS 26 (WWDC25 press image)', native=False, mockup=False, notes=NOTE,
      shows='iPad Home Screen: small Clock, Find My, medium Weather and large Photos widgets, app icons', source_page_url=NRP, image_url=ZI('ipados-26-introduces-powerful-new-features-that-push-ipad-even-further/article/Images-of-Apple-WWDC25-iPadOS-26-250609.zip'),
      crops=[('PhotosWidgetLarge','tl',(1520,460,1900,840)),('PhotosWidgetLarge','br',(1900,830,2330,1260)),('ClockWidgetSmall','tl',(740,455,1060,775)),('FaceTimeIcon','tl',(840,1310,1000,1470))]),
 dict(name='Newsroom.macOS26.ControlCenter', src=NM+'Apple-WWDC25-macOS-Tahoe-26-Control-Center-250609.jpg', platform='macOS Tahoe 26 (WWDC25 press image)', native=False, mockup=False, notes=NOTE,
      shows='macOS Tahoe Control Center modules (glass): Now Playing tile, Display and Sound slider modules', source_page_url=NRM, image_url=ZI('macos-tahoe-26-makes-the-mac-more-capable-productive-and-intelligent-than-ever/article/Images-of-Apple-WWDC25-macOS-Tahoe-26-250609.zip'),
      crops=[('DisplayModule','tl',(2000,1380,2400,1780),None,None,'nomeasure')]),
 dict(name='Newsroom.macOS26.Desktop.Call.Calendar', src=NM+'Apple-WWDC25-macOS-Tahoe-26-Phone-incoming-call-250609.jpg', platform='macOS Tahoe 26 (WWDC25 press image)', native=False, mockup=False, notes=NOTE,
      shows='macOS Tahoe desktop: incoming FaceTime call panel and Calendar window corners over blue wallpaper', source_page_url=NRM, image_url=ZI('macos-tahoe-26-makes-the-mac-more-capable-productive-and-intelligent-than-ever/article/Images-of-Apple-WWDC25-macOS-Tahoe-26-250609.zip'),
      crops=[('CalendarWindow','tr',(900,560,1400,1060))]),
]
IC='ios26/iOS-26-Icon-Templates-Photoshop-Illustrator/Icon Composer Demo Project/Exports/'
IC7='ios27/iOS-27-Icon-Templates-Photoshop-Illustrator/Icon Composer Demo Project/Exports/'
ADR='https://developer.apple.com/design/resources/'
specs += [
 dict(name='AppleDesignResources.IconComposer.iOS26.Default.2048', src=IC+'Demo Project-iOS-Default-1024x1024@2x.png', platform='iOS 26 app icon, rendered by Icon Composer (Apple Design Resources iOS 26 Icon Templates dmg)', native=True, mockup=False,
      shows='Official Icon Composer export of the demo app icon at 2048 px with the real iOS 26 icon mask in the alpha channel (transparent outside). Crops composited on black.', short=2048,
      source_page_url=ADR, image_url='https://devimages-cdn.apple.com/design/resources/download/iOS-26-Icon-Templates-Photoshop-Illustrator.dmg',
      notes='Alpha matches the Illustrator template path (Vectors/Apple.AppIconMask.1024.svg): 50% alpha on the diagonal at 156 px of 2048 (0.0762), same as the .ai path (0.0763); the .psd path would give 0.0732.',
      crops=[('IconMask','tl',(-40,-40,860,860)),('IconMask','br',(1188,1188,2088,2088))]),
 dict(name='AppleDesignResources.IconComposer.iOS27.Dark.1024', src=IC7+'Demo Project-iOS-Dark-1024@1x.png', platform='iOS 27 app icon, rendered by Icon Composer (Apple Design Resources iOS 27 Icon Templates dmg)', native=True, mockup=False,
      shows='Official Icon Composer export (dark appearance) at 1024 px, icon mask in alpha. Crops composited on white.', short=1024,
      source_page_url=ADR, image_url='https://devimages-cdn.apple.com/design/resources/download/iOS-27-Icon-Templates-Photoshop-Illustrator.dmg',
      crops=[('IconMask','tl',(-30,-30,450,450),'white')]),
 dict(name='AppleDesignResources.AppIconMask.Illustrator.Render2048', src='C:/Users/jackc/Code/LiquidGlassGallery/Rects/Vectors/Apple.AppIconMask.Render2048.png', platform='Apple Design Resources iOS 26/27 App Icon Template.ai vector path, rasterized at 2048 by MuPDF', native=False, mockup=False,
      shows='The official icon-mask vector (white) on black, rasterized from Vectors/Apple.AppIconMask.1024.svg. Reference, not a screenshot.', short=2048,
      source_page_url=ADR, image_url='https://devimages-cdn.apple.com/design/resources/download/iOS-26-Icon-Templates-Photoshop-Illustrator.dmg',
      crops=[('VectorMask','tl',(-40,-40,860,860))]),
 dict(name='AppleDesignResources.AppIconMask.Photoshop.Render2048', src='C:/Users/jackc/Code/LiquidGlassGallery/Rects/Vectors/Apple.AppIconMask.Photoshop.Render2048.png', platform='Apple Design Resources iOS 26/27 App Icon Template.psd "App Icon Shape" vector mask, rasterized at 2048 by MuPDF', native=False, mockup=False,
      shows='The Photoshop template icon-shape vector (white) on black. Slightly tighter corner than the .ai path. Reference, not a screenshot.', short=2048,
      source_page_url=ADR, image_url='https://devimages-cdn.apple.com/design/resources/download/iOS-26-Icon-Templates-Photoshop-Illustrator.dmg',
      crops=[('VectorMask','tl',(-40,-40,860,860))]),
]
specs += [
 dict(name='iOS27.HomeScreen.Widgets.BlueTint', src='rd/jcb6zbyrxhph1.jpeg', platform='iOS 27 (iPhone 17 Pro, 1260 px)', native=True, mockup=False,
      shows='Home Screen with tinted blue small widgets (Weather, Outlook, Stocks) and glass folders over a beige wallpaper', source_page_url=RP('jcb6zbyrxhph1.jpeg'), image_url=R('jcb6zbyrxhph1.jpeg'),
      crops=[('OutlookWidgetSmall','br',(240,1030,640,1470)),('WeatherWidgetSmall','bl',(40,450,440,850))]),
 dict(name='MacStories.iOS26.ContextMenu.Messages', src='ms/img_1785-1757756018189.jpeg', platform='iOS 26 (iPhone 16/17 Pro Max, 1320 px wide crop)', native=True, mockup=False,
      shows='Messages filter context menu (light glass) over blurred pinned conversations', source_page_url='https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/14/', image_url='https://cdn.macstories.net/img_1785-1757756018189.jpeg',
      crops=[('ContextMenu','tr',(900,130,1300,530),None,None,'nomeasure'),('ContextMenu','bl',(450,700,850,1140))]),
]
specs += [
 dict(name='macOS26.Desktop.Widgets.2x', src='rd/92cdzv6c8urf1.png', platform='macOS Tahoe 26 (MacBook, 2940x1912 = 2x native)', native=True, mockup=False,
      shows='Desktop widgets: small Weather (dark), Calendar, Reminders and Notes (light) over a landscape wallpaper, plus Dock, PNG', source_page_url=RP('92cdzv6c8urf1.png'), image_url=R('92cdzv6c8urf1.png'),
      crops=[('WeatherWidgetSmall','br',(470,120,812,455)),('RemindersWidgetSmall','tl',(430,790,830,1100)),('RemindersWidgetSmall','bl',(430,860,830,1165))]),
 dict(name='macOS26.Windows.ActivityMonitor.AboutThisMac.2x', src='rd/xkazl65w8vog1.png', platform='macOS Tahoe 26.3 (MacBook Air M1, 2880x1800 = 2x native)', native=True, mockup=False,
      shows='Dark-mode Tahoe windows (About This Mac, Activity Monitor) over a dark wallpaper: window corners, PNG', source_page_url=RP('xkazl65w8vog1.png'), image_url=R('xkazl65w8vog1.png'),
      crops=[('AboutThisMacWindow','tl',(100,280,500,680),None,None,'nomeasure'),('ActivityMonitorWindow','tr',(2060,300,2520,700)),('ActivityMonitorWindow','bl',(740,1170,1140,1630),None,None,'nomeasure')]),
 dict(name='iPadOS26.HomeScreen.Widgets.iPadMini', src='rd/tzihb27up81g1.jpeg', platform='iPadOS 26.1 (iPad mini, 2266x1488 = 2x native)', native=True, mockup=False,
      shows='iPad mini Home Screen: Calendar and Up Next widgets, app icons, Software Update alert (glass)', source_page_url=RP('tzihb27up81g1.jpeg'), image_url=R('tzihb27up81g1.jpeg'),
      crops=[('CalendarWidgetMedium','tl',(270,36,620,300)),('UpNextWidgetMedium','bl',(270,380,620,630)),('CalendarAppIcon','tl',(1440,85,1600,245)),('SoftwareUpdateAlert','tl',(770,370,1100,700),None,None,'nomeasure')]),
]
SCN='Six Colors review image; 1360/1380 px wide exports appear downscaled from 2x (traffic lights measure about 20 px instead of 24), so not device-native pixels.'
SCP='https://sixcolors.com/post/2025/09/macos-26-tahoe-review-power-under-glass/'
specs += [
 dict(name='SixColors.macOS26.IconJails', src='sc/tahoe-miscreants-6c.png', platform='macOS Tahoe 26 (Six Colors review)', native=False, mockup=False, notes=SCN,
      shows='Non-conforming app icons forced into Tahoe grey squircle platters, on white', source_page_url=SCP, image_url='https://sixcolors.com/wp-content/uploads/2025/09/tahoe-miscreants-6c.png',
      crops=[('GreyIconPlatter','tl',(20,30,180,190)),('GreyIconPlatter','br',(130,145,290,305))]),
 dict(name='SixColors.macOS26.LiveActivity.MenuBar', src='sc/live-activity-menubar-6c.png', platform='macOS Tahoe 26 (Six Colors review)', native=False, mockup=False, notes=SCN,
      shows='iPhone Live Activity shown on the Mac below the menu bar (dark glass card over clouds)', source_page_url=SCP, image_url='https://sixcolors.com/wp-content/uploads/2025/09/live-activity-menubar-6c.png',
      crops=[('LiveActivityCard','tr',(900,110,1330,500),None,None,'nomeasure'),('LiveActivityCard','br',(900,300,1340,665),None,None,'nomeasure')]),
 dict(name='MacRumors.iOS26.HomeScreen.Dock.Icons', src='mr/img_5632-png.2616646', platform='iOS 26 (iPhone 15/16 Pro, 1179 px)', native=True, mockup=False,
      shows='Home Screen: glass Dock platter and app icons (Phone, Safari, Messages, Proton Mail) over dark blue wallpaper, PNG', source_page_url='https://forums.macrumors.com/threads/show-us-your-iphone-ios26-home-screen.2466177/', image_url='https://forums.macrumors.com/attachments/img_5632-png.2616646/',
      crops=[('Dock','tl',(0,2150,400,2450)),('Dock','br',(760,2250,1170,2556)),('SafariIcon','tl',(330,2225,490,2385)),('ProtonMailIcon','tl',(850,2225,1010,2385))]),
]
specs += [
 dict(name='iOS27.Keyboard.Dark.PNG', src='rd/adhsbc2o846h1.png', platform='iOS 27 beta 1 (iPhone 16/17 Pro Max, 1320 px)', native=True, mockup=False,
      shows='Dark keyboard: letter keys, 123 / space / return keys (rounded rects) on the keyboard panel, PNG', source_page_url=RP('adhsbc2o846h1.png'), image_url=R('adhsbc2o846h1.png'),
      crops=[('QKey','tl',(5,1965,95,2055)),('SpaceBar','tl',(331,2480,480,2600)),('ReturnKey','br',(1150,2500,1315,2650))]),
 dict(name='iOS26.Keyboard.Light.OverBlue', src='rd/wlnj87ekuv1g1.jpeg', platform='iOS 26.2 beta 3 (iPhone 15/16 Pro, 1179 px wide crop)', native=True, mockup=False,
      shows='Keyboard with white keys on a blue-grey glass panel (text-color bug screenshot, keys blank)', source_page_url=RP('wlnj87ekuv1g1.jpeg'), image_url=R('wlnj87ekuv1g1.jpeg'),
      crops=[('QKey','tl',(2,325,100,420)),('SpaceBar','tl',(293,815,440,935)),('SpaceBar','br',(740,860,880,980))]),
 dict(name='iPadOS26.Settings.Card.Dark', src='rd/7jagvnyu407g1.jpeg', platform='iPadOS 26.2 (iPad Air/10th gen, 1640x2360 = 2x native)', native=True, mockup=False,
      shows='iPad Settings > About > iPadOS Version: grouped card on black, dark mode', source_page_url=RP('7jagvnyu407g1.jpeg'), image_url=R('7jagvnyu407g1.jpeg'),
      crops=[('VersionCard','tl',(660,225,960,525)),('VersionCard','tr',(1300,225,1640,525))]),
]
specs += [
 dict(name='iPadOS26.Windows.iPadPro12.9', src='rd/hbsw7dvr8zsf1.jpeg', platform='iPadOS 26 (iPad Pro 12.9-inch, 2732x2048 = 2x native)', native=True, mockup=False,
      shows='iPadOS 26 windowing: Phone and WhatsApp windows over a mountain wallpaper, Dock with icons', source_page_url=RP('hbsw7dvr8zsf1.jpeg'), image_url=R('hbsw7dvr8zsf1.jpeg'),
      crops=[('WhatsAppWindow','tl',(940,20,1300,380)),('WhatsAppWindow','br',(2300,1380,2680,1745)),('PhoneWindow','bl',(140,1350,500,1745))]),
]
specs += [
 dict(name='MacStories.Icons.Freeform.iOS18vsiOS26', src='ms/group-4-1757671756065.png', platform='iOS 18 vs iOS 26 app icon (MacStories comparison graphic)', native=False, mockup=False,
      notes='Editorial comparison graphic assembled by MacStories; icon pixels likely from device screenshots but scale unverified.',
      shows='Freeform app icon, iOS 18 light/dark vs iOS 26 light/dark, on black: compare the old and new icon masks', source_page_url='https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/4/', image_url='https://cdn.macstories.net/group-4-1757671756065.png',
      crops=[('iOS18Icon','tl',(0,40,170,210)),('iOS26Icon','tl',(720,40,890,210)),('iOS26Icon','br',(870,190,1040,360))]),
]
