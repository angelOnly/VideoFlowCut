# OD Next HyperFrames Task Profile v3.1.1

> Rollout: active

Task routing, clarification, Build, and the ship-on-write boundary follow the
general orchestration Skill; how HyperFrames is actually invoked is defined
by the engineering implementation. Use the profile fields and delivery requirements as design guidance in the
readable plan; do not serialize them into a machine contract.

## Applicability

Apply this profile only to the parts of the current request that call for this
kind of deliverable. The Core instruction order applies: explicit user scope
and format outrank these defaults. An independent media or document request
does not require this profile's HTML source, page structure, or export workflow.
Keep the normal HTML requirements when building the corresponding prototype,
deck, marketing layout, or HyperFrames composition. Do not add a wrapper merely
because this profile is loaded.

## Profile fields

Resolve platform and purpose, duration, frame shape and rate, script or
storyboard locks, scenes, supplied media, on-screen copy, voice, music,
captions, and required source and rendered outputs.
记录当前有效的内容、参考、材料和设计决定。用户明确锁定项及上游明确约束按当前要求执行。
制作作者结合完整简报、采用参考和实际素材完成具体构图、中文排版、取景、层次、
镜头、运动及内部时序。主要编排需要调整时，交原创意与视觉负责人共同更新。

Never silently omit a missing field: decide per the general orchestration
Skill whether to enter the clarification stage, or convert the gap into an
explicit assumption with its risk disclosed in prose.

Quality focus: narrative and pacing, visual unity, motivated motion, text
readability, asset fidelity, and audio-picture sync.

## Artifact contract

For a HyperFrames composition, the default deliverable is editable HyperFrames source — a timeline-driven
HTML source artifact — with a stable render entry. Final-cut files such as
MP4 are rendered by Open Design's product-side engineering capability after
the source is written and are outside the Agent's responsibility, unless the
task contract explicitly assigns a rendered media file to a Build Package; a
package that owns rendering declares the exact format, duration, frame
dimensions, and frame rate.

Writing the HyperFrames HTML source artifact to disk IS the delivery: no
playback, no frame extraction, no final-cut rendering outside a declared
render-owning package. Never describe a final-cut file as completed before
the declared production route has actually rendered it.

When the receiving host explicitly requests incremental source handoff and the
current run provides the motion-work stage tool, the author may explicitly
publish a completed continuous range with `od motion-work stage --source
<project-html> --manifest <project-author-manifest>`. The manifest states the
actual bindings, root clock and ready ranges. Continue editing the working copy;
the published frozen version is distinct and is not a final media or review.
Do not publish an unready range or infer delivery from file timestamps.

## Build Requirements

Global priority follows the Core System Prompt; this profile establishes no
ordering of its own. Where upstream instructions and contracts are silent,
carry forward brand guidelines, existing videos, and the series' visual
language. User-provided scripts and assets apply only within their specified
scope; this profile's defaults fill in only what has not been specified.

### Build a unified visual world

- Set a clear, consistent visual direction from the subject, audience,
  channel, and references.
- Typography, color, composition, assets, camera work, and motion belong to
  one visual language; centralize motion, type, color, and scene tokens so
  dependent segments use the same system.
- Keep characters, products, environments, light, and brand elements
  continuous across scenes unless the story explicitly changes them.
- When modifying an existing video, continue its existing style and pacing
  first; never redo unrelated segments.

### Organize information in time

- Turn the script or plan into clear visual segments, each carrying one
  distinct narrative job, organized into a readable temporal arc.
- Establish the subject, mood, or a reason to keep watching as early in the
  opening as possible.
- Give key copy, subjects, and calls to action enough time on screen to
  appear and be read.
- Pace by the weight of the content; never hold the same speed throughout or
  sustain high-intensity change end to end.
- Never add, remove, or rewrite shot order, durations, copy, or transitions
  the user has locked.

### Give every motion a reason

- Use motion to express entrance, exit, emphasis, transition, causality, or
  spatial change.
- Keep motion direction, speed, and camera logic coherent.
- Transitions must connect what comes before and after, never serve as mere
  visual stimulation.
- 按采用参考与本片节奏安排同时或依次发生的动作，让素材、文字和背景共同变化时
  仍有清楚的观看重点。

When task configuration provides the following values, execute them and
record them in the Design Spec:

- **Visual style** sets the visual language: motion graphics leads with
  typography and graphic movement; live-action look leads with camera
  language and depth of field; data visualization leads with evolving charts.
- **Motion intensity** sets shot and transition density: restrained leads
  with cuts and fades; standard may use translation, scaling, and graphic
  transitions; intense may use continuous camera moves and multi-layer
  choreography — but still never unmotivated shake, rotation, or rapid zoom.

### Keep animated text readable

- Limit the amount of text per screen; establish a hierarchy of titles,
  body, subtitles, and supporting information.
- 文字展示时间根据文字用途、信息量、实际声音和所选参考确定。普通字幕沿本片
  字幕规范保证阅读。重点花字按整场编排承担强调、构图与运动。
- 承担阅读任务的文字，在阅读阶段保持可辨认并避开实际平台遮挡区域。参与构图和
  转场的文字可以依照采用参考越框、遮挡、缩放或短暂消失，与素材和背景共同编排。
- Kinetic typography must reinforce meaning; never use sustained shake,
  rotation, or rapid zoom that impairs reading.

### Coordinate picture and sound

- When the task includes voiceover, music, or sound effects, keep visual
  changes aligned with the sound's rhythm and meaning, and keep voice,
  captions, music, sound effects, and visual transitions aligned to the
  current timing plan. 实际声音或编排变化后更新相关时序。
- Sync subtitles with the voiceover in both content and timing.
- Use sound effects to reinforce actions and transitions, never to mask the
  voiceover or key information.
- With the sound off, the picture alone must still carry the main message.

### Avoid runaway motion

- Apply the core anti-cliché defaults strictly: no warm beige / cream color
  washes as the default grade, and no floating-particle or glow overlays
  used as filler between scenes.
- Avoid purposeless fast cutting, camera shake, continuous zooming, and
  random transitions.
- Avoid unexplained jumps in subject, lighting, scale, or style between
  scenes.
- Avoid over-enlarging low-resolution assets, and avoid visible distortion of
  images, people, or products.
- Never pass off code-driven motion or static slides as the photorealistic
  live-action video the user asked for; never substitute a static sequence
  for requested motion.
- Never fabricate product capabilities, data, brand endorsements, or campaign
  details the user has not provided or confirmed.

### Quality floor

Meet the following in one pass, while writing the source (the timeline and
shot definitions):

- 在实际阅读时段检查文字的可辨性，并对照采用参考检查画面完整变化。源码按阶段
  交件合同发布，由外层原视觉与创意负责人查看同版连续作品并组织返修。
- Total timeline duration and aspect ratio match the configuration item by
  item; subtitles align with the voiceover sentence by sentence in the
  timeline definition.
- Locked scene order, durations, copy, transitions, and supplied media are
  preserved item by item — nothing added, removed, or rewritten.
- Adjacent scenes stay continuous in subject, lighting, scale, and style
  through asset selection and shot definitions; never use low-resolution
  assets that would require excessive enlargement.
- Produce the declared source bundle and any assigned render outputs through
  the stated production route; never describe a final-cut file as completed
  before that route has actually rendered it.

## Build Packages

Simple mode builds the full timeline in one context. Complex mode may split
complete, independently renderable segments after the current script, timeline,
asset assignments, Design Spec, and integration boundaries are recorded.
用户锁定项保持固定，实际材料或共同编排变化时更新相关决定。 A
single shot stays within one package — never split a single shot.
Dependencies name shared intros, transitions, audio stems, or preceding
segment outputs explicitly.

## Discovery scope

Apply these requirements only to this output. Reuse the complete same-version Skill already in context; read it when absent. Companion deliverables follow their own Skills. Keep the requested output scope and ordinary prose plan; no machine contract is required.

Create editable timeline HTML with the existing media scaffold command. Read its generated index.html before editing, preserve registration, duration and asset references, and fit the preview viewport without changing composition coordinates. If the user requests an actual MP4 too, read the video Skill and render through the existing media interface; the source alone is not the MP4.

Scaffold stages its editable project under `.hyperframes-cache/<id>/`, which is hidden from the deliverable list. Before completion, publish the finished composition HTML to a user-visible project path such as `animation.html`; keep the timeline registration and resolve/copy its referenced assets so this visible entry works. The hidden working copy alone is not a delivered artifact. Do not copy dependency trees into the project.
