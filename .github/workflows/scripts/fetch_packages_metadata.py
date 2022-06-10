from requests import get
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from itertools import islice
import sys
import subprocess


def get_info_from_pypi(pkg):
    url = f"https://pypi.org/pypi/{pkg}/json"
    try:
        res = get(url).json()
        return res
    except Exception as e:
        print(f"request to pypi failed for <{pkg}>: {e}")
        return None


def get_outdated_pkg_list():
    out = subprocess.check_output(["python", "-m", "pip", "list", "--outdated", "--format", "freeze"])
    req_list = out.decode().split("\n")
    return req_list


def check_release_date(pkg_list):
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

        print(f"Newer version for <{pkg}>:")
        print(f" - released {latest}  {latest_upload_time[:10]}")
        print(f" - current  {v}")
        print("")


if __name__ == "__main__":
    max_days = 7  # default
    if len(sys.argv) > 1:
        max_days = int(sys.argv[1])

    print(f"packages that were updated in the last {max_days} days:")
    print()

    pkg_list = get_outdated_pkg_list()
    l = len(pkg_list)
    workers = 3
    parts = [i for i in range(0, l, l // workers)]
    parts[-1] = l

    with ThreadPoolExecutor(max_workers=workers) as executor:
        executor.map(
            check_release_date,
            [islice(pkg_list, parts[i], parts[i + 1]) for i in range(len(parts) - 1)],
        )
