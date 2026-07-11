# Palworld Server Tool v1.0.0

这是一次主版本重构，重点是恢复当前 Palworld 服务端版本下的可用性，并建立可重复的多平台发布流程。

## 主要更新

- 使用 React、TypeScript、Vite 和 shadcn/ui 完整重构前端，支持桌面端与移动端。
- 服务端设置同步最新官方字段和 pal-conf 中文定义，共 117 个非 RCON 配置项。
- 集成新版 `sav_cli`，可正确解析当前 Oodle 压缩存档，并支持校验、导出 JSON、重建和往返验证。
- 完整接入官方 REST API 管理能力，修正跨平台玩家标识和敏感字段处理。
- 移除 RCON、旧 Vue 前端、旧 pal-conf 子模块和过时的存档解析器下载流程。
- 新增应用图标、浏览器 favicon 与 Windows EXE 图标。

## 下载文件

- `pst_v1.0.0_windows_x86_64.zip`
- `pst_v1.0.0_linux_x86_64.tar.gz`
- `pst_v1.0.0_linux_aarch64.tar.gz`
- 对应平台的 `pst-agent` 独立程序
- `SHA256SUMS.txt`

完整包包含主程序、对应平台的 `sav_cli`、GPL 许可证、示例配置和启动脚本。

## 升级前注意

1. 停止旧版 PST 和 Palworld 服务端。
2. 备份现有 `config.yaml`、数据库、`backups` 目录以及完整的 `Pal/Saved` 目录。
3. 解压对应平台的发布包，不要用示例 `config.yaml` 覆盖自己的配置。
4. 使用 REST 功能时，确认 Palworld 配置中 `RESTAPIEnabled=True`，并设置非空 `AdminPassword`。
5. Linux 用户需要为 `pst`、`sav_cli` 和 `start.sh` 保留可执行权限。

详细变更见 [`CHANGELOG.md`](https://github.com/xutongxue233/palworld-server-tool/blob/main/CHANGELOG.md)。
