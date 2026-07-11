export type Locale = "zh" | "en" | "ja";

export interface ServerInfo {
  version: string;
  name: string;
  description: string;
  world_guid: string;
}

export interface ServerMetrics {
  server_fps: number;
  current_player_num: number;
  server_frame_time: number;
  max_player_num: number;
  uptime: number;
  base_camp_num: number;
  days: number;
}

export interface ServerToolInfo {
  version: string;
  latest: string;
}

export interface Pal {
  level: number;
  exp: number;
  hp: number;
  max_hp: number;
  type: string;
  gender: string;
  nickname: string;
  is_lucky: boolean;
  is_boss: boolean;
  is_tower: boolean;
  workspeed: number;
  melee: number;
  ranged: number;
  defense: number;
  rank: number;
  rank_attack: number;
  rank_defence: number;
  rank_craftspeed: number;
  skills: string[];
}

export interface PlayerItem {
  SlotIndex: number;
  ItemId: string;
  StackCount: number;
}

export interface PlayerItems {
  CommonContainerId?: PlayerItem[];
  DropSlotContainerId?: PlayerItem[];
  EssentialContainerId?: PlayerItem[];
  FoodEquipContainerId?: PlayerItem[];
  PlayerEquipArmorContainerId?: PlayerItem[];
  WeaponLoadOutContainerId?: PlayerItem[];
  [key: string]: PlayerItem[] | undefined;
}

export interface PlayerSummary {
  player_uid: string;
  user_id: string;
  steam_id: string;
  nickname: string;
  account_name: string;
  ip: string;
  ping: number;
  location_x: number;
  location_y: number;
  level: number;
  building_count: number;
  last_online: string;
  exp?: number;
  hp?: number;
  max_hp?: number;
  shield_hp?: number;
  shield_max_hp?: number;
  max_status_point?: number;
  status_point?: Record<string, number>;
  full_stomach?: number;
  save_last_online?: string;
}

export interface Player extends PlayerSummary {
  pals: Pal[];
  items: PlayerItems | null;
}

export interface GuildPlayer {
  player_uid: string;
  nickname: string;
}

export interface BaseCamp {
  id: string;
  area: number;
  location_x: number;
  location_y: number;
}

export interface Guild {
  name: string;
  base_camp_level: number;
  admin_player_uid: string;
  players: GuildPlayer[];
  base_camp: BaseCamp[];
}

export interface WhitelistPlayer {
  name: string;
  user_id: string;
  steam_id: string;
  player_uid: string;
}

export interface Backup {
  backup_id: string;
  save_time: string;
  path: string;
}

export interface WorldActor {
  Type?: string;
  NickName?: string;
  TrainerNickName?: string;
  GuildName?: string;
  Class?: string;
  level?: number;
  Action?: string;
  AI_Action?: string;
  LocationX?: number;
  LocationY?: number;
  LocationZ?: number;
  [key: string]: unknown;
}

export interface WorldSnapshot {
  Time?: string;
  FPS?: number;
  AverageFPS?: number;
  ActorData?: WorldActor[];
  [key: string]: unknown;
}

export interface ApiSuccess {
  success: boolean;
}
