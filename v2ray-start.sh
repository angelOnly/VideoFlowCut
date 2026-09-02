#!/usr/bin/env bash
# V2Ray + Cloudflare WARP SOCKS5 自动部署脚本（Debian/Ubuntu）
# 用法：sudo SS_PASSWORD='强随机密码' bash deploy_v2ray_warp.sh
# 未设置 SS_PASSWORD 时会自动生成随机密码并保存到 /root/v2ray-warp-credentials.txt

set -Eeuo pipefail

SS_PORT="${SS_PORT:-35212}"
KCP_PORT="${KCP_PORT:-35211}"
WARP_SOCKS_PORT="${WARP_SOCKS_PORT:-40000}"
SS_METHOD="${SS_METHOD:-aes-128-gcm}"
SS_PASSWORD="${SS_PASSWORD:-}"
PUBLIC_IPV4="${PUBLIC_IPV4:-}"
CONFIG=/etc/v2ray/config.json

die() { echo "ERROR: $*" >&2; exit 1; }
note() { printf '\n==> %s\n' "$*"; }

[[ $EUID -eq 0 ]] || die "请以 root 运行：sudo -i"
command -v apt-get >/dev/null || die "仅支持 Debian/Ubuntu（需要 apt-get）。"
[[ "$SS_PORT" =~ ^[1-9][0-9]{0,4}$ && "$SS_PORT" -le 65535 ]] || die "SS_PORT 无效"
[[ "$KCP_PORT" =~ ^[1-9][0-9]{0,4}$ && "$KCP_PORT" -le 65535 ]] || die "KCP_PORT 无效"
[[ "$WARP_SOCKS_PORT" =~ ^[1-9][0-9]{0,4}$ && "$WARP_SOCKS_PORT" -le 65535 ]] || die "WARP_SOCKS_PORT 无效"
[[ "$SS_PORT" != "$KCP_PORT" ]] || die "两个入站端口不能相同"

export DEBIAN_FRONTEND=noninteractive
note "安装依赖"
apt-get update
apt-get install -y ca-certificates curl wget jq openssl ufw iproute2



port_listening() {
  ss -lntH "sport = :$1" 2>/dev/null | grep -q .
}

note "安装或检查 WARP SOCKS5（127.0.0.1:$WARP_SOCKS_PORT）"
if ! port_listening "$WARP_SOCKS_PORT"; then
  warp_installer="$(mktemp)"
  curl -fsSL https://gitlab.com/fscarmen/warp/-/raw/main/menu.sh -o "$warp_installer"
  # 上游脚本：第一个空输入采用默认语言，第二个空输入采用默认端口 40000。
  if [[ "$WARP_SOCKS_PORT" == 40000 ]]; then
    printf '\n\n' | bash "$warp_installer" c
  else
    printf '\n%s\n' "$WARP_SOCKS_PORT" | bash "$warp_installer" c
  fi
  rm -f "$warp_installer"
fi
port_listening "$WARP_SOCKS_PORT" || die "WARP 未监听 $WARP_SOCKS_PORT。请手动执行 warp c 完成授权后重试。"

note "安装或检查 233boy V2Ray"
if ! command -v v2ray >/dev/null; then
  bash <(curl -fsSL https://github.com/233boy/v2ray/raw/master/install.sh)
fi
command -v v2ray >/dev/null || die "找不到 v2ray 命令"
[[ -f "$CONFIG" ]] || die "找不到主配置：$CONFIG"
v2ray start >/dev/null 2>&1 || true

port_exists() {
  local port="$1"
  local files=()
  shopt -s nullglob
  files=(/etc/v2ray/conf/*.json)
  shopt -u nullglob
  ((${#files[@]})) || return 1
  jq -s -e --argjson port "$port" 'any(.. | objects; .port? == $port)' "${files[@]}" >/dev/null
}

note "创建 Shadowsocks 和 mKCP 入站（已存在同端口则跳过）"
existing_ss_password() {
  jq -sr --argjson port "$1" 'first(.. | objects | select(.port? == $port and .protocol? == "shadowsocks") | (.settings.clients[0].password? // .settings.password? // empty)) // empty' /etc/v2ray/conf/*.json
}

if port_exists "$SS_PORT"; then
  if [[ -z "$SS_PASSWORD" ]]; then
    SS_PASSWORD="$(existing_ss_password "$SS_PORT")"
  fi
  [[ -n "$SS_PASSWORD" ]] || die "现有 SS 配置的密码无法读取；请通过 SS_PASSWORD 显式提供。"
else
  if [[ -z "$SS_PASSWORD" ]]; then
    SS_PASSWORD="$(openssl rand -base64 36 | tr -d '\n' | cut -c1-32)"
    note "已生成随机 Shadowsocks 密码"
  fi
  v2ray add ss "$SS_PORT" "$SS_PASSWORD" "$SS_METHOD"
fi
port_exists "$KCP_PORT" || v2ray add kcp "$KCP_PORT" auto none

note "添加 UFW 规则（不会自动启用 UFW）"
ufw allow "$KCP_PORT/udp"
ufw allow "$SS_PORT/tcp"
ufw allow "$SS_PORT/udp"
ufw reload || true

note "写入 WARP 路由规则"
backup="$CONFIG.bak.$(date +%Y%m%d%H%M%S)"
cp -a "$CONFIG" "$backup"
tmp="$(mktemp "$CONFIG.tmp.XXXXXX")"
chmod --reference="$CONFIG" "$tmp"
chown --reference="$CONFIG" "$tmp"

jq --argjson warp_port "$WARP_SOCKS_PORT" '
  def domains: [
    "domain:openai.com", "domain:chatgpt.com", "domain:reddit.com",
    "domain:google.com", "domain:google-analytics.com", "domain:hjd2048.com",
    "domain:twitter.com", "domain:javlibrary.com", "domain:instagram.com",
    "domain:linux.do"
  ];
  def wrap_rule: {type:"field", domain:domains, outboundTag:"wrap"};
  def api_rule: ((.inboundTag? // []) | index("api")) != null;
  .routing //= {} |
  .routing.rules //= [] |
  .outbounds //= [] |
  .routing.rules |= (
    map(select(.outboundTag != "wrap")) as $rules |
    ([$rules[] | select(api_rule)] + [wrap_rule] + [$rules[] | select(api_rule | not)])
  ) |
  .outbounds |= (
    map(select(.tag != "wrap")) + [{
      tag:"wrap", protocol:"socks",
      settings:{servers:[{address:"127.0.0.1", port:$warp_port}]}
    }]
  )
' "$CONFIG" > "$tmp"
mv -f "$tmp" "$CONFIG"

note "校验并启动 V2Ray"
v2ray stop
v2ray test
v2ray start

# Use IPv4 as the client endpoint unless the user deliberately chooses otherwise.
if [[ -z "$PUBLIC_IPV4" ]]; then
  PUBLIC_IPV4="$(curl -4fsS --connect-timeout 8 https://api.ipify.org 2>/dev/null || true)"
fi
if [[ ! "$PUBLIC_IPV4" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  PUBLIC_IPV4=""
fi

credential_file=/root/v2ray-warp-credentials.txt
umask 077
{
  echo "Shadowsocks port: $SS_PORT"
  echo "Shadowsocks method: $SS_METHOD"
  echo "Shadowsocks password: $SS_PASSWORD"
  echo "VMess mKCP port: $KCP_PORT"
  echo "WARP SOCKS5: 127.0.0.1:$WARP_SOCKS_PORT"
  if [[ -n "$PUBLIC_IPV4" ]]; then
    echo "Client endpoint (IPv4): $PUBLIC_IPV4"
  fi
  echo "Use this IPv4 endpoint for VMess; do not rewrite a VMess link to IPv6."
  echo "Config backup: $backup"
} > "$credential_file"
chmod 600 "$credential_file"

note "部署完成"
echo "凭据文件：$credential_file（权限 600）"
echo "查看客户端链接：v2ray info"
if [[ -n "$PUBLIC_IPV4" ]]; then
  echo "Client endpoint (use IPv4): $PUBLIC_IPV4"
else
  echo "Could not detect IPv4; run: curl -4 https://api.ipify.org"
fi
echo "Do not rewrite a VMess link to IPv6."
echo "UFW 状态：$(ufw status | head -n 1)"
echo "还需要在云厂商安全组放行：$SS_PORT 的 TCP/UDP，以及 $KCP_PORT 的 UDP。"