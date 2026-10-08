export type SupportedLocale = 'en' | 'tr';

export interface Translations {
  common: {
    appName: string;
    appSubtitle: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    discard: string;
    confirmAndSave: string;
    retake: string;
    all: string;
    bp: string;
    glucose: string;
    pulse: string;
    notes: string;
    notesPlaceholder: string;
    savedSuccessfully: string;
    savedMessage: string;
    error: string;
    deleteConfirmTitle: string;
    deleteConfirmMsg: string;
    resetDemoData: string;
  };
  navigation: {
    home: string;
    scan: string;
    trends: string;
    export: string;
  };
  dashboard: {
    scanHeroTitle: string;
    scanHeroSubtitle: string;
    latestReadings: string;
    logbook: string;
    logBpManually: string;
    logGlucoseManually: string;
    logPulseManually: string;
    noRecentReadings: string;
    noReadingsFilter: string;
    scanDevicePrompt: string;
    pulseBpm: string;
  };
  camera: {
    alignDevice: string;
    alignBp: string;
    alignGlucose: string;
    alignPulse: string;
    antiGlareTip: string;
    gallery: string;
    modeAuto: string;
    modeBp: string;
    modeGlucose: string;
    modePulse: string;
    analyzingTitle: string;
    analyzingSubtitle: string;
    permissionTitle: string;
    permissionBody: string;
    grantAccess: string;
    returnDashboard: string;
    apiKeyTitle: string;
    apiKeyDesc: string;
    apiKeyPlaceholder: string;
    saveKey: string;
  };
  verification: {
    title: string;
    bpSubtitle: string;
    glucoseSubtitle: string;
    pulseSubtitle: string;
    whoClassification: string;
    sys: string;
    dia: string;
    pulse: string;
    glucoseValue: string;
    mealContext: string;
    fasting: string;
    preMeal: string;
    postMeal: string;
    random: string;
    bedtime: string;
    screenPreview: string;
    confidenceMatch: string;
    manualVerification: string;
    visionAiFallback: string;
    onDeviceOcr: string;
    incompleteBp: string;
    incompleteGlucose: string;
    incompletePulse: string;
  };
  status: {
    optimal: string;
    normal: string;
    elevated: string;
    stage1: string;
    stage2: string;
    crisis: string;
    hypotension: string;
    hypoglycemia: string;
    prediabetes: string;
    diabetes: string;
    normalDesc: string;
    elevatedDesc: string;
    stage1Desc: string;
    stage2Desc: string;
    crisisDesc: string;
    hypotensionDesc: string;
    hypoglycemiaDesc: string;
    prediabetesDesc: string;
    diabetesDesc: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    days: string;
    bloodPressureTab: string;
    bloodGlucoseTab: string;
    bpHeading: string;
    bpSubheading: string;
    bpStatsSummary: string;
    avgBp: string;
    minMaxSys: string;
    avgPulse: string;
    inTargetNormal: string;
    whoDistribution: string;
    glucoseHeading: string;
    glucoseSubheading: string;
    glucoseSummary: string;
    avgGlucose: string;
    minMaxGlucose: string;
    fastingCount: string;
    glucoseNormalRange: string;
    noRecordsPeriod: string;
  };
  export: {
    title: string;
    subtitle: string;
    reportDetails: string;
    patientName: string;
    patientPlaceholder: string;
    totalMeasurements: string;
    coveragePeriod: string;
    pdfTitle: string;
    pdfDesc: string;
    generatePdf: string;
    csvTitle: string;
    csvDesc: string;
    exportCsv: string;
    privacyNotice: string;
    privacyBody: string;
    noRecordsExport: string;
  };
}

export const translations: Record<SupportedLocale, Translations> = {
  en: {
    common: {
      appName: 'PulseGluco',
      appSubtitle: 'Smart Health & Device Scanner',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      discard: 'Discard',
      confirmAndSave: '✓ Confirm & Save',
      retake: 'Discard / Retake',
      all: 'All',
      bp: 'BP',
      glucose: 'Glucose',
      pulse: 'Pulse',
      notes: 'Notes & Observations',
      notesPlaceholder: 'e.g. Left arm, resting for 5 mins',
      savedSuccessfully: 'Saved Successfully',
      savedMessage: 'Your measurement has been saved to your offline logbook.',
      error: 'Error',
      deleteConfirmTitle: 'Delete Reading',
      deleteConfirmMsg: 'Are you sure you want to remove this health record?',
      resetDemoData: 'Reset Demo Data',
    },
    navigation: {
      home: 'Home',
      scan: 'Scan',
      trends: 'Trends',
      export: 'Export',
    },
    dashboard: {
      scanHeroTitle: 'Scan Device Screen',
      scanHeroSubtitle: 'Photograph blood pressure monitor, glucometer, or pulse oximeter',
      latestReadings: 'LATEST READINGS',
      logbook: 'MEASUREMENT LOGBOOK',
      logBpManually: '+ Log BP Manually',
      logGlucoseManually: '+ Log Glucose Manually',
      logPulseManually: '+ Log Pulse Manually',
      noRecentReadings: 'No recent readings',
      noReadingsFilter: 'No readings found for this filter.',
      scanDevicePrompt: 'Tap "Scan Device" below to capture your first reading.',
      pulseBpm: 'Pulse',
    },
    camera: {
      alignDevice: 'Align Device LCD Screen',
      alignBp: 'Align Blood Pressure Display',
      alignGlucose: 'Align Glucometer Screen',
      alignPulse: 'Align Pulse Monitor or Oximeter',
      antiGlareTip: 'Hold steady • Avoid glare & reflections',
      gallery: '🖼️ Gallery',
      modeAuto: 'Auto',
      modeBp: 'BP',
      modeGlucose: 'Glucose',
      modePulse: 'Pulse',
      analyzingTitle: 'Analyzing Device Screen',
      analyzingSubtitle: 'Detecting digits, contrast normalization & spatial parsing...',
      permissionTitle: 'Camera Permission Required',
      permissionBody:
        'PulseGluco needs access to your camera to scan blood pressure monitors, glucometer LCD screens, and pulse oximeters for offline OCR extraction.',
      grantAccess: 'Grant Camera Access',
      returnDashboard: 'Return to Dashboard',
      apiKeyTitle: 'Vision AI (Gemini 1.5)',
      apiKeyDesc: 'Optional: Enter your free Gemini API key to enable high-accuracy LCD screen detection.',
      apiKeyPlaceholder: 'Enter Gemini API Key',
      saveKey: 'Save Key',
    },
    verification: {
      title: 'Verify Measurement',
      bpSubtitle: 'Blood Pressure Monitor Reading',
      glucoseSubtitle: 'Blood Glucose Meter Reading',
      pulseSubtitle: 'Pulse Monitor / Oximeter Reading',
      whoClassification: 'WHO / ADA CLASSIFICATION',
      sys: 'SYS (mmHg)',
      dia: 'DIA (mmHg)',
      pulse: 'PULSE (bpm)',
      glucoseValue: 'Blood Glucose Value',
      mealContext: 'MEAL CONTEXT',
      fasting: '🌅 Fasting',
      preMeal: '🥗 Pre-Meal',
      postMeal: '🍽️ Post-Meal (2h)',
      random: '⏱️ Random',
      bedtime: '🌙 Bedtime',
      screenPreview: '📷 Screen Capture Preview',
      confidenceMatch: 'Match',
      manualVerification: 'Manual Verification',
      visionAiFallback: 'Vision AI Fallback',
      onDeviceOcr: 'On-Device OCR',
      incompleteBp: 'Please enter both Systolic and Diastolic values.',
      incompleteGlucose: 'Please enter a valid Blood Glucose number.',
      incompletePulse: 'Please enter a valid Pulse reading.',
    },
    status: {
      optimal: 'Normal / Optimal',
      normal: 'Normal',
      elevated: 'Elevated',
      stage1: 'Hypertension Stage 1',
      stage2: 'Hypertension Stage 2',
      crisis: 'Hypertensive Crisis',
      hypotension: 'Low Blood Pressure',
      hypoglycemia: 'Hypoglycemia',
      prediabetes: 'Impaired / Prediabetes',
      diabetes: 'High Glucose / Diabetes',
      normalDesc: 'Systolic < 120 mmHg and Diastolic < 80 mmHg',
      elevatedDesc: 'Systolic 120–129 mmHg and Diastolic < 80 mmHg',
      stage1Desc: 'Systolic 130–139 mmHg or Diastolic 80–89 mmHg',
      stage2Desc: 'Systolic 140–179 mmHg or Diastolic 90–119 mmHg',
      crisisDesc: 'Systolic ≥ 180 mmHg or Diastolic ≥ 120 mmHg (Seek emergency care)',
      hypotensionDesc: 'Systolic < 90 mmHg or Diastolic < 60 mmHg',
      hypoglycemiaDesc: 'Blood sugar is dangerously low',
      prediabetesDesc: 'Elevated glucose levels',
      diabetesDesc: 'Significantly elevated glucose levels',
    },
    analytics: {
      title: 'Trends & Analytics',
      subtitle: 'WHO / ADA Longitudinal Health Patterns',
      days: 'Days',
      bloodPressureTab: '❤️ Blood Pressure',
      bloodGlucoseTab: '🩸 Blood Glucose',
      bpHeading: 'SYSTOLIC & DIASTOLIC PRESSURE',
      bpSubheading: 'Tap points for reading details',
      bpStatsSummary: 'BP STATISTICAL SUMMARY',
      avgBp: 'Average BP',
      minMaxSys: 'SYS Min / Max',
      avgPulse: 'Avg Pulse',
      inTargetNormal: 'In Target (Normal)',
      whoDistribution: 'WHO Stage Distribution',
      glucoseHeading: 'BLOOD GLUCOSE FLUCTUATIONS',
      glucoseSubheading: 'Target Zone: 70 - 140 mg/dL',
      glucoseSummary: 'GLUCOSE SUMMARY',
      avgGlucose: 'Average Glucose',
      minMaxGlucose: 'Min / Max',
      fastingCount: 'Fasting Count',
      glucoseNormalRange: 'Normal Range',
      noRecordsPeriod: 'No measurements recorded in this time range.',
    },
    export: {
      title: 'Medical Export',
      subtitle: 'Generate Doctor Reports & Data Spreadsheets',
      reportDetails: 'Report Details',
      patientName: 'Patient Name / ID',
      patientPlaceholder: 'e.g. John Doe / Medical ID',
      totalMeasurements: 'Total Measurements',
      coveragePeriod: 'Coverage Period',
      pdfTitle: 'Physician PDF Summary',
      pdfDesc:
        'Structured hospital-grade PDF report with blood pressure statistics, WHO classifications, and complete chronological logbook.',
      generatePdf: 'Generate & Share PDF',
      csvTitle: 'Raw CSV Spreadsheet',
      csvDesc:
        'Comma-separated file containing raw timestamps, systolic, diastolic, pulse, glucose levels, units, and tags for EHR or Excel analysis.',
      exportCsv: 'Export CSV File',
      privacyNotice: '🔒 HIPAA & GDPR Privacy Notice',
      privacyBody:
        'All measurements, OCR processing logs, and health records are stored offline on your local device SQLite storage. Reports are generated directly on-device without cloud intermediaries.',
      noRecordsExport: 'There are no measurements available to export.',
    },
  },
  tr: {
    common: {
      appName: 'PulseGluco',
      appSubtitle: 'Akıllı Sağlık ve Cihaz Tarayıcı',
      save: 'Kaydet',
      saving: 'Kaydediliyor...',
      cancel: 'İptal',
      delete: 'Sil',
      discard: 'Vazgeç',
      confirmAndSave: '✓ Doğrula ve Kaydet',
      retake: 'Vazgeç / Yeniden Çek',
      all: 'Tümü',
      bp: 'Tansiyon',
      glucose: 'Şeker',
      pulse: 'Nabız',
      notes: 'Notlar ve Gözlemler',
      notesPlaceholder: 'Örn. Sol kol, 5 dk dinlendikten sonra',
      savedSuccessfully: 'Başarıyla Kaydedildi',
      savedMessage: 'Ölçümünüz çevrimdışı günlüğünüze kaydedildi.',
      error: 'Hata',
      deleteConfirmTitle: 'Kaydı Sil',
      deleteConfirmMsg: 'Bu sağlık kaydını silmek istediğinizden emin misiniz?',
      resetDemoData: 'Demo Verileri Sıfırla',
    },
    navigation: {
      home: 'Ana Sayfa',
      scan: 'Tara',
      trends: 'Trendler',
      export: 'Dışa Aktar',
    },
    dashboard: {
      scanHeroTitle: 'Cihaz Ekranını Tara',
      scanHeroSubtitle: 'Tansiyon aletinizi, glukometrenizi veya oksimetrenizi fotoğraflayın',
      latestReadings: 'SON ÖLÇÜMLER',
      logbook: 'ÖLÇÜM GÜNLÜĞÜ',
      logBpManually: '+ Manuel Tansiyon',
      logGlucoseManually: '+ Manuel Şeker',
      logPulseManually: '+ Manuel Nabız',
      noRecentReadings: 'Henüz ölçüm yok',
      noReadingsFilter: 'Bu filtreye ait kayıt bulunamadı.',
      scanDevicePrompt: 'İlk ölçümünüzü kaydetmek için aşağıdaki "Tara" butonuna basın.',
      pulseBpm: 'Nabız',
    },
    camera: {
      alignDevice: 'Cihaz LCD Ekranını Hizalayın',
      alignBp: 'Tansiyon Aleti Ekranını Hizalayın',
      alignGlucose: 'Glukometre Ekranını Hizalayın',
      alignPulse: 'Nabız Ölçer veya Oksimetreyi Hizalayın',
      antiGlareTip: 'Sabit tutun • Parlama ve yansımadan kaçının',
      gallery: '🖼️ Galeri',
      modeAuto: 'Oto',
      modeBp: 'Tansiyon',
      modeGlucose: 'Şeker',
      modePulse: 'Nabız',
      analyzingTitle: 'Cihaz Ekranı Analiz Ediliyor',
      analyzingSubtitle: 'Rakamlar, kontrast iyileştirme ve alan ayrıştırması yapılıyor...',
      permissionTitle: 'Kamera İzni Gerekli',
      permissionBody:
        'PulseGluco, tansiyon aleti, glukometre ve oksimetre ekranlarındaki değerleri çevrimdışı okumak için kameranıza erişim gerektirir.',
      grantAccess: 'Kamera İzni Ver',
      returnDashboard: 'Ana Sayfaya Dön',
      apiKeyTitle: 'Görsel Yapay Zeka (Gemini 1.5)',
      apiKeyDesc: 'İsteğe bağlı: Yüksek doğrulukta ekran tanıma için ücretsiz Gemini API anahtarınızı girin.',
      apiKeyPlaceholder: 'Gemini API Anahtarını Girin',
      saveKey: 'Anahtarı Kaydet',
    },
    verification: {
      title: 'Ölçümü Doğrula',
      bpSubtitle: 'Tansiyon Aleti Ekran Okuması',
      glucoseSubtitle: 'Kan Şekeri Cihazı Okuması',
      pulseSubtitle: 'Nabız Ölçer / Oksimetre Okuması',
      whoClassification: 'DSÖ / ADA TIBBİ SINIFLANDIRMASI',
      sys: 'SİSTOLİK (Büyük)',
      dia: 'DİYASTOLİK (Küçük)',
      pulse: 'NABIZ (bpm)',
      glucoseValue: 'Kan Şekeri Değeri',
      mealContext: 'ÖLÇÜM DURUMU',
      fasting: '🌅 Açlık',
      preMeal: '🥗 Yemek Öncesi',
      postMeal: '🍽️ Tokluk (2. Saat)',
      random: '⏱️ Rastgele',
      bedtime: '🌙 Gece / Yatmadan Önce',
      screenPreview: '📷 Ekran Yakalama Önizlemesi',
      confidenceMatch: 'Eşleşme',
      manualVerification: 'Manuel Doğrulama',
      visionAiFallback: 'Yapay Zeka Destekli',
      onDeviceOcr: 'Cihaz İçi OCR',
      incompleteBp: 'Lütfen hem Büyük (SYS) hem Küçük (DIA) tansiyon değerlerini girin.',
      incompleteGlucose: 'Lütfen geçerli bir kan şekeri değeri girin.',
      incompletePulse: 'Lütfen geçerli bir nabız değeri girin.',
    },
    status: {
      optimal: 'Normal / İdeal',
      normal: 'Normal',
      elevated: 'Yüksek (Prehipertansiyon)',
      stage1: 'Evre 1 Hipertansiyon',
      stage2: 'Evre 2 Hipertansiyon',
      crisis: 'Hipertansif Kriz',
      hypotension: 'Düşük Tansiyon',
      hypoglycemia: 'Hipoglisemi (Düşük Şeker)',
      prediabetes: 'Prediyabet (Gizli Şeker)',
      diabetes: 'Diyabet (Yüksek Şeker)',
      normalDesc: 'Sistolik < 120 mmHg ve Diyastolik < 80 mmHg',
      elevatedDesc: 'Sistolik 120–129 mmHg ve Diyastolik < 80 mmHg',
      stage1Desc: 'Sistolik 130–139 mmHg veya Diyastolik 80–89 mmHg',
      stage2Desc: 'Sistolik 140–179 mmHg veya Diyastolik 90–119 mmHg',
      crisisDesc: 'Sistolik ≥ 180 mmHg veya Diyastolik ≥ 120 mmHg (Acil müdahale gerekir)',
      hypotensionDesc: 'Sistolik < 90 mmHg veya Diyastolik < 60 mmHg',
      hypoglycemiaDesc: 'Kan şekeri tehlikeli düzeyde düşük',
      prediabetesDesc: 'Bozulmuş açlık şekeri / gizli şeker',
      diabetesDesc: 'Belirgin şekilde yüksek kan şekeri',
    },
    analytics: {
      title: 'Trendler ve Analiz',
      subtitle: 'DSÖ / ADA Zaman Çizelgesi Sağlık Modelleri',
      days: 'Gün',
      bloodPressureTab: '❤️ Tansiyon',
      bloodGlucoseTab: '🩸 Kan Şekeri',
      bpHeading: 'SİSTOLİK VE DİYASTOLİK BASINÇ',
      bpSubheading: 'Detaylar için grafik noktalarına dokunun',
      bpStatsSummary: 'TANSİYON İSTATİSTİKLERİ',
      avgBp: 'Ortalama Tansiyon',
      minMaxSys: 'Büyük T. Min / Maks',
      avgPulse: 'Ortalama Nabız',
      inTargetNormal: 'Hedefte (Normal)',
      whoDistribution: 'DSÖ Evre Dağılımı',
      glucoseHeading: 'KAN ŞEKERİ DEĞİŞİMLERİ',
      glucoseSubheading: 'Hedef Aralık: 70 - 140 mg/dL',
      glucoseSummary: 'ŞEKER İSTATİSTİKLERİ',
      avgGlucose: 'Ortalama Şeker',
      minMaxGlucose: 'Min / Maks',
      fastingCount: 'Açlık Ölçümü',
      glucoseNormalRange: 'Normal Aralıkta',
      noRecordsPeriod: 'Bu zaman aralığında kaydedilmiş ölçüm bulunamadı.',
    },
    export: {
      title: 'Tıbbi Rapor ve Dışa Aktarma',
      subtitle: 'Doktor Raporları ve Veri Tabloları Oluşturun',
      reportDetails: 'Rapor Detayları',
      patientName: 'Hasta Adı / Takma Ad',
      patientPlaceholder: 'Örn. Ahmet Yılmaz / Hasta No',
      totalMeasurements: 'Toplam Ölçüm',
      coveragePeriod: 'Zaman Aralığı',
      pdfTitle: 'Hekim Özeti (PDF)',
      pdfDesc:
        'Tansiyon istatistikleri, DSÖ sınıflandırmaları ve tam ölçüm geçmişini içeren hastane standartlarında PDF raporu.',
      generatePdf: 'PDF Oluştur ve Paylaş',
      csvTitle: 'Ham CSV Tablosu',
      csvDesc:
        'Tüm ölçüm zamanlarını, tansiyon, nabız, şeker değerlerini içeren Excel uyumlu virgülle ayrılmış veri dosyası.',
      exportCsv: 'CSV Dosyasını Paylaş',
      privacyNotice: '🔒 KVKK ve GDPR Gizlilik Bildirimi',
      privacyBody:
        'Tüm ölçümler, OCR kayıtları ve sağlık verileriniz cihazınızdaki yerel SQLite veri tabanında güvenle saklanır. Raporlar buluta gönderilmeden doğrudan cihazınızda oluşturulur.',
      noRecordsExport: 'Dışa aktarılacak ölçüm bulunamadı.',
    },
  },
};
