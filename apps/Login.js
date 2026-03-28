import plugin from '../../../lib/plugins/plugin.js'
import common from '../../../lib/common/common.js';

export class WeixinOC extends plugin {
    constructor() {
        super({
            name: "WeixinOCAdapter",
            dsc: "微信个人号适配器",
            event: "message",
            rule: [
                {
                    reg: "^#微信(个人号)?(登录|扫码)$",
                    fnc: "Login",
                    permission: 'master'
                },
                {
                    reg: "^#微信(个人号)?(账号|列表)$",
                    fnc: "List",
                    permission: 'master'
                },
                {
                    reg: "^#微信(个人号)?(删除|移除).+$",
                    fnc: "Remove",
                    permission: 'master'
                },
                {
                    reg: "^#微信(个人号)?(设置|修改)昵称.*$",
                    fnc: "SetNickname",
                    permission: 'master'
                },
            ],
        })
    }

    // 登录
    async Login() {
        const { adapter, config, configSave, } = await import('../index.js')
        await adapter.startLogin(this.e)
    }

    // 列表
    async List() {
        const { adapter, config, configSave, } = await import('../index.js')
        const accounts = config.accounts || []
        if (accounts.length === 0) {
            this.reply("没有已保存的微信账号，请使用 #微信个人号登录", true)
            return
        }

        const list = accounts.map((a, i) => `${i + 1}. ${a.nickname || a.user_id}\n e.user_id: wx_${a.user_id}\n Bot.uin: ${a.bot_id}`)
        const online = []
        for (const [id, bot] of adapter.bots) {
            if (!bot._stop) online.push(`${bot.info.nickname || bot.info.user_id} \n e.user_id: wx_${bot.info.user_id}\n Bot.uin: ${id}`)
        }

        this.e.reply(await common.makeForwardMsg(this.e, ["已保存的账号：", ...list, "已登录的账号：", ...online, "可用指令：\n #微信个人号登录\n #微信个人号删除[序号]\n #微信个人号列表\n #微信个人号设置昵称[序号]"], this.e.msg));
    }

    // 删除账号
    async Remove() {
        const { adapter, config, configSave, } = await import('../index.js')
        const input = this.e.msg.replace(/^#微信(个人号)?(删除|移除)/, "").trim()

        // 先立即保存任何待保存的配置
        await configSave()
        adapter._pendingSave.clear()

        const index = parseInt(input) - 1

        if (!isNaN(index) && index >= 0 && index < config.accounts.length) {
            const removed = config.accounts.splice(index, 1)[0]
            await adapter.destroyBot(removed.bot_id)
            await configSave()
            this.reply(`已删除账号: ${removed.nickname || removed.user_id}`, true)
            return
        }

        // 尝试匹配 user_id, bot_id 或 nickname
        const found = config.accounts.findIndex(a => a.user_id === input || a.nickname === input || a.bot_id === input)
        if (found >= 0) {
            const removed = config.accounts.splice(found, 1)[0]
            await adapter.destroyBot(removed.bot_id)
            await configSave()
            this.reply(`已删除账号: ${removed.nickname || removed.user_id}`, true)
            return
        }

        this.reply("未找到指定账号，请使用 #微信个人号列表", true)
    }

    // 设置/修改昵称
    async SetNickname() {
        const { adapter, config, configSave } = await import('../index.js')

        const input = this.e.msg.replace(/^#微信(个人号)?(设置|修改)昵称/, "").trim()

        if (!input) {
            this.reply("请指定要修改的账号序号或标识，例如：\n#微信个人号设置昵称 1\n#微信个人号设置昵称 1 新名字", true)
            return
        }

        // 按第一个空格分割输入内容，获取目标ID和直接附带的新昵称
        let targetId = input
        let newNickname = ""
        const spaceIndex = input.indexOf(" ")

        if (spaceIndex > -1) {
            targetId = input.substring(0, spaceIndex).trim()
            newNickname = input.substring(spaceIndex + 1).trim()
        }

        // 查找指定的账号
        const accounts = config.accounts || []
        let targetAccount = null
        const index = parseInt(targetId) - 1

        if (!isNaN(index) && index >= 0 && index < accounts.length) {
            targetAccount = accounts[index]
        } else {
            targetAccount = accounts.find(a => a.user_id === targetId || a.nickname === targetId || a.bot_id === targetId)
        }

        if (!targetAccount) {
            this.reply("未找到指定账号，请使用 #微信个人号列表 查看", true)
            return
        }

        // 如果用户在指令中没有提供新昵称，则启动 awaitContext 等待用户二次输入
        if (!newNickname) {
            await this.e.reply(`请输入账号 [${targetAccount.user_id}] 的新昵称，请在120秒内发送：`, true, { recallMsg: 119 })
            try {
                const e_new = await this.awaitContext()
                if (!e_new || !e_new.msg) return // 超时或出错直接退出

                // 去除可能重复输入的指令前缀并获取新昵称
                newNickname = e_new.msg.replace(/^#微信(个人号)?(设置|修改)昵称/, "").trim()
            } catch (err) {
                return // awaitContext 异常捕获退出
            }

            if (!newNickname) {
                this.reply("昵称不能为空，已取消设置。", true)
                return
            }
        }

        // 保存前先清理并同步配置(防冲突处理)
        await configSave()
        if (adapter._pendingSave) {
            adapter._pendingSave.clear()
        }

        const oldName = targetAccount.nickname || '无'
        targetAccount.nickname = newNickname
        await configSave()

        // 如果该账号当前处于在线状态，同步更新内存中机器人的 info 数据，让#微信列表马上生效
        const bot = adapter.bots.get(targetAccount.bot_id)
        if (bot && bot.info) {
            bot.info.nickname = newNickname
        }

        this.reply(`✅修改成功，重启生效！\n账号：${targetAccount.user_id}\n旧昵称：${oldName}\n新昵称：${newNickname}`, true)
    }

}