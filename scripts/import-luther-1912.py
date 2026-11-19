"""Import the pinned Zefania Luther 1912 archive into static book files."""

import argparse
import hashlib
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile


ARCHIVE_SHA256 = "b8564700056ed512e4ea6ebc716bff1d3069a80e68f194da872121c9cf21868c"
ASSETS = Path(__file__).resolve().parents[1] / "outputs" / "assets"
DISPLAY_NAMES = {74: "Stücke zu Daniel", 75: "Stücke zu Ester", 76: "Gebet Manasses"}
ABBREVIATIONS = {74: "ZusDan", 75: "ZusEst", 76: "Man"}


def json_data(value):
    return json.dumps(value, ensure_ascii=True, separators=(",", ":"))


def import_books(archive_path):
    if hashlib.sha256(archive_path.read_bytes()).hexdigest() != ARCHIVE_SHA256:
        raise ValueError("This archive does not match the pinned Zefania download.")
    with ZipFile(archive_path) as archive:
        root = ET.fromstring(archive.read(archive.namelist()[0]))
    if root.findtext("INFORMATION/identifier") != "LUTH1912AP":
        raise ValueError("Expected Luther 1912 with Apocrypha.")

    catalog = []
    books = {}
    for book in root.findall("BIBLEBOOK"):
        number = int(book.attrib["bnumber"])
        section = "ap" if number > 66 else "nt" if number > 39 else "ot"
        name = DISPLAY_NAMES.get(number, book.attrib["bname"])
        chapters = {}
        for chapter in book.findall("CHAPTER"):
            chapter_number = int(chapter.attrib["cnumber"])
            if chapter_number in chapters:
                raise ValueError(f"Repeated chapter {name} {chapter_number}")
            # Retain source verse order and numbering. Editorial notes are separate
            # XML elements; include the verse text and any text after those notes.
            chapters[chapter_number] = [
                [int(verse.attrib["vnumber"]), "".join(
                    [verse.text or "", *(child.tail or "" for child in verse)]
                ).strip()]
                for verse in chapter.findall("VERS")
            ]
            if not chapters[chapter_number] or any(not text for _, text in chapters[chapter_number]):
                raise ValueError(f"Empty chapter or verse in {name} {chapter_number}")
        if number in books or not chapters:
            raise ValueError(f"Repeated or empty book: {name}")
        books[number] = chapters
        abbreviation = ABBREVIATIONS.get(number, book.attrib["bsname"])
        catalog.append({
            "id": number, "name": name, "short": abbreviation, "section": section,
            "chapters": list(chapters)
        })

    if set(books) != set(range(1, 77)):
        raise ValueError("Expected 66 canonical books and 10 Apocrypha entries.")
    directory = ASSETS / "bible-1912"
    directory.mkdir(exist_ok=True)
    for number, chapters in books.items():
        (directory / f"{number}.js").write_text(
            f"window.luther1912Books.set({number},{json_data(chapters)});\n", encoding="utf-8"
        )
    (ASSETS / "bible-catalog.js").write_text(
        f"const luther1912Catalog={json_data(catalog)};\n", encoding="utf-8"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    import_books(parser.parse_args().archive)
