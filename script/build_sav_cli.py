from __future__ import annotations

import argparse
import hashlib
import importlib.machinery
import os
import platform
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path


PST_COMMIT = "2cb6fd963120b002f0732dad153786e624f64b38"
PST_SOURCE_URL = (
    "https://codeload.github.com/deafdudecomputers/PalworldSaveTools/zip/"
    + PST_COMMIT
)
PST_SOURCE_SHA256 = "37c9375b53790312be44c7eab1f5d2b50b6444719ba82bb487467522859146d8"
PST_RELEASE_URL = (
    "https://github.com/deafdudecomputers/PalworldSaveTools/releases/download/"
    "v2.0.0/PST_standalone_v2.0.0.7z"
)
PST_RELEASE_SHA256 = "0e75e8018eaa8a56dfa22465e5bbf7a232c9cda52a314b6ebdc088029347668c"
PALOOZ_MEMBER = "lib/palooz.cp313-win_amd64.pyd"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch(url: str, destination: Path, expected_hash: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_file() and sha256(destination) == expected_hash:
        print(f"Using cached {destination.name}")
        return

    request = urllib.request.Request(url, headers={"User-Agent": "pst-sav-cli-builder"})
    temporary = destination.with_suffix(destination.suffix + ".part")
    temporary.unlink(missing_ok=True)
    with urllib.request.urlopen(request) as response, temporary.open("wb") as output:
        shutil.copyfileobj(response, output)

    actual_hash = sha256(temporary)
    if actual_hash != expected_hash:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(
            f"SHA-256 mismatch for {destination.name}: {actual_hash}"
        )
    temporary.replace(destination)


def extract_source(archive: Path, destination: Path) -> Path:
    marker = destination / ".commit"
    if marker.is_file() and marker.read_text(encoding="ascii") == PST_COMMIT:
        roots = [path for path in destination.iterdir() if path.is_dir()]
        if len(roots) == 1:
            return roots[0]

    shutil.rmtree(destination, ignore_errors=True)
    destination.mkdir(parents=True)
    with zipfile.ZipFile(archive) as source:
        source.extractall(destination)
    marker.write_text(PST_COMMIT, encoding="ascii")
    roots = [path for path in destination.iterdir() if path.is_dir()]
    if len(roots) != 1:
        raise RuntimeError("Unexpected PalworldSaveTools source archive layout")
    return roots[0]


def extract_palooz(archive: Path, destination: Path) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    output = destination / Path(PALOOZ_MEMBER).name
    if output.is_file():
        return output

    tar = shutil.which("tar")
    if not tar:
        raise RuntimeError("Windows tar.exe is required to extract the verified 7z asset")
    subprocess.run(
        [tar, "-xf", str(archive), "-C", str(destination), PALOOZ_MEMBER],
        check=True,
    )
    extracted = destination / PALOOZ_MEMBER
    if not extracted.is_file():
        raise RuntimeError("palooz runtime was not present in the verified release asset")
    shutil.copy2(extracted, output)
    return output


def require_build_modules() -> None:
    missing: list[str] = []
    for module in ("PyInstaller", "orjson", "requests", "setuptools", "wheel"):
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    if missing:
        raise RuntimeError(
            "Missing build modules: "
            + ", ".join(missing)
            + ". Run with uv and the pinned build dependencies."
        )


def build_palooz(source_root: Path, staging: Path) -> None:
    source = source_root / "src" / "palsav" / "palooz"
    subprocess.run(
        [sys.executable, "setup.py", "build_ext", "--inplace"],
        check=True,
        cwd=source,
    )
    candidates = [
        candidate
        for candidate in source.glob("palooz*")
        if candidate.is_file()
        and any(
            candidate.name.endswith(suffix)
            for suffix in importlib.machinery.EXTENSION_SUFFIXES
        )
    ]
    if len(candidates) != 1:
        raise RuntimeError(
            f"Expected one compiled palooz extension, found {len(candidates)}"
        )
    shutil.copy2(candidates[0], staging / candidates[0].name)


def build(repo_root: Path, output: Path, cache: Path) -> None:
    machine = platform.machine().lower()
    if machine not in {"amd64", "x86_64", "arm64", "aarch64"}:
        raise RuntimeError(f"Unsupported architecture: {machine}")
    if sys.maxsize <= 2**32:
        raise RuntimeError("A 64-bit Python runtime is required")
    if os.name == "nt" and sys.version_info[:2] != (3, 13):
        raise RuntimeError("The verified palooz runtime requires CPython 3.13")

    require_build_modules()
    source_archive = cache / f"PalworldSaveTools-{PST_COMMIT}.zip"
    fetch(PST_SOURCE_URL, source_archive, PST_SOURCE_SHA256)

    source_root = extract_source(source_archive, cache / "source")
    staging = cache / "staging"
    shutil.rmtree(staging, ignore_errors=True)
    staging.mkdir(parents=True)

    shutil.copytree(source_root / "src" / "palsav" / "palsav", staging / "palsav")
    if os.name == "nt":
        release_archive = cache / "PST_standalone_v2.0.0.7z"
        fetch(PST_RELEASE_URL, release_archive, PST_RELEASE_SHA256)
        palooz = extract_palooz(release_archive, cache / "runtime")
        shutil.copy2(palooz, staging / palooz.name)
    else:
        build_palooz(source_root, staging)
    for name in ("logger.py", "sav_cli.py", "structurer.py", "world_types.py"):
        shutil.copy2(repo_root / "sav_cli" / name, staging / name)

    build_root = cache / "pyinstaller"
    dist = build_root / "dist"
    shutil.rmtree(build_root, ignore_errors=True)
    output.parent.mkdir(parents=True, exist_ok=True)

    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--name",
        "sav_cli",
        "--paths",
        str(staging),
        "--collect-submodules",
        "palsav",
        "--hidden-import",
        "palooz",
        "--distpath",
        str(dist),
        "--workpath",
        str(build_root / "work"),
        "--specpath",
        str(build_root / "spec"),
        str(staging / "sav_cli.py"),
    ]
    if os.name == "nt":
        command[3:3] = ["--icon", str(repo_root / "build" / "windows" / "pst.ico")]
    subprocess.run(command, check=True, cwd=staging)
    executable_name = "sav_cli.exe" if os.name == "nt" else "sav_cli"
    built = dist / executable_name
    if not built.is_file():
        raise RuntimeError(f"PyInstaller did not produce {executable_name}")
    shutil.copy2(built, output)
    if os.name != "nt":
        output.chmod(0o755)

    license_target = output.parent / "sav_cli-GPL-3.0.txt"
    shutil.copy2(source_root / "src" / "palsav" / "LICENSE", license_target)
    print(f"sav_cli built: {output}")
    print(f"sav_cli SHA-256: {sha256(output)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build PST sav_cli with the current palsav engine"
    )
    parser.add_argument("--output", default="dist/sav_cli.exe")
    parser.add_argument("--cache-dir", default=".cache/sav-cli-build")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    output = (repo_root / args.output).resolve()
    cache = (repo_root / args.cache_dir).resolve()
    build(repo_root, output, cache)


if __name__ == "__main__":
    main()
