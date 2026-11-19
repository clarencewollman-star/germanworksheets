"""Build the one-page beginner Fibel worksheets from the transcribed source."""
import json
import re
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "outputs" / "assets"
DESTINATION = ASSETS / "fibel" / "beginner"
FONT = "FibelFraktur"
LEFT, RIGHT = 54, 558
SIZE = 26
LEADING = 35


def fraktur(text):
    """Use the website font's ligatures and the Fraktur round s at word ends."""
    def encode(match):
        word = match[0]
        if word in {"Gotteshaus", "Gotteswort"}:
            word = word.replace("Gottes", "Gotte–")
        word = word.replace("ch", "¡").replace("ck", "¿").replace("tz", "|")
        return word[:-1] + "–" if word.endswith("s") else word

    return re.sub(r"[A-Za-zÄÖÜäöüß]+", encode, text.replace(" – ", " — "))


def reading_lines(text):
    """Wrap by the printed width while retaining the original text for copying."""
    line = ""
    for word in text.split():
        candidate = f"{line} {word}" if line else word
        if line and pdfmetrics.stringWidth(fraktur(candidate), FONT, SIZE) > RIGHT - LEFT:
            yield line
            candidate = word
        line = candidate
    if line:
        yield line


def draw_fraktur(doc, x, y, text):
    # The historical font stores ligatures in legacy code points. ActualText
    # supplies ordinary German spelling to PDF readers that support it.
    actual = "FEFF" + text.encode("utf-16-be").hex().upper()
    doc.addLiteral(f"/Span << /ActualText <{actual}> >> BDC")
    doc.drawString(x, y, fraktur(text))
    doc.addLiteral("EMC")


def build(page, slug, title, text):
    doc = canvas.Canvas(str(DESTINATION / f"{slug}.pdf"), pagesize=letter, invariant=1)
    doc.setTitle(f"{title} - Lesen und malen")
    doc.setSubject("Kurzes Lesestück aus der Deutschen Fibel (1901)")
    doc.setFillColor("#252525")
    doc.setFont(FONT, 30)
    draw_fraktur(doc, LEFT, 735, title)
    doc.setFont("Helvetica", 10)
    doc.drawString(LEFT, 706, "Lies den Text. Male ein Bild dazu.")
    doc.drawString(RIGHT - 153, 706, "Name:")
    doc.setStrokeColor("#636363")
    doc.setLineWidth(.65)
    doc.line(RIGHT - 119, 704, RIGHT, 704)
    doc.setStrokeColor("#333333")
    doc.setLineWidth(.9)
    doc.rect(LEFT, 498, RIGHT - LEFT, 191, fill=0)

    doc.setFont(FONT, SIZE)
    for index, line in enumerate(reading_lines(text)):
        y = 453 - index * LEADING
        if y < 65:
            raise ValueError(f"{title} does not fit on one page")
        draw_fraktur(doc, LEFT, y, line)

    doc.setFont("Helvetica", 8.5)
    doc.setFillColor("#545454")
    doc.drawString(LEFT, 30, f"Deutsche Fibel (1901)  ·  Kurze Lesestücke  ·  S. {page}")
    doc.save()


if __name__ == "__main__":
    pdfmetrics.registerFont(TTFont(FONT, str(ASSETS / "tfrakmed.ttf")))
    DESTINATION.mkdir(parents=True, exist_ok=True)
    for entry in json.loads(Path(__file__).with_name("fibel-beginner.json").read_text(encoding="utf-8")):
        build(*entry)
