# TRSS-WeChat-OC-Plugin

Yunzai-Bot / TRSS-Yunzai 的微信个人号适配器插件，基于 ilink 协议实现。

## 功能

| 功能 | 状态 |
|------|------|
| 扫码登录 | ✅ |
| 私聊收发文本 | ✅ |
| 私聊收发图片 | ✅ |
| 私聊收发视频 | ✅ |
| 私聊收发文件 | ✅ |
| 多账号管理 | ✅ |
| 合并转发消息 | ⚠️ 降级为多条消息发送 |
| 群聊 | ❌ |
| 语音消息 | ❌ 接收后转文字 |
| 撤回消息 | ❌ |

## 安装

```bash
cd Yunzai-Bot/plugins
git clone https://github.com/AIGC-Yunzai/TRSS-WeChat-OC-Plugin.git TRSS-WeChat-OC-Plugin
cd TRSS-WeChat-OC-Plugin
pnpm install
```

重启 Yunzai 生效。

## 指令

| 指令 | 说明 |
|------|------|
| `#微信登录` | 扫码登录新账号 |
| `#微信列表` / `#微信账号` | 查看已登录账号 |
| `#微信删除 <序号/user_id/昵称>` | 删除指定账号 |

## 配置

文件位置：`config/WeixinOC.yaml`

```yaml
tips: ""
permission: master
base_url: "https://ilinkai.weixin.qq.com"
cdn_base_url: "https://novac2c.cdn.weixin.qq.com/c2c"
bot_type: "3"
qr_poll_interval: 2000
long_poll_timeout: 35000
api_timeout: 15000
accounts: []
```

- `accounts` 字段由插件自动维护，无需手动修改
- `permission` 控制指令权限，默认仅主人可用

## 安全提示

以下信息具有敏感性，请勿公开：

- `config/WeixinOC.yaml` 配置文件
- 日志中的 `token`、`context_token`、`encrypt_query_param`
- 截图中的二维码

## 致谢

- 协议参考：[AstrBot](https://github.com/AstrBotDevs/AstrBot)
- 架构参考：[Yunzai-KOOK-Plugin](https://github.com/TimeRainStarSky/Yunzai-KOOK-Plugin)

## License

MIT
