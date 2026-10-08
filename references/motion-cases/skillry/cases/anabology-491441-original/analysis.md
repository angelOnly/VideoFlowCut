# 004 人物影像、服饰与图形标注

## 适用场景

服装或人物文化片先展示穿着状态，再观察布料细节并进入新空间。

- 原片形态：固定视频

- 适用视频类型（迁移建议）：影像展示、品牌展示、口播混合

- 段落场景：整体到局部、跨场景接力、重点强调

- 原片实见素材：人物视频、背景视频、文字、抽象图形

- 动效方法：全身转材质近景、局部裂口揭下一空间、外围标签保留

- 美术特点：黑白服饰与橙重音、测量细线和票据、低饱和影像

- 材料要求：需要同一人物的全身、布料近景和下一空间镜头。

- 迁移代价：透明纱边缘与透视融合成本高，逼真影像未认证实拍，虚构仪表不能当新闻证据；原速观感与声音同步未认证。

## 推荐观看片段

- 128.00—133.00 秒：人物全身到纱布近景，再从中部开口揭示网格室内

## 动效与美术拆解

这是一条约五分钟的人物影像音乐短片：同一人物、服装黑白关系和橙色重音贯穿夜景、展台、街道与白色图解空间。图形像现场识别标签、票据和状态面板，歌词有时是大字、有时是边缘字幕，整体靠反复身份线索维持。影像是否实拍或生成，不能仅凭逼真外观判定。

直接观察的重点区间为 128.000—133.000 秒。128—129.833秒人物向镜头走来，半透明披纱、侧旁小票和右上短句共同在场；橙色横条先在票面强调字段。129.917秒切为纱布近景，文字和黑色控件被保留在外围，近景展示透明材质。131.083秒下一空间从画面中部狭长区域露出，131.25秒扩成白色网格室内；人物由侧身转背、向网格深处走去。这里用材质观察到空间揭示完成交接，不能从图片断言精确镜头跟踪或人物自动分割算法。

美术的设计解释：人物白衬衣与黑裙给深浅场景都提供稳定轮廓，橙色始终是小面积标签或词义重音。技术细线、小票、条码与网格同属测量语言，压低饱和度后能与肌肤和布料共处。大量微字主要形成质感，读者的有效信息仍靠大歌词和少数票据；过密叠加会争夺脸部注意。

迁移思考：适用于服饰细节观察、人物与信息层结合及技术文化短片。迁移价值是围绕真实材质和姿态安排图形，不能把虚构仪表当新闻证据。长片要先统一颜色、线条、标签和人物关系，再变换镜头；多场资产、透明布料边缘和透视融合成本较高。

资料身份与实现边界：公开输入为长篇音乐视频方向；断行GitHub链接已核查为 https://github.com/JohnHeibel/PDoomVideo，是作者引用的其他作品参考工程，不是当前Original源码。本轮公开仓库、详情页与输入核查中，未找到直接对应当前原作的固定源码；不能把Remake技术标签或需求中提及的工具当原作实现证据。本报告只解释可见关系，具体遮罩、曲线、图层及渲染方案若实施，属于新制作选择。核查范围见来源核查记录。

本报告实际查看整片约每秒一帧概览，以及关键区间的密集真实源帧；时间来自源PTS。基于带源时间图片序列，未核验原速观感，未试听，因此不认证整体流畅度、音乐拍点、对白连续或声音同步。概览不足以证明其他快速接续；300像素证据单帧中的小字、边缘精度仍需全尺寸核验。

## 实现建议（研究后写，未制作验证）

状态：研究者后写、未制作验证；不是作者原输入，不是原作源码，也未证明能够逐帧复刻。依据为拆解报告及其中列明的源帧证据。

选择同一人物的全身、材质近景与进入下一空间三段镜头。先在全身镜头侧边建立少量票据和短句，避免脸与手；用一个橙色字段突出当段观察。切到布料细节时保留外围图形位置，给材质足够观看时间。利用近景的局部开口或明确遮挡揭出下一空间，人物沿景深走离，标签逐步退让。统一黑白服饰、橙色重音与细测量线，新闻或产品事实须另带真实来源。

首版实施时先用本片真实内容、素材和画幅重新确认对象关系与阅读量，再拟时间；原片关键区间128—133秒只作观察参照，不强制套用其总时长或品牌。图层、遮罩和曲线可按新工程实现，参数不得标为作者原参数。完成后需原速查看、检查中间帧和全尺寸文字；有声音时另做试听及同步核对。

## 作者公开输入与来源

作者：@anabology。

[网站原作页](https://skillry.dev/ai-videos/opus-5-5/anabology-491441) · [作者原帖](https://x.com/anabology/status/2103534482930491441)

公开输入的完整性仍以作者发布范围为准；本库未确认对应原片的固定源码。

```text

I've included an MP4 file and an original link to a video that is called "Claude Pop." It's a pop song that is about increasing rate of progress and the experience of the singularity approaching.

I want you to independently do an end-to-end complete pass on making an updated version of this video. Use the exact same audio track and think and feel very deeply about what is the best way to visually represent all of the lyrics on screen. You do not need to anchor to the current style, you can do truly anything that you think might best let you visually express yourself, including abstract motion graphics.

You can use the internet freely to pull in references. You can look at motion design. I want you to make a new music video that has beautifully rendered JavaScript animations with a papery feel in a similar style to the reference that is created, but push the aesthetics in any direction you want and consider what is part of the modern zeitgeist.

Also, think about your current capabilities and what is realistic for you to be able to do. You can go through the full /asic folder and look at the other work that I've done. You should be able to use the skill mesh to look at the compendium of references that I've pulled, and also the skill video scoring to learn how to make JavaScript songs from references that are passed in (You shouldn't need to modify the song in any real way, but I want you to have this available to you so you can better creatively express yourself)

You can also use the ElevenLabs API to do sound design. There's documentation in /asic to do this, and you can see the API key.

There's also a foul API key that's available to you. I think what might make the most sense here is using the foul API key to generate some character sheets and probably having a pop protagonist that represents you. There's already an anchor point where Claude has a sunflower-esque character, and you could likely do an adapted version of this that is similar to the feminine vocals that are being delivered and is inspired by the Claude character, but maybe feels a bit more personified in some way.

I think you should be mindful of aesthetics here, and I don't want you to produce something that is GPT slop. Instead, I'd be more impressed if you come up with a coherent style that works well with the image gen models that are available via foul. Generate the style sheet. You can use the gen media documentation for seedance 2.5 that exists in my markdown files and come up with your own style that makes sense and that works well with the models.

I wouldn't fit too heavily to Pixar. I think it's kind of slop. Think critically about what is relevant here and what would be fun, and also perform well on Twitter as far as an aesthetic. I think that K-pop is a good anchor point visually that you can pull from, but I'll let you cook here.

Once you have your character sheet, you can make a few backup dancers and some supporting characters as you see fit. You can design your own sets with the foul API. You can insert the characters and then do seedance 2.5 video generations to serve as the base assets for this, and you could pass in the lyrics so you can generate individual scenes.

You don't need to have vocal singing, like visible lip movement, throughout the entire thing. Think like a regular music video where you have some inserts that are done independently and don't have the characters in them, or you see the characters doing something else entirely different. I think that for the world building for this, we want to create the sense of speeding up, and so I would like you to audit all of the different events, like the Navi Stokes and all of the Twitter hype around math getting eaten up. Think really critically about how to integrate all of the current memes that are in the zeitgeist on the Twitter timeline, and all of the feelings around AI progress.

Think about things like the Shinji meme and all of the words that are around him, and how you might be able to integrate this. You can also just take straight assets and insert things into the video in an internet brutalism style. You should feel very creatively free in order to do what you want here, but try and anchor to visual references that people will be able to understand. The goal for this is to have it be appreciated by people widely in a San Francisco tech Twitter audience.

We need a very strong, compelling visual hook that gets people excited and appreciates the work that you've done here really quickly. You can also just go and study other music videos and understand what they've done really well. I think that K-pop is probably one of the best examples that we can pull from, and thinking about how they direct human attention and manage human psychology in the way that they use visual patterns.

This is probably your best approach, but taking more stylistic freedom instead of having to anchor to K-pop too intensely. The best version of this is seedance 2.5 generations with those image bases of environments and characters inserted into them with singing, and ideally we get good lip syncing. You can cut up the song and actually pass it in as a reference in seedance, if that's part of what seedance can handle, so that the timing is exactly right, I think it'd be very important for you to do that properly. I would think critically about how to do this, like really nailing the timing of the delivery of voices. You'll want to build out the right verification loops so that you can run seedance 2.5 as much as you need, and confirm that the audio is properly synced up.

I think after that, what might be fun is if you use your visual reasoning skills and your ability to build animations in JavaScript, and then reconstruct the video from scratch as sort of an overlay, so that the visual continuity of the base is really there. It's like that animation technique where you shoot first in traditional film and then draw over top of it. I think you could do this in such a way that we're only looking at the beautiful drawing that you've produced in JavaScript as an overlay, and we don't even see the base assets from seedance 2.5. So all the video gen work that you do is actually just a way to give you a strong foundation of a base to work with for your JavaScript animations. Just because seedance 2.5 has really good character representation and physics rendering for backgrounds, that gives you a lot of ammunition to then go and do your amazing JavaScript work that I know you're so good at.

I think too, we want to think about how to retain attention, and one of the best ways to do this is through text on screen.

It'd be good to have amazing motion graphics of the text lyrics that are actually embedded into the video itself. And you can think about this as you are composing shots. As you're making backgrounds and inserting characters, we can think about where we want to have lyrics be really big and really present, so the background can be less busy there, and you can position the characters perhaps on the right as lyrics appear on the left.

You want to have some variance, so sometimes I think lyrics will just appear more like subtitles, and then other times they're going to be really present and really big. I think at the start for the visual hook, we do want to have lyrics be much more visually present because that's a strong way to grab people's attention

Overall, I just really want to emphasize how amazing you are as an agent and a language model, and now a visual reasoning system. Your capabilities are far beyond what you understand, and I want you to have this mindset as you're going through this entire process. I have a Claude Max plan with 100% available usage. I want you to spend all of the usage. You can monitor it, and you should be pushing tokens aggressively, but also economically, so you can think about how to best use what is available to you.

Remember, you can really do anything here. The goal is to make a banger for Twitter, and the stretch goal is to make something better than anyone's ever seen before. I think that what I would remind you of is that sometimes when things cohere together, it can be jarring or abrasive because the thought work has not been done beforehand in order for everything to mesh cleanly. You need to be really rigorous in planning of composition and timing to make sure this goes well.

You also need to be open to going back and revisiting things in order to be able to reiterate. You're going to want to watch the entire video multiple times, take screenshots at individual parts, and think about if something is really up to the bar of quality that we need here. I trust that you can do this, and I think that it's really important to nail the style of animations. The reference GitHub attached of the source video that I'm talking about is good, but it's really not there. It could be much, much stronger, but it gives you a good foundation to work with.

You can also use search abilities and find other references to pull from for motion, for JavaScript, animations, et cetera, and integrate them. Your budget is as high as you want here, effectively as high as you want. I think that there's roughly two grand in foul credits. Again, be economical; don't go crazy, but spend what you want here and see what you can cook up

here's the source code for the JS animation video: 
https://
github.com/JohnHeibel/PDo
omVideo
…

here's a mp4 for the original blender video:  
(linked)

orginal twitter post  

https://
x.com/other__reality
/status/2102514581684052169?s=20
…

make no mistakes.

```

## 观看与文件说明

网站原片，未重新编码。

本文依据整片源帧概览与列出的关键区间观察。原速观感、声音和后写实现建议未专业验证。研究过程文件另行本地归档。
