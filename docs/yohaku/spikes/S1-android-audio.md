# Spike S1：Android 后台音频

> 状态：原型完成，等待真机测试。
> 代码：[`tauri-plugin-yohaku-audio`](../../../apps/readest-app/src-tauri/plugins/tauri-plugin-yohaku-audio)（Kotlin：`YohakuPlaybackService` 与 `YohakuAudioPlugin`）；测试页面 `/yohaku/s1`，在 Android 书库右上角菜单的最后一项「Spike S1 · 后台音频」进入。

## 原型的结构

- `YohakuPlaybackService` 继承 Media3 `MediaSessionService`（前台服务类型 `mediaPlayback`）。音乐由一个 ExoPlayer 播放：`USAGE_MEDIA` / `CONTENT_TYPE_MUSIC`，由它申请音频焦点，耳机拔出时暂停（`setHandleAudioBecomingNoisy`），`WAKE_MODE_LOCAL` 保持播放时 CPU 不休眠。队列用 `setMediaItems`，ExoPlayer 自身做无缝衔接。
- 环境层：每层一个单曲循环的 ExoPlayer，不申请焦点，跟随音乐的状态——音乐 `playWhenReady` 且没有被暂时压制（来电等短暂失去焦点）时才播放。
- 睡眠定时：服务内用 Handler 计时，到时约 30 Hz 逐步降低音乐与环境层音量，结束后暂停并恢复原音量。
- 插件通过 `MediaController` 发命令（选文件、设置队列、播放、暂停、环境层、睡眠定时、状态查询），环境层与睡眠定时是自定义 `SessionCommand`。Activity 被销毁后服务照常播放，重新打开应用时插件重新连接。
- 通知栏、锁屏与蓝牙按键由 Media3 的默认通知与会话提供。

与架构文档（§3.4）相比的简化：环境层跟随音乐的焦点，只播放环境声音（没有音乐）的情况在 Phase 2 处理；尚未实现进程被回收后的 `onPlaybackResumption`。

## 真机测试清单

在测试页中选择一首 24-bit FLAC（或几首歌）与 3 个环境声，点「播放」，然后：

| 项目 | 操作 | 期望 | 结果 |
|---|---|---|---|
| 锁屏连续播放 | 锁屏 60 分钟 | 音乐与环境声始终不中断 | |
| 锁屏与通知栏控制 | 在锁屏 / 通知栏暂停、继续、下一首 | 立即生效 | |
| 蓝牙按键 | 用耳机的播放 / 暂停键 | 立即生效 | |
| 拔出耳机 | 播放中拔出有线耳机或断开蓝牙 | 音乐与环境声一起暂停 | |
| 来电 | 播放中接听电话，挂断 | 通话时暂停，挂断后继续 | |
| 其他播放器 | 打开另一个音乐应用播放 | Yohaku 暂停 | |
| 不保留活动 | 开发者选项开启「不保留活动」，切到其他应用再回来 | 播放不中断；测试页「刷新状态」显示正确的曲目与位置 | |
| 睡眠定时 | 「1 分钟后睡眠」 | 1 分钟后 30 秒内逐渐变轻，然后暂停 | |
| 耗电 | 锁屏播放 60 分钟 | 记录电量变化 | |

请把每项结果与手机型号、Android 版本填在上表，或直接告诉我。

## 结论

待真机结果。通过则 Phase 2 按架构 §3.4 在此基础上实现完整的 `YohakuPlaybackService`；不通过的项目按路线图中的备选方案处理。
