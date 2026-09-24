SHORT={'Settings.InsetGroupedSections.Section1':315,'Settings.InsetGroupedSections.Section2':160,'AppleTV.Widget':1170,'AppleTV.Thumbnail':185,
'Reminders.Icons.Widget':500,'Reminders.Icons.SettingsIcon':222,'WalletBanner.Banner':264,'iPhoneSE.WiFiTile':268,'iPhoneSE.AirDropTile':268,
'FolderA':190,'QuoraIcon':190,'StayInformedCard':504,'IndexingCard':442,'TalkToSiriRow':163,'LiveActivity.LockScreen.LiveActivity':590,
'BoardingPass.Pass':1321,'TerminalTile':411,'FindTile':425,'PhotosWidgetLarge':695,'ClockWidgetSmall':315,'FaceTimeIcon':157,'DisplayModule':242,
'IconComposer.iOS26':2048,'IconComposer.iOS27':1024,'Render2048':2048,'OutlookWidgetSmall':498,'WeatherWidgetSmall':498,'ContextMenu':734,
'2x.WeatherWidgetSmall':319,'RemindersWidgetSmall':322,'ActivityMonitorWindow':1223,'AboutThisMacWindow':550,'CalendarWidgetMedium':241,'UpNextWidgetMedium':238,
'CalendarAppIcon':150,'GreyIconPlatter':200,'LiveActivityCard':441,'Dock.Icons.Dock':320,'SafariIcon':192,'ProtonMailIcon':192,'QKey':100,'Dark.PNG.SpaceBar':129,
'OverBlue.SpaceBar':128,'ReturnKey':129,'WhatsAppWindow':1628,'PhoneWindow':740,'iOS18Icon':240,'iOS26Icon':234,'CalendarWindow':None,'VersionCard':None}
def short_for(fn):
    best=None
    for k,v in SHORT.items():
        if k in fn and (best is None or len(k)>len(best[0])): best=(k,v)
    return best[1] if best else None
