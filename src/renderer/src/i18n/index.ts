import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

/**
 * 中文即键（natural key）：组件里写 t('导出成功')，中文原文就是键。
 * zh 无需资源文件（缺失时回退键原文）；英文翻译维护在 locales/en.json。
 * keySeparator/nsSeparator 关闭——文案含「.」「:」等符号不会被误拆。
 */
i18next.use(initReactI18next).init({
  lng: 'zh',
  fallbackLng: 'zh',
  keySeparator: false,
  nsSeparator: false,
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false }
})

export default i18next
