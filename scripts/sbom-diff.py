#!/usr/bin/env python3
"""
AiGovOps Foundation — CycloneDX SBOM Diff Tool
Compares two CycloneDX JSON SBOMs and outputs a structured diff.
"""

import argparse
import json
import sys
from collections import OrderedDict


def parse_sbom(path):
    """Parse a CycloneDX JSON SBOM and return a dict of {name@group: component}."""
    with open(path) as f:
        data = json.load(f)

    components = {}
    for comp in data.get("components", []):
        name = comp.get("name", "unknown")
        group = comp.get("group", "")
        version = comp.get("version", "")
        comp_type = comp.get("type", "library")
        purl = comp.get("purl", "")
        scope = comp.get("scope", "")

        # Use group/name as the key for matching
        key = f"{group}/{name}" if group else name

        components[key] = {
            "name": name,
            "group": group,
            "version": version,
            "type": comp_type,
            "purl": purl,
            "scope": scope,
        }

    meta = data.get("metadata", {})
    tool_info = meta.get("tools", [])

    return {
        "spec_version": data.get("specVersion", "?"),
        "serial": data.get("serialNumber", ""),
        "component_count": len(components),
        "components": components,
    }


def compute_diff(old_sbom, new_sbom):
    """Compute the diff between two parsed SBOMs."""
    old_keys = set(old_sbom["components"].keys())
    new_keys = set(new_sbom["components"].keys())

    added_keys = sorted(new_keys - old_keys)
    removed_keys = sorted(old_keys - new_keys)
    common_keys = sorted(old_keys & new_keys)

    # Detect version changes in common components
    upgraded = []
    downgraded = []
    unchanged_count = 0

    for key in common_keys:
        old_ver = old_sbom["components"][key]["version"]
        new_ver = new_sbom["components"][key]["version"]
        if old_ver != new_ver:
            entry = {
                "name": new_sbom["components"][key]["name"],
                "group": new_sbom["components"][key]["group"],
                "old_version": old_ver,
                "new_version": new_ver,
                "type": new_sbom["components"][key]["type"],
            }
            # Simple heuristic: if versions differ, categorize as "changed"
            upgraded.append(entry)
        else:
            unchanged_count += 1

    added = []
    for key in added_keys:
        comp = new_sbom["components"][key]
        added.append({
            "name": comp["name"],
            "group": comp["group"],
            "version": comp["version"],
            "type": comp["type"],
            "purl": comp["purl"],
        })

    removed = []
    for key in removed_keys:
        comp = old_sbom["components"][key]
        removed.append({
            "name": comp["name"],
            "group": comp["group"],
            "version": comp["version"],
            "type": comp["type"],
            "purl": comp["purl"],
        })

    return {
        "summary": {
            "old_count": old_sbom["component_count"],
            "new_count": new_sbom["component_count"],
            "added": len(added),
            "removed": len(removed),
            "version_changed": len(upgraded),
            "unchanged": unchanged_count,
        },
        "added": added,
        "removed": removed,
        "version_changed": upgraded,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Compare two CycloneDX JSON SBOMs and output a diff."
    )
    parser.add_argument(
        "--old", required=True,
        help="Path to the previous (old) CycloneDX JSON SBOM",
    )
    parser.add_argument(
        "--new", required=True,
        help="Path to the current (new) CycloneDX JSON SBOM",
    )
    parser.add_argument(
        "--old-tag", default="previous",
        help="Label for the old version (e.g. v0.9.0)",
    )
    parser.add_argument(
        "--new-tag", default="current",
        help="Label for the new version (e.g. v1.0.0)",
    )
    parser.add_argument(
        "--output", default="./sbom-diff.json",
        help="Output diff JSON path (default: ./sbom-diff.json)",
    )
    args = parser.parse_args()

    print(f"[INFO] Parsing old SBOM: {args.old}")
    old_sbom = parse_sbom(args.old)
    print(f"[INFO]   Components: {old_sbom['component_count']}")

    print(f"[INFO] Parsing new SBOM: {args.new}")
    new_sbom = parse_sbom(args.new)
    print(f"[INFO]   Components: {new_sbom['component_count']}")

    diff = compute_diff(old_sbom, new_sbom)
    diff["old_tag"] = args.old_tag
    diff["new_tag"] = args.new_tag

    s = diff["summary"]
    print(f"\n[DIFF] {s['old_count']} → {s['new_count']} components")
    print(f"       +{s['added']} added, -{s['removed']} removed, ~{s['version_changed']} changed, ={s['unchanged']} unchanged")

    with open(args.output, "w") as f:
        json.dump(diff, f, indent=2)
    print(f"\n[OK] Diff written to: {args.output}")


if __name__ == "__main__":
    main()
