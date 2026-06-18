import json
import re
import sys
from datetime import date
from pathlib import Path

try:
    import pdfplumber
except ImportError as exc:
    raise SystemExit(
        "Missing pdfplumber. Install it with: python -m pip install pdfplumber"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "public" / "data" / "dbfz" / "Impro" / "Team building notes.pdf"
CHARACTERS_PATH = ROOT / "public" / "data" / "dbfz" / "characters.json"
OUTPUT_PATH = ROOT / "public" / "data" / "dbfz" / "team-building-notes.json"

TOP_HEADINGS = [
    "Character Identity",
    "What This Character Contributes",
    "Team Placement",
    "Assist Analysis",
    "DHC Synergy",
    "Best Team Archetypes",
    "Win Conditions",
    "Team Building Questions",
    "Summary",
]

DISPLAY_OVERRIDES = {
    "SSJ GOKU": "SSJ Goku",
    "GOKU SUPER SAIYAN BLUE": "Goku Blue",
    "GOKU BASE": "Base Goku",
    "GOKU GT": "GT Goku",
    "GOKU ULTRA INSTINCT": "UI Goku",
    "VEGETA SUPER SAIYAN": "SSJ Vegeta",
    "VEGETA SUPER SAIYAN BLUE": "Vegeta Blue",
    "VEGETA BASE": "Base Vegeta",
    "GOHAN TEEN": "Teen Gohan",
    "GOHAN ADULT": "Adult Gohan",
    "CAPTAIN GINYU": "Ginyu",
    "ANDROID 21": "Android 21 (Majin)",
    "BROLY DBZ": "DBZ Broly",
    "BROLY DBS": "DBS Broly",
    "VEGITO SSGSS": "Vegito Blue",
    "GOGETA SS4": "SSJ4 Gogeta",
    "GOGETA BLUE SSGSS": "Gogeta Blue",
    "GOKU DAIMA": "SSJ4 Goku (Daima)",
}

HEADING_DISPLAY_OVERRIDES = {
    "SSJ GOKU (GENERALIST)": "SSJ Goku",
    "GOKU (SUPER SAIYAN BLUE) (Momentum)": "Goku Blue",
    "GOKU (BASE)": "Base Goku",
    "GOKU (GT)": "GT Goku",
    "GOKU (ULTRA INSTINCT)": "UI Goku",
    "VEGETA (SUPER SAIYAN)": "SSJ Vegeta",
    "VEGETA (SUPER SAIYAN BLUE)": "Vegeta Blue",
    "VEGETA (BASE)": "Base Vegeta",
    "GOHAN (TEEN)": "Teen Gohan",
    "GOHAN (ADULT)": "Adult Gohan",
    "CAPTAIN GINYU": "Ginyu",
    "ANDROID 21": "Android 21 (Majin)",
    "ANDROID 21 (LAB COAT)": "Android 21 (Lab Coat)",
    "BROLY (DBZ)": "DBZ Broly",
    "BROLY (DBS)": "DBS Broly",
    "VEGITO (SSGSS)": "Vegito Blue",
    "GOGETA SS4": "SSJ4 Gogeta",
    "GOGETA BLUE (SSGSS)": "Gogeta Blue",
    "GOKU (DAIMA)": "SSJ4 Goku (Daima)",
}


def slugify(value):
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def plain_heading(value):
    value = re.sub(r"\([^)]*\)", " ", value)
    value = re.sub(r"[^A-Za-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip().upper()


def pdf_heading_to_display(heading):
    if heading in HEADING_DISPLAY_OVERRIDES:
        return HEADING_DISPLAY_OVERRIDES[heading]
    base = plain_heading(heading)
    if base in DISPLAY_OVERRIDES:
        return DISPLAY_OVERRIDES[base]
    return " ".join(word.capitalize() for word in base.split())


def load_roster():
    data = json.loads(CHARACTERS_PATH.read_text(encoding="utf-8"))
    records = data["characters"] if isinstance(data, dict) and "characters" in data else data
    by_name = {}
    for record in records:
        by_name[record["name"].lower()] = record
        by_name[record["id"].replace("-", " ").lower()] = record
    return records, by_name


def clean_line(line):
    line = line.strip()
    line = re.sub(r"\s+", " ", line)
    return line


def extract_pages():
    pages = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            lines = [clean_line(line) for line in text.splitlines()]
            pages.append({"page": number, "lines": [line for line in lines if line]})
    return pages


def flatten_pages(pages):
    flat = []
    for page in pages:
        for line in page["lines"]:
            if line == "Guides team roaster builds":
                continue
            flat.append({"page": page["page"], "text": line})
    return flat


def is_character_heading(flat, index):
    return index + 1 < len(flat) and flat[index + 1]["text"] == "Character Identity"


def split_characters(flat):
    starts = [i for i in range(len(flat) - 1) if is_character_heading(flat, i)]
    chapters = []
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else len(flat)
        chapters.append(
            {
                "heading": flat[start]["text"],
                "startPage": flat[start]["page"],
                "endPage": flat[end - 1]["page"],
                "items": flat[start + 1 : end],
            }
        )
    return chapters


def lines_only(items):
    return [item["text"] for item in items]


def normalize_bullets(lines):
    result = []
    for line in lines:
        if line.startswith("•"):
            result.append(line[1:].strip())
        elif result and line not in TOP_HEADINGS and not is_known_subheading(line):
            result[-1] = f"{result[-1]} {line}".strip()
        elif line:
            result.append(line)
    return [item for item in result if item]


def is_known_subheading(line):
    subheadings = {
        "Primary Roles",
        "Team Archetypes",
        "One-Sentence Summary",
        "Damage",
        "Neutral",
        "Mix",
        "Support",
        "Resource Economy",
        "Point",
        "Mid",
        "Anchor",
        "Preferred Position",
        "Explanation",
        "A Assist",
        "B Assist",
        "C Assist",
        "Provides",
        "Best Partners",
        "Weak Partners",
        "Drawbacks",
        "Why",
        "Why It Works",
        "Example Teams",
        "Primary Win Condition",
        "Secondary Win Condition",
        "Late-Game Win Condition",
        "Summary",
        "Final Verdict",
    }
    return line in subheadings or line.startswith("Characters That Love DHCing Into") or line.startswith("Characters ") or line.startswith("Why Pick") or line.startswith("Why Avoid") or line.endswith("Wants Teammates Who...") or line.endswith("Struggles To Provide...") or line.startswith("Before Adding")


def section_lines(chapter_lines, heading):
    starts = [i for i, line in enumerate(chapter_lines) if line == heading]
    if not starts:
        return []
    start = starts[0] + 1
    next_indices = [i for i in range(start, len(chapter_lines)) if chapter_lines[i] in TOP_HEADINGS]
    end = next_indices[0] if next_indices else len(chapter_lines)
    return chapter_lines[start:end]


def collect_under(lines, heading, stop_headings):
    if heading not in lines:
        return []
    start = lines.index(heading) + 1
    end = len(lines)
    for i in range(start, len(lines)):
        if lines[i] in stop_headings or any(match_heading(lines[i], stop) for stop in stop_headings):
            end = i
            break
    return normalize_bullets(lines[start:end])


def match_heading(line, heading):
    if heading.endswith("*"):
        return line.startswith(heading[:-1])
    return line == heading


def collect_after_matching(lines, predicate, stop_headings):
    start = None
    for i, line in enumerate(lines):
        if predicate(line):
            start = i + 1
            break
    if start is None:
        return []
    end = len(lines)
    for i in range(start, len(lines)):
        if lines[i] in stop_headings or any(match_heading(lines[i], stop) for stop in stop_headings):
            end = i
            break
    return normalize_bullets(lines[start:end])


def parse_identity(lines):
    stops = ["Primary Roles", "Team Archetypes", "One-Sentence Summary"]
    return {
        "primaryRoles": collect_under(lines, "Primary Roles", stops),
        "teamArchetypes": collect_under(lines, "Team Archetypes", stops),
        "oneSentenceSummary": collect_under(lines, "One-Sentence Summary", stops),
    }


def parse_contributions(lines):
    stops = ["Damage", "Neutral", "Mix", "Support", "Resource Economy"]
    return {
        "damage": collect_under(lines, "Damage", stops),
        "neutral": collect_under(lines, "Neutral", stops),
        "mix": collect_under(lines, "Mix", stops),
        "support": collect_under(lines, "Support", stops),
        "resourceEconomy": collect_under(lines, "Resource Economy", stops),
    }


def parse_team_placement(lines):
    stops = ["Point", "Mid", "Anchor", "Preferred Position", "Explanation"]
    return {
        "point": collect_under(lines, "Point", stops),
        "mid": collect_under(lines, "Mid", stops),
        "anchor": collect_under(lines, "Anchor", stops),
        "preferredPosition": collect_under(lines, "Preferred Position", stops),
        "explanation": collect_under(lines, "Explanation", stops),
    }


def parse_assists(lines):
    result = {}
    assist_stops = ["A Assist", "B Assist", "C Assist"]
    for assist in ["A", "B", "C"]:
        heading = f"{assist} Assist"
        block = collect_under(lines, heading, assist_stops)
        raw_block = []
        if heading in lines:
            start = lines.index(heading) + 1
            end = len(lines)
            for other in assist_stops:
                if other == heading:
                    continue
                if other in lines[start:]:
                    end = min(end, start + lines[start:].index(other))
            raw_block = lines[start:end]
        result[assist] = {
            "provides": collect_under(raw_block, "Provides", ["Best Partners", "Weak Partners", "Drawbacks", "Why"]),
            "bestPartners": collect_under(raw_block, "Best Partners", ["Provides", "Weak Partners", "Drawbacks", "Why"]),
            "weakPartners": collect_under(raw_block, "Weak Partners", ["Provides", "Best Partners", "Drawbacks", "Why"]),
            "drawbacks": collect_under(raw_block, "Drawbacks", ["Provides", "Best Partners", "Weak Partners", "Why"]),
            "why": collect_under(raw_block, "Why", ["Provides", "Best Partners", "Weak Partners", "Drawbacks"]),
            "raw": block,
        }
    return result


def parse_dhc(lines):
    return {
        "charactersThatLoveDHCingInto": collect_after_matching(
            lines,
            lambda line: line.startswith("Characters That Love DHCing Into"),
            ["Why", "Characters *", "Special DHC Interactions"],
        ),
        "whyInto": collect_under(lines, "Why", ["Characters *", "Special DHC Interactions"]),
        "charactersThisCharacterLovesDHCingInto": collect_after_matching(
            lines,
            lambda line: line.startswith("Characters ") and "Loves DHCing Into" in line,
            ["Why", "Special DHC Interactions"],
        ),
        "specialInteractions": collect_under(lines, "Special DHC Interactions", ["Why"]),
        "raw": normalize_bullets(lines),
    }


def parse_best_team_archetypes(lines):
    archetypes = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line in {"Why It Works", "Example Teams"} or line.startswith("•"):
            i += 1
            continue
        title = line
        block_start = i + 1
        block_end = len(lines)
        for j in range(block_start, len(lines)):
            if not lines[j].startswith("•") and lines[j] not in {"Why It Works", "Example Teams"}:
                # Treat a non-bullet after content as the next archetype heading.
                if j > block_start:
                    block_end = j
                    break
        block = lines[block_start:block_end]
        archetypes.append(
            {
                "name": title,
                "whyItWorks": collect_under(block, "Why It Works", ["Example Teams"]),
                "exampleTeams": collect_under(block, "Example Teams", ["Why It Works"]),
                "raw": normalize_bullets(block),
            }
        )
        i = block_end
    return archetypes


def parse_win_conditions(lines):
    stops = ["Primary Win Condition", "Secondary Win Condition", "Late-Game Win Condition"]
    return {
        "primary": collect_under(lines, "Primary Win Condition", stops),
        "secondary": collect_under(lines, "Secondary Win Condition", stops),
        "lateGame": collect_under(lines, "Late-Game Win Condition", stops),
    }


def parse_questions(lines):
    return {
        "wantsTeammatesWho": collect_after_matching(lines, lambda line: line.endswith("Wants Teammates Who..."), ["*Struggles To Provide...", "Before Adding*"]),
        "strugglesToProvide": collect_after_matching(lines, lambda line: line.endswith("Struggles To Provide..."), ["Before Adding*"]),
        "beforeAddingAsk": collect_after_matching(lines, lambda line: line.startswith("Before Adding"), []),
    }


def parse_summary(lines):
    return {
        "whyPick": collect_after_matching(lines, lambda line: line.startswith("Why Pick"), ["Why Avoid*", "Final Verdict"]),
        "whyAvoid": collect_after_matching(lines, lambda line: line.startswith("Why Avoid"), ["Final Verdict"]),
        "finalVerdict": collect_under(lines, "Final Verdict", []),
    }


def first(items, fallback=""):
    return items[0] if items else fallback


def build_record(chapter, roster_by_name):
    lines = lines_only(chapter["items"])
    display = pdf_heading_to_display(chapter["heading"])
    roster_record = roster_by_name.get(display.lower()) or roster_by_name.get(slugify(display).replace("-", " ").lower())
    record_id = roster_record["id"] if roster_record else slugify(display)
    identity = parse_identity(section_lines(lines, "Character Identity"))
    contributions = parse_contributions(section_lines(lines, "What This Character Contributes"))
    placement = parse_team_placement(section_lines(lines, "Team Placement"))
    assists = parse_assists(section_lines(lines, "Assist Analysis"))
    dhc = parse_dhc(section_lines(lines, "DHC Synergy"))
    best_archetypes = parse_best_team_archetypes(section_lines(lines, "Best Team Archetypes"))
    win_conditions = parse_win_conditions(section_lines(lines, "Win Conditions"))
    questions = parse_questions(section_lines(lines, "Team Building Questions"))
    summary = parse_summary(section_lines(lines, "Summary"))
    searchable = " ".join(
        [
            chapter["heading"],
            display,
            " ".join(lines),
        ]
    )
    return {
        "id": record_id,
        "name": display,
        "pdfHeading": chapter["heading"],
        "source": "Team building notes.pdf",
        "sourcePageStart": chapter["startPage"],
        "sourcePageEnd": chapter["endPage"],
        "characterIdentity": identity,
        "teamArchetypes": identity["teamArchetypes"],
        "contributions": contributions,
        "teamPlacement": placement,
        "assistAnalysis": assists,
        "dhcSynergy": dhc,
        "bestTeamArchetypes": best_archetypes,
        "winConditions": win_conditions,
        "teamBuildingQuestions": questions,
        "whyPick": summary["whyPick"],
        "whyAvoid": summary["whyAvoid"],
        "finalVerdict": summary["finalVerdict"],
        "derivedCharacterFields": {
            "roles": identity["primaryRoles"],
            "archetype": first(identity["oneSentenceSummary"]),
            "overview": first(identity["oneSentenceSummary"]),
            "strengths": contributions["damage"][:2] + contributions["neutral"][:2] + contributions["support"][:1],
            "weaknesses": contributions["mix"][:2] + questions["strugglesToProvide"][:2],
            "wants": questions["wantsTeammatesWho"][:4],
        },
        "searchableText": searchable,
    }


def main():
    if not PDF_PATH.exists():
        raise SystemExit(f"Missing PDF: {PDF_PATH}")
    _, roster_by_name = load_roster()
    pages = extract_pages()
    chapters = split_characters(flatten_pages(pages))
    records = [build_record(chapter, roster_by_name) for chapter in chapters]
    out = {
        "schemaVersion": 1,
        "source": "Team building notes.pdf",
        "sourcePath": "public/data/dbfz/Impro/Team building notes.pdf",
        "lastImported": date.today().isoformat(),
        "recordCount": len(records),
        "records": {record["id"]: record for record in records},
    }
    OUTPUT_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Imported {len(records)} PDF character guides to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
