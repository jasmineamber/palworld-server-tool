<script setup>
import {
  AdminPanelSettingsOutlined,
  CloudDownloadOutlined,
  SaveOutlined,
  SupervisedUserCircleRound,
  SettingsPowerRound,
} from "@vicons/material";
import { ChevronsLeft } from "@vicons/tabler";
import { GameController, LanguageSharp, Settings } from "@vicons/ionicons5";
import { BroadcastTower } from "@vicons/fa";
import { computed, h, onMounted, ref } from "vue";
import { NIcon, NTag, NButton, useMessage, useDialog } from "naive-ui";
import { useI18n } from "vue-i18n";
import ApiService from "@/service/api";
import dayjs from "dayjs";
import palMap from "@/assets/pal.json";
import skillMap from "@/assets/skill.json";
import PlayerDetail from "./component/PlayerDetail.vue";
import GuildDetail from "./component/GuildDetail.vue";
import userStore from "@/stores/model/user";

const { t, locale } = useI18n();

const message = useMessage();
const dialog = useDialog();

const PALWORLD_TOKEN = "palworld_token";

const loading = ref(false);
const serverInfo = ref({});
const localeLowerPalMap = ref({});
const currentDisplay = ref("players");
const isShowDetail = ref(false);
const playerList = ref([]);
const onlinePlayerList = ref([]);
const guildList = ref([]);
const playerInfo = ref({});
const playerPalsList = ref([]);
const currentPlayerPalsList = ref([]);
const guildInfo = ref({});
const skillTypeList = ref([]);
const languageOptions = ref([]);

const contentRef = ref(null);

const isLogin = ref(false);
const authToken = ref("");

const isDarkMode = ref(
  window.matchMedia("(prefers-color-scheme: dark)").matches,
);

const updateDarkMode = (e) => {
  isDarkMode.value = e.matches;
};

const handleSelectLanguage = (key) => {
  message.info(t("message.changelanguage"));
  if (key === "zh") {
    localStorage.setItem("locale", "zh");
    // locale.value = "zh";
  } else if (key === "ja") {
    localStorage.setItem("locale", "ja");
    // locale.value = "ja";
  } else {
    localStorage.setItem("locale", "en");
    // locale.value = "en";
  }
  setTimeout(() => {
    location.reload();
  }, 1000);
};

const getSkillTypeList = () => {
  if (skillMap[locale.value]) {
    return Object.values(skillMap[locale.value]).map((item) => item.name);
  } else {
    return [];
  }
};

// get data
const getServerInfo = async () => {
  const { data } = await new ApiService().getServerInfo();
  serverInfo.value = data.value;
};
const getPlayerList = async () => {
  getOnlineList();
  const { data } = await new ApiService().getPlayerList({
    order_by: "last_online",
    desc: true,
  });
  playerList.value = data.value;
};
const getGuildList = async () => {
  const { data } = await new ApiService().getGuildList();
  guildList.value = data.value;
};

const getPlayerInfo = async (player_uid) => {
  const { data } = await new ApiService().getPlayer({ playerUid: player_uid });
  playerInfo.value = data.value;
  playerPalsList.value = JSON.parse(JSON.stringify(playerInfo.value.pals));
  currentPlayerPalsList.value = playerPalsList.value.slice(0, pageSize.value);
  isShowDetail.value = true;
  contentRef.value.scrollTo(0, 0);
};

const getGuildInfo = async (admin_player_uid) => {
  const { data } = await new ApiService().getGuild({
    adminPlayerUid: admin_player_uid,
  });
  guildInfo.value = data.value;
  isShowDetail.value = true;
  contentRef.value.scrollTo(0, 0);
};

// 接受子组件
const getChoosePlayer = (uid) => {
  getPlayerInfo(uid);
};
const getChooseGuild = (uid) => {
  getGuildInfo(uid);
};

const getPalName = (name) => {
  const lowerName = name.toLowerCase();
  return localeLowerPalMap.value[lowerName]
    ? localeLowerPalMap.value[lowerName]
    : name;
};

// 游戏用户的帕鲁列表分页，搜索
const clickSearch = (searchValue) => {
  const pattern = /^\s*$|(\s)\1/;
  if (searchValue && !pattern.test(searchValue)) {
    playerPalsList.value = playerInfo.value.pals.filter((item) => {
      return (
        item.skills.some((skill) => {
          return (
            skillMap[locale.value][skill]
              ? skillMap[locale.value][skill].name
              : skill
          ).includes(searchValue);
        }) || getPalName(item.type).includes(searchValue)
      );
    });
  } else {
    playerPalsList.value = JSON.parse(JSON.stringify(playerInfo.value.pals));
  }
  currentPage.value = 1;
  if (playerPalsList.value.length <= 10) {
    finished.value = true;
    currentPlayerPalsList.value = playerPalsList.value ?? [];
  } else {
    finished.value = false;
    currentPlayerPalsList.value = playerPalsList.value.slice(0, pageSize.value);
  }
};
// 滚动加载更多
const palsLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const finished = ref(false);
const onLoadPals = () => {
  if (playerPalsList.value.length <= currentPage.value * pageSize.value) {
    finished.value = true;
  } else {
    currentPage.value += 1;
    currentPlayerPalsList.value = playerPalsList.value.slice(
      0,
      pageSize.value * currentPage.value,
    );
  }
};
const onContentScroll = () => {
  if (currentDisplay.value === "players" && isShowDetail.value) {
    const dom = document.getElementsByClassName("n-layout-scroll-container");
    if (dom[1].scrollTop + dom[1].clientHeight > dom[1].scrollHeight - 6) {
      onLoadPals();
    }
  }
};

const getOnlineList = async () => {
  const { data } = await new ApiService().getOnlinePlayerList();
  onlinePlayerList.value = data.value;
};

// login
const showLoginModal = ref(false);
const password = ref("");
const handleLogin = async () => {
  const { data, statusCode } = await new ApiService().login({
    password: password.value,
  });
  if (statusCode.value === 401) {
    message.error(t("message.autherr"));
    password.value = "";
    return;
  }
  let token = data.value.token;
  localStorage.setItem(PALWORLD_TOKEN, token);
  userStore().setIsLogin(true, token);
  authToken.value = token;
  message.success(t("message.authsuccess"));
  showLoginModal.value = false;
  isLogin.value = true;
};

// broadcast
const showBroadcastModal = ref(false);
const broadcastText = ref("");
const handleStartBrodcast = () => {
  // broadcast start
  if (checkAuthToken()) {
    showBroadcastModal.value = true;
  } else {
    message.error(t("message.requireauth"));
    showLoginModal.value = true;
  }
};
const handleBroadcast = async () => {
  const { data, statusCode } = await new ApiService().sendBroadcast({
    message: broadcastText.value,
  });
  if (statusCode.value === 200) {
    message.success(t("message.broadcastsuccess"));
    showBroadcastModal.value = false;
    broadcastText.value = "";
  } else {
    message.error(t("message.broadcastfail", { err: data.value?.error }));
  }
};

const showServerSettingsModal = ref(false);
const serverSettingsLoading = ref(false);
const serverSettingsRows = ref([]);
const serverSettingsColumns = computed(() => [
  {
    title: t("item.settingName"),
    key: "name",
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: t("item.settingValue"),
    key: "value",
    ellipsis: { tooltip: true },
  },
]);
const formatSettingValue = (value) => {
  if (value === null || value === undefined) return "--";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
const handleServerSettings = async () => {
  if (!checkAuthToken()) {
    message.error(t("message.requireauth"));
    showLoginModal.value = true;
    return;
  }

  showServerSettingsModal.value = true;
  serverSettingsLoading.value = true;
  const { data, statusCode } = await new ApiService().getServerSettings();
  if (statusCode.value === 200) {
    serverSettingsRows.value = Object.entries(data.value || {})
      .map(([name, value]) => ({ name, value: formatSettingValue(value) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    serverSettingsRows.value = [];
    message.error(t("message.settingsfail", { err: data.value?.error }));
  }
  serverSettingsLoading.value = false;
};

const showWorldSnapshotModal = ref(false);
const worldSnapshotLoading = ref(false);
const worldSnapshot = ref(null);
const worldActorRows = computed(() => {
  return Array.isArray(worldSnapshot.value?.ActorData)
    ? worldSnapshot.value.ActorData
    : [];
});
const worldSnapshotColumns = computed(() => [
  {
    title: t("item.actorType"),
    key: "Type",
    width: 130,
    ellipsis: { tooltip: true },
  },
  {
    title: t("item.actorName"),
    key: "NickName",
    minWidth: 160,
    ellipsis: { tooltip: true },
    render(row) {
      return (
        row.NickName ||
        row.TrainerNickName ||
        row.GuildName ||
        row.Class ||
        "--"
      );
    },
  },
  {
    title: t("pal.level"),
    key: "level",
    width: 70,
  },
]);
const handleWorldSnapshot = async () => {
  if (!checkAuthToken()) {
    message.error(t("message.requireauth"));
    showLoginModal.value = true;
    return;
  }

  showWorldSnapshotModal.value = true;
  worldSnapshotLoading.value = true;
  const { data, statusCode } = await new ApiService().getWorldActorSnapshot();
  if (statusCode.value === 200) {
    worldSnapshot.value = data.value;
  } else {
    worldSnapshot.value = null;
    message.error(t("message.snapshotfail", { err: data.value?.error }));
  }
  worldSnapshotLoading.value = false;
};
const downloadWorldSnapshot = () => {
  if (!worldSnapshot.value) return;

  const content = JSON.stringify(worldSnapshot.value, null, 2);
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `palworld-world-snapshot-${dayjs().format(
    "YYYYMMDD-HHmmss",
  )}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success(t("message.snapshotdownloadsuccess"));
};

const handleSaveWorld = () => {
  if (!checkAuthToken()) {
    message.error(t("message.requireauth"));
    showLoginModal.value = true;
    return;
  }
  dialog.warning({
    title: t("message.warn"),
    content: t("message.saveworldtip"),
    positiveText: t("button.confirm"),
    negativeText: t("button.cancel"),
    onPositiveClick: async () => {
      const { data, statusCode } = await new ApiService().saveWorld();
      if (statusCode.value === 200) {
        message.success(t("message.saveworldsuccess"));
      } else {
        message.error(t("message.saveworldfail", { err: data.value?.error }));
      }
    },
  });
};

const handleForceStop = () => {
  if (!checkAuthToken()) {
    message.error(t("message.requireauth"));
    showLoginModal.value = true;
    return;
  }
  dialog.error({
    title: t("message.warn"),
    content: t("message.forcestoptip"),
    positiveText: t("button.confirm"),
    negativeText: t("button.cancel"),
    onPositiveClick: async () => {
      const { data, statusCode } = await new ApiService().stopServer();
      if (statusCode.value === 200) {
        message.success(t("message.forcestopsuccess"));
      } else {
        message.error(t("message.forcestopfail", { err: data.value?.error }));
      }
    },
  });
};

const showShutdownModal = ref(false);
const shutdownSeconds = ref(60);
const shutdownMessage = ref("");
const shutdownSubmitting = ref(false);
const handleShutdown = () => {
  if (checkAuthToken()) {
    shutdownSeconds.value = 60;
    shutdownMessage.value = "";
    showShutdownModal.value = true;
  } else {
    message.error(t("message.requireauth"));
    showLoginModal.value = true;
  }
};
const confirmShutdown = async () => {
  if (!Number.isInteger(shutdownSeconds.value) || shutdownSeconds.value < 1) {
    message.error(t("message.shutdowninvalid"));
    return;
  }

  shutdownSubmitting.value = true;
  const { data, statusCode } = await new ApiService().shutdownServer({
    seconds: shutdownSeconds.value,
    message: shutdownMessage.value,
  });
  shutdownSubmitting.value = false;
  if (statusCode.value === 200) {
    message.success(t("message.shutdownsuccess"));
    showShutdownModal.value = false;
  } else {
    message.error(t("message.shutdownfail", { err: data.value?.error }));
  }
};

const renderControlIcon = (icon, color) => {
  return () => h(NIcon, { color }, { default: () => h(icon) });
};
const mobileControlOptions = computed(() => [
  {
    label: t("button.broadcast"),
    key: "broadcast",
    icon: renderControlIcon(BroadcastTower),
  },
  {
    label: t("button.serverSettings"),
    key: "settings",
    icon: renderControlIcon(Settings),
  },
  {
    label: t("button.worldSnapshot"),
    key: "snapshot",
    icon: renderControlIcon(CloudDownloadOutlined),
  },
  {
    label: t("button.saveWorld"),
    key: "save",
    icon: renderControlIcon(SaveOutlined, "#18a058"),
  },
  {
    label: t("button.shutdown"),
    key: "shutdown",
    icon: renderControlIcon(SettingsPowerRound, "#d97706"),
  },
  {
    label: t("button.forceStop"),
    key: "stop",
    icon: renderControlIcon(SettingsPowerRound, "#cc2d48"),
  },
]);
const handleMobileControl = (key) => {
  const handlers = {
    broadcast: handleStartBrodcast,
    settings: handleServerSettings,
    snapshot: handleWorldSnapshot,
    save: handleSaveWorld,
    shutdown: handleShutdown,
    stop: handleForceStop,
  };
  handlers[key]?.();
};

const toPlayers = async () => {
  if (currentDisplay.value === "players") {
    return;
  }
  await getPlayerList();
  currentDisplay.value = "players";
  isShowDetail.value = false;

  palsLoading.value = false;
  finished.value = false;
  currentPage.value = 1;

  contentRef.value.scrollTo(0, 0);
};
const toGuilds = async () => {
  if (currentDisplay.value === "guilds") {
    return;
  }
  await getGuildList();
  currentDisplay.value = "guilds";
  isShowDetail.value = false;

  palsLoading.value = false;
  finished.value = false;
  currentPage.value = 1;

  contentRef.value.scrollTo(0, 0);
};
const returnList = () => {
  isShowDetail.value = false;

  palsLoading.value = false;
  finished.value = false;
  currentPage.value = 1;

  contentRef.value.scrollTo(0, 0);
};

/**
 * check auth token
 */
const checkAuthToken = () => {
  const token = localStorage.getItem(PALWORLD_TOKEN);
  if (token && token !== "") {
    if (isTokenExpired(token)) {
      localStorage.removeItem(PALWORLD_TOKEN);
      return false;
    }
    isLogin.value = true;
    authToken.value = token;
    return true;
  }
  return false;
};
const isTokenExpired = (token) => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp !== "number" || payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

onMounted(async () => {
  locale.value = localStorage.getItem("locale");
  languageOptions.value = [
    {
      label: "简体中文",
      key: "zh",
      disabled: locale.value == "zh",
    },
    {
      label: "English",
      key: "en",
      disabled: locale.value == "en",
    },
    {
      label: "日本語",
      key: "ja",
      disabled: locale.value == "ja",
    },
  ];
  localeLowerPalMap.value = Object.keys(palMap[locale.value]).reduce(
    (acc, key) => {
      acc[key.toLowerCase()] = palMap[locale.value][key];
      return acc;
    },
    {},
  );
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", updateDarkMode);
  isDarkMode.value = mediaQuery.matches;

  skillTypeList.value = getSkillTypeList();
  loading.value = true;
  checkAuthToken();
  getServerInfo();
  await getPlayerList();
  loading.value = false;
  setInterval(() => {
    getPlayerList();
  }, 60000);
});
</script>

<template>
  <div class="home-page overflow-hidden">
    <div
      :class="isDarkMode ? 'bg-#18181c text-#fff' : 'bg-#fff text-#18181c'"
      class="flex justify-between items-center p-3"
    >
      <div>
        <span class="line-clamp-1 text-base">{{ $t("title") }}</span>
        <n-tag type="default" size="small">{{
          serverInfo?.name
            ? `${serverInfo.name + " " + serverInfo.version}`
            : $t("message.loading")
        }}</n-tag>
      </div>
      <n-space vertical>
        <n-space justify="end">
          <n-tag type="info" round size="small">{{
            $t("status.player_number", { number: playerList?.length })
          }}</n-tag>
          <n-tag type="success" round size="small">{{
            $t("status.online_number", { number: onlinePlayerList?.length })
          }}</n-tag>
        </n-space>
        <n-space justify="end" class="flex items-center">
          <n-dropdown
            trigger="hover"
            :options="languageOptions"
            @select="handleSelectLanguage"
          >
            <n-button type="default" secondary strong circle size="small">
              <template #icon>
                <n-icon><LanguageSharp /></n-icon>
              </template>
            </n-button>
          </n-dropdown>

          <n-button
            type="primary"
            size="small"
            secondary
            strong
            @click="showLoginModal = true"
            v-if="!isLogin"
          >
            <template #icon>
              <n-icon>
                <AdminPanelSettingsOutlined />
              </n-icon>
            </template>
            {{ $t("button.auth") }}
          </n-button>
          <n-tag v-else type="success" size="small" round>
            <template #icon>
              <n-icon>
                <AdminPanelSettingsOutlined />
              </n-icon>
            </template>
            {{ $t("status.authenticated") }}
          </n-tag>
        </n-space>
      </n-space>
    </div>
    <div class="w-full">
      <div class="rounded-lg" v-if="!loading && playerList.length > 0">
        <n-layout style="height: calc(100vh - 86px)" has-sider>
          <n-layout-header
            class="flex flex-col justify-between"
            :class="isLogin ? 'h-16' : 'h-10'"
            bordered
          >
            <div v-if="isLogin" class="flex justify-center items-center px-3">
              <n-dropdown
                trigger="click"
                :options="mobileControlOptions"
                @select="handleMobileControl"
              >
                <n-button
                  size="small"
                  type="primary"
                  class="w-full"
                  secondary
                  strong
                  round
                >
                  <template #icon>
                    <n-icon><Settings /></n-icon>
                  </template>
                  {{ $t("button.controlCenter") }}
                </n-button>
              </n-dropdown>
            </div>
            <div v-else></div>
            <div class="flex justify-end">
              <n-button-group size="small" class="w-full">
                <n-button
                  v-if="isShowDetail"
                  class="w-20%"
                  @click="returnList"
                  type="tertiary"
                  strong
                  secondary
                >
                  <n-icon size="24">
                    <ChevronsLeft />
                  </n-icon>
                </n-button>
                <n-button
                  :class="isShowDetail ? 'w-40%' : 'w-50%'"
                  @click="toPlayers"
                  :type="currentDisplay === 'players' ? 'primary' : 'tertiary'"
                  secondary
                  strong
                >
                  <template #icon>
                    <n-icon>
                      <GameController />
                    </n-icon>
                  </template>
                  {{ $t("button.players") }}
                </n-button>
                <n-button
                  :class="isShowDetail ? 'w-40%' : 'w-50%'"
                  @click="toGuilds"
                  :type="currentDisplay === 'guilds' ? 'primary' : 'tertiary'"
                  secondary
                  strong
                >
                  <template #icon>
                    <n-icon>
                      <SupervisedUserCircleRound />
                    </n-icon>
                  </template>
                  {{ $t("button.guilds") }}
                </n-button>
              </n-button-group>
            </div>
          </n-layout-header>
          <n-layout
            position="absolute"
            style="top: 64px"
            ref="contentRef"
            @scroll="onContentScroll"
          >
            <div v-if="!isShowDetail">
              <!-- list -->
              <player-list
                v-if="currentDisplay === 'players'"
                :playerList="playerList"
                @onGetInfo="getChoosePlayer"
              ></player-list>
              <guild-list
                v-if="currentDisplay === 'guilds'"
                :guildList="guildList"
                @onGetInfo="getChooseGuild"
              >
              </guild-list>
            </div>
            <!-- detail -->
            <div v-else class="relative">
              <player-detail
                v-if="currentDisplay === 'players'"
                :playerInfo="playerInfo"
                :currentPlayerPalsList="currentPlayerPalsList"
                :finished="finished"
                @onSearch="clickSearch"
              ></player-detail>
              <guild-detail
                v-if="currentDisplay === 'guilds'"
                :guildInfo="guildInfo"
              ></guild-detail>
            </div>
          </n-layout>
        </n-layout>
      </div>
    </div>
  </div>
  <!-- 登录 modal -->
  <n-modal
    v-model:show="showLoginModal"
    class="custom-card"
    preset="card"
    style="width: 90%; max-width: 600px"
    footer-style="padding: 12px;"
    content-style="padding: 12px;"
    header-style="padding: 12px;"
    :title="$t('modal.auth')"
    size="huge"
    :bordered="false"
    :segmented="segmented"
  >
    <div>
      <span class="block pb-2">{{ $t("message.authdesc") }}</span>
      <n-input
        type="password"
        show-password-on="click"
        size="large"
        v-model:value="password"
      ></n-input>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <n-button
          type="tertiary"
          @click="
            () => {
              showLoginModal = false;
              password = '';
            }
          "
          >{{ $t("button.cancel") }}</n-button
        >
        <n-button class="ml-3 w-40" type="primary" @click="handleLogin">{{
          $t("button.confirm")
        }}</n-button>
      </div>
    </template>
  </n-modal>
  <!--  广播 modal -->
  <n-modal
    v-model:show="showBroadcastModal"
    class="custom-card"
    preset="card"
    style="width: 90%; max-width: 600px"
    footer-style="padding: 12px;"
    content-style="padding: 12px;"
    header-style="padding: 12px;"
    :title="$t('modal.broadcast')"
    size="huge"
    :bordered="false"
    :segmented="segmented"
  >
    <div>
      <n-input
        type="text"
        show-password-on="click"
        v-model:value="broadcastText"
      ></n-input>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <n-button
          type="tertiary"
          @click="
            () => {
              showBroadcastModal = false;
              broadcastText = '';
            }
          "
          >{{ $t("button.cancel") }}</n-button
        >
        <n-button class="ml-3 w-40" type="primary" @click="handleBroadcast">{{
          $t("button.confirm")
        }}</n-button>
      </div>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showServerSettingsModal"
    class="custom-card"
    preset="card"
    style="width: 94%; max-width: 700px"
    content-style="padding: 12px;"
    header-style="padding: 12px;"
    :title="$t('modal.serverSettings')"
    size="huge"
    :bordered="false"
    :segmented="segmented"
  >
    <n-spin :show="serverSettingsLoading">
      <n-data-table
        :columns="serverSettingsColumns"
        :data="serverSettingsRows"
        :max-height="520"
        :single-line="false"
        virtual-scroll
      />
    </n-spin>
  </n-modal>

  <n-modal
    v-model:show="showWorldSnapshotModal"
    class="custom-card"
    preset="card"
    style="width: 96%; max-width: 760px"
    content-style="padding: 12px;"
    header-style="padding: 12px;"
    :title="$t('modal.worldSnapshot')"
    size="huge"
    :bordered="false"
    :segmented="segmented"
  >
    <n-spin :show="worldSnapshotLoading">
      <n-descriptions
        v-if="worldSnapshot"
        bordered
        label-placement="top"
        :column="2"
        class="mb-3"
      >
        <n-descriptions-item :label="$t('item.time')">
          {{ worldSnapshot.Time || "--" }}
        </n-descriptions-item>
        <n-descriptions-item :label="$t('item.serverFps')">
          {{ worldSnapshot.FPS ?? "--" }}
        </n-descriptions-item>
        <n-descriptions-item :label="$t('item.averageFps')">
          {{ worldSnapshot.AverageFPS ?? "--" }}
        </n-descriptions-item>
        <n-descriptions-item :label="$t('item.actorCount')">
          {{ worldActorRows.length }}
        </n-descriptions-item>
      </n-descriptions>
      <n-data-table
        v-if="worldSnapshot"
        :columns="worldSnapshotColumns"
        :data="worldActorRows"
        :max-height="420"
        :single-line="false"
        virtual-scroll
      />
      <n-empty v-else-if="!worldSnapshotLoading" />
    </n-spin>
    <template #footer>
      <div class="flex justify-end">
        <n-button
          type="primary"
          :disabled="!worldSnapshot"
          @click="downloadWorldSnapshot"
        >
          <template #icon>
            <n-icon><CloudDownloadOutlined /></n-icon>
          </template>
          {{ $t("button.downloadSnapshot") }}
        </n-button>
      </div>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showShutdownModal"
    class="custom-card"
    preset="card"
    style="width: 94%; max-width: 560px"
    content-style="padding: 12px;"
    footer-style="padding: 12px;"
    header-style="padding: 12px;"
    :title="$t('modal.shutdown')"
    size="huge"
    :bordered="false"
    :segmented="segmented"
  >
    <n-form label-placement="top">
      <n-form-item :label="$t('input.shutdownSeconds')">
        <n-input-number
          v-model:value="shutdownSeconds"
          class="w-full"
          :min="1"
          :max="86400"
          :precision="0"
        />
      </n-form-item>
      <n-form-item :label="$t('input.shutdownMessage')">
        <n-input
          v-model:value="shutdownMessage"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :placeholder="$t('input.shutdownMessagePlaceholder')"
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="flex justify-end">
        <n-button type="tertiary" @click="showShutdownModal = false">
          {{ $t("button.cancel") }}
        </n-button>
        <n-button
          class="ml-3"
          type="warning"
          :loading="shutdownSubmitting"
          @click="confirmShutdown"
        >
          {{ $t("button.shutdown") }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>
<style scoped lang="less">
:deep(.n-layout-scroll-container) {
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
