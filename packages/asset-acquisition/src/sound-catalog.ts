/** 保存入口和使用边界，不镜像整库，不把网站认可扩大为单条素材许可。 */
export const SOUND_SOURCES = [
  { id: "mixkit", name: "Mixkit", url: "https://mixkit.co/free-sound-effects/", tags: ["短提示", "界面", "转场"], access: "公开分类候选与按需原文件下载", licenseUrl: "https://mixkit.co/license/#sfxFree" },
  { id: "a-sound-effect", name: "A Sound Effect", url: "https://www.asoundeffect.com/shop/category/interface/", tags: ["专业合集", "界面", "Whoosh"], access: "原站试听；已购授权文件通过本地导入", licenseUrl: "https://www.asoundeffect.com/" },
  { id: "freesound", name: "Freesound", url: "https://freesound.org/browse/packs/", tags: ["社区合集", "逐条 CC 许可"], access: "原站试听与合法下载；未配置 API/OAuth，不伪装自动原文件获取", licenseUrl: "https://freesound.org/help/faq/#licenses" },
  { id: "ear0", name: "耳聆网", url: "https://www.ear0.com/pack", tags: ["中文合集", "生活", "提示"], access: "原站试听，逐文件核实许可后导入", licenseUrl: "https://www.ear0.com/" },
  { id: "boom", name: "BOOM Library", url: "https://www.boomlibrary.com/sound-effects/", tags: ["专业音色", "设计音效", "付费合集"], access: "原站试听；不自动购买，只导入已有授权文件", licenseUrl: "https://www.boomlibrary.com/terms-conditions/" }
] as const;

export const MIXKIT_SOUND_CATEGORIES = ["interface", "transition", "notification", "whoosh", "click", "pop"] as const;
