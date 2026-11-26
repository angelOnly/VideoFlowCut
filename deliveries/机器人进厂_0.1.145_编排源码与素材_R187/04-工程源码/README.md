# 动效源码和绑定

[整片动效源码](整片动效.html) 是 R187 实际登记的 HyperFrames 单页源码。它使用 VideoFlowCut 提供的固定运行库、GSAP、项目字体与 23 个受管视频槽；直接在普通浏览器双击打开不能自动取得项目素材和运行时。

[原始作品输入](原始作品输入.json) 保留 R187 登记时的尺寸、帧率、时长、字体槽和 Asset ID。[素材绑定及相对路径](素材绑定及相对路径.json) 在保留 Asset ID 的同时，为每一视频槽增加 localPath 指向本包 [素材视频](../06-素材视频/)；sourceStartMs / sourceEndMs 为素材毫秒半开区间，startFrame / endFrame 为作品根帧半开区间。

[完整旁白](../05-成片与声音/完整旁白.wav)、[字幕](../05-成片与声音/字幕.ass) 和 [字幕字体](../05-成片与声音/NotoSansSC-Bold.otf) 在外部合成，不包含在 HTML 内。请先通过对应项目或运行时将本包素材登记为受管资产并重新映射 ID，再按实际 runtime 合成，不能把相对路径字段视为平台已自动导入。

作品可追溯身份是 revision 187，motion work 604e63ef9b1e3d5b4cf44337e794e7fb94fd288f2b1b575523835e3e83a0c8ff，版本 c49389a5e501ddae1e28f61a708e97f34477f71cbce41ad4ba44c492edfbeea8。两处短段使用该版本，底层完整画面为 R185 同源版本并在这两处进行按帧替换。