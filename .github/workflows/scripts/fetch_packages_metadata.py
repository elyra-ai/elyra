from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from itertools import chain, islice
import subprocess
import sys

from packaging import version
import requests


def get_info_from_pypi(pkg):
    url = f"https://pypi.org/pypi/{pkg}/json"
    try:
        res = requests.get(url).json()
        return res
    except Exception as err:
        print(f"request to pypi failed for <{pkg}>: {err}")
        return None


def get_pkg_list():
    out = subprocess.check_output(["python", "-m", "pip", "freeze"])
    req_list = out.decode().split("\n")
    return req_list


def check_release_date(pkg_list):
    """returns packages that were updated in the past `max_days` days, formatted for printing"""
    pkgs_output = []
    for row in pkg_list:
        try:
            pkg, v = row.split("==")
        except Exception:
            if len(row) > 1:
                print(f"skipping {row}")
            continue

        res = get_info_from_pypi(pkg)
        if not res:
            continue

        latest = res["info"]["version"]
        latest_upload_time = res["releases"][latest][0]["upload_time"]

        # continue if release older than argv[1]
        today = datetime.utcnow()
        release_date = datetime.fromisoformat(latest_upload_time)
        if today - release_date > timedelta(days=max_days):
            continue

        sign = ">"
        if version.parse(latest) == version.parse(v):
            sign = "="

        pkgs_output.append(
            f"Newer version for <{pkg}>:\n - released {latest}  {latest_upload_time[:10]}\t({sign})\n - current  {v}\n"
        )
    return pkgs_output


if __name__ == "__main__":
    max_days = 7  # default
    if len(sys.argv) > 1:
        max_days = int(sys.argv[1])

    print(f"Packages that were updated in the last {max_days} days:\n")

    pkg_list = get_pkg_list()
    l = len(pkg_list)

    workers = 3
    parts = list(range(0, l, l // workers))
    parts[-1] = l

    with ThreadPoolExecutor(max_workers=workers) as executor:
        results = executor.map(
            check_release_date,
            [islice(pkg_list, parts[i], parts[i + 1]) for i in range(len(parts) - 1)],
        )

    for item in chain(*results):
        print(item)
