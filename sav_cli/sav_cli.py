import argparse
import json
import os
import shutil
import sys
import time
import traceback
from pathlib import Path
from urllib.parse import urljoin

import requests
from palsav.commands.convert import convert_json_to_sav, convert_sav_to_json
from palsav.core import compress_gvas_to_sav, decompress_sav_to_gvas
from palsav.gvas import GvasFile
from palsav.paltypes import PALWORLD_CUSTOM_PROPERTIES, PALWORLD_TYPE_HINTS

from logger import log
from structurer import convert_sav, structure_guild, structure_player


def structure_save(file_path: Path, output: str, request: str, token: str) -> None:
    convert_sav(str(file_path))
    filetime = file_path.stat().st_mtime
    player_dir = file_path.parent / "Players"

    players = structure_player(str(player_dir), filetime=filetime)
    guilds = structure_guild(filetime)

    for player in players:
        for guild in guilds:
            for guild_player in guild["players"]:
                if player["player_uid"] == guild_player["player_uid"]:
                    player["save_last_online"] = guild_player["last_online"]
                    break

    if not request:
        output_path = Path(output or "structure.json")
        if output_path.suffix.lower() != ".json":
            output_path = output_path.with_suffix(output_path.suffix + ".json")
        output_path.write_text(
            json.dumps(
                {"players": players, "guilds": guilds},
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        log(f"Players: {len(players)}")
        log(f"Guilds: {len(guilds)}")
        log(f"Structured data written to {output_path}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    player_url = urljoin(request, "player")
    guild_url = urljoin(request, "guild")

    log(f"Put players to {player_url} with Players: {len(players)}")
    player_response = requests.put(
        player_url,
        headers=headers,
        json=players,
        timeout=30,
    )
    player_response.raise_for_status()

    log(f"Put guilds to {guild_url} with Guilds: {len(guilds)}")
    guild_response = requests.put(
        guild_url,
        headers=headers,
        json=guilds,
        timeout=30,
    )
    guild_response.raise_for_status()


def load_gvas(file_path: Path) -> tuple[bytes, int, GvasFile]:
    raw_gvas, save_type = decompress_sav_to_gvas(file_path.read_bytes())
    gvas = GvasFile.read(
        raw_gvas,
        type_hints=PALWORLD_TYPE_HINTS,
        custom_properties=PALWORLD_CUSTOM_PROPERTIES,
    )
    return raw_gvas, save_type, gvas


def validate_save(file_path: Path) -> None:
    raw_gvas, save_type, gvas = load_gvas(file_path)
    written = gvas.write(custom_properties=PALWORLD_CUSTOM_PROPERTIES)
    if written != raw_gvas:
        raise ValueError("GVAS changed during a read/write validation pass")
    log(
        f"Valid save: class={gvas.header.save_game_class_name}, "
        f"type=0x{save_type:02X}, raw_bytes={len(raw_gvas)}"
    )


def roundtrip_save(file_path: Path, output: str) -> None:
    raw_gvas, save_type, gvas = load_gvas(file_path)
    written = gvas.write(custom_properties=PALWORLD_CUSTOM_PROPERTIES)
    if written != raw_gvas:
        raise ValueError("GVAS changed before recompression")

    output_path = Path(output or f"{file_path}.roundtrip.sav")
    if output_path.resolve() == file_path.resolve():
        raise ValueError("Roundtrip output must not overwrite the input save")

    rebuilt = compress_gvas_to_sav(written, save_type)
    output_path.write_bytes(rebuilt)
    rebuilt_raw, rebuilt_type, _ = load_gvas(output_path)
    if rebuilt_type != save_type or rebuilt_raw != raw_gvas:
        output_path.unlink(missing_ok=True)
        raise ValueError("Roundtrip validation failed after recompression")

    log(f"Roundtrip save written to {output_path}")


def export_json(file_path: Path, output: str) -> None:
    output_path = Path(output or f"{file_path}.json")
    convert_sav_to_json(
        str(file_path),
        str(output_path),
        force=True,
        minify=False,
        custom_properties_keys=["all"],
    )
    log(f"Editable JSON written to {output_path}")


def rebuild_json(file_path: Path, output: str) -> None:
    output_path = Path(output or file_path.with_suffix(".sav"))
    if output_path.resolve() == file_path.resolve():
        raise ValueError("Rebuild output must not overwrite the input JSON")

    convert_json_to_sav(str(file_path), str(output_path), force=True)
    validate_save(output_path)
    log(f"Rebuilt save written to {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Palworld save processing tool")
    parser.add_argument(
        "--mode",
        choices=("structure", "export", "rebuild", "validate", "roundtrip"),
        default="structure",
        help="Processing mode. The default keeps PST's existing sync behavior.",
    )
    parser.add_argument("--file", "-f", default="Level.sav", help="Input file")
    parser.add_argument("--output", "-o", default="", help="Output file")
    parser.add_argument("--request", "-r", default="", help="PST API base URL")
    parser.add_argument("--token", "-t", default="", help="PST API token")
    parser.add_argument(
        "--clear",
        "-c",
        action="store_true",
        help="Remove the temporary input directory after a successful structure sync",
    )
    parser.add_argument("--debug", action="store_true", help="Print a full traceback")
    return parser.parse_args()


def main() -> int:
    start = time.time()
    args = parse_args()
    file_path = Path(args.file)

    if not file_path.is_file():
        log(f"Input file does not exist: {file_path}", "ERROR")
        return 1

    try:
        if args.mode == "structure":
            structure_save(file_path, args.output, args.request, args.token)
        elif args.mode == "export":
            export_json(file_path, args.output)
        elif args.mode == "rebuild":
            rebuild_json(file_path, args.output)
        elif args.mode == "validate":
            validate_save(file_path)
        elif args.mode == "roundtrip":
            roundtrip_save(file_path, args.output)

        if args.clear and args.mode == "structure":
            try:
                file_path.unlink(missing_ok=True)
                player_dir = file_path.parent / "Players"
                if player_dir.exists():
                    shutil.rmtree(player_dir)
            except OSError as exc:
                log(f"Unable to clear temporary input: {exc}", "WARNING")
    except Exception as exc:
        log(str(exc), "ERROR")
        if args.debug:
            traceback.print_exc()
        return 1

    log(f"Done in {round(time.time() - start, 3)}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
