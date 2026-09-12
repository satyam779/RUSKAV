"""
Builds public/gallery from the print catalogue PDF.

    python scripts/build-catalogue-images.py --pdf "path/to/Ruskav Catalogue 2023.pdf"

Every product photograph on the site comes from the 2023 print catalogue, so
this script is the record of how each one was made. Re-run it after a new
catalogue is issued rather than hand-editing files in public/gallery.

Three things happen to each picture:

  1. Extraction. The photographs are embedded with their transparency in a
     separate /SMask stream, which is why a naive extract renders them on flat
     black. The mask is decoded and re-attached as an alpha channel.
  2. Cleaning. Shots that arrived without a mask sit on studio white, which
     looks like a white box pasted onto a cream page. The white is flood-filled
     inwards from the corners — a plain brightness threshold would punch a hole
     straight through a white plate. Lifestyle and factory shots are left
     alone: there the background is the subject.
  3. Framing. The site crops with `object-cover` in fixed 4:5 and 1:1 frames.
     A wide tray dropped into a portrait frame loses its ends, so cut-outs are
     padded onto a canvas of the aspect they will be shown in, which makes the
     crop a no-op.

Requires: pypdf, pillow.
"""
import argparse
import io
import pathlib
import warnings

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps
from pypdf import PdfReader

warnings.filterwarnings("ignore")

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "gallery"

MAX_EDGE = 1400
PAD = 0.035
SENTINEL = (255, 0, 255)
MIN_PIXELS = 90_000

# Source key in the PDF -> published name, treatment, frame aspect.
#
#   cutout  drop the studio white, keep the product
#   keep    the PDF already supplied a mask; just trim and pad
#   photo   leave the background alone
#
# The frame is the aspect ratio of the slot the image is used in, or None to
# leave it at its natural shape (product grids show these with object-contain).
#
# A fifth value raises the flood-fill tolerance for a shot whose background is
# a soft grey gradient rather than flat white; the default stops partway up one
# and leaves a pale rectangle behind the product.
MANIFEST = [
    # --------------------------------------------------- cafeteria & fast food
    ("p04_Im0", "tray-fastfood-red", "cutout", (1, 1)),
    ("p01_Im0", "tray-service-black", "cutout", (1, 1)),
    ("p22_Im0", "tray-service-narrow", "cutout", (1, 1)),
    ("p03_Im0", "tray-in-service-dark", "photo", None),
    ("p03_Im2", "tray-in-service-red", "photo", None),
    ("p01_Im6", "tray-in-service-meal", "photo", None),
    # ------------------------------------------------ compartment trays/plates
    ("p01_Im2", "compartment-trays-fan", "keep", (4, 5)),
    ("p08_Im1", "compartment-trays-colours", "keep", (4, 5)),
    ("p10_Im7", "compartment-trays-three", "keep", (1, 1)),
    ("p11_Im7", "compartment-trays-six", "keep", (1, 1)),
    ("p12_Im7", "compartment-trays-stack", "keep", (1, 1)),
    ("p09_Im7", "compartment-trays-black", "keep", (1, 1)),
    ("p13_Im1", "compartment-tray-green", "keep", (1, 1)),
    ("p11_Im8", "compartment-tray-lidded", "keep", (1, 1)),
    ("p09_Im8", "compartment-tray-lid-red", "keep", (1, 1)),
    ("p13_Im0", "compartment-carrier-open", "keep", (1, 1)),
    ("p14_Im7", "compartment-carrier-loaded", "keep", (1, 1)),
    ("p14_Im8", "compartment-tray-lid-clear", "photo", None),
    # ------------------------------------------------------------- dinnerware
    ("p16_Im0", "plate-polycarbonate-rim", "keep", (1, 1)),
    ("p17_Im1", "plate-copolymer-white", "keep", (1, 1)),
    ("p15_Im0", "dinnerware-set-table", "photo", None),
    ("p18_Im0", "bowls-yellow-white", "keep", (1, 1)),
    ("p18_Im4", "bowls-lidded-clear", "photo", None),
    ("p18_Im5", "bowls-clear-row", "photo", None),
    # -------------------------------------------------------------- drinkware
    ("p01_Im3", "tumblers-colourways", "cutout", (4, 5)),
    ("p20_Im0", "tumblers-poured", "cutout", (1, 1)),
    ("p19_Im0", "tumblers-row-table", "photo", None),
    ("p01_Im7", "tumblers-frosted-table", "photo", None),
    ("p21_Im0", "tumblers-clear-pair", "photo", None),
    ("p21_Im1", "tumbler-frosted", "photo", None),
    ("p20_Im1", "tumbler-in-service", "photo", None),
    # ---------------------------------------------------------- bio-composite
    ("p23_Im0", "bio-place-setting", "cutout", (4, 5), 60),
    ("p24_Im0", "bio-compartment-tray", "cutout", (1, 1), 60),
    ("p24_Im2", "bio-bowls", "photo", None),
    ("p24_Im3", "bio-bowls-overhead", "photo", None),
    ("p24_Im4", "bio-plates", "photo", None),
    ("p24_Im5", "bio-cups", "photo", None),
    # ----------------------------------------------------------- manufacturing
    ("p02_Im1", "factory-mould-open", "photo", None),
    ("p02_Im2", "factory-press", "photo", None),
    ("p02_Im0", "factory-crates", "photo", None),
]


# ------------------------------------------------------------------- decoding


def filters_of(obj):
    f = obj.get("/Filter")
    if f is None:
        return []
    return [str(x) for x in (f if isinstance(f, list) else [f])]


def to_pil(obj, gray=False):
    """Decode an image XObject stream, whatever it is compressed with."""
    w, h = int(obj["/Width"]), int(obj["/Height"])
    if {"/DCTDecode", "/JPXDecode", "/JBIG2Decode"} & set(filters_of(obj)):
        raw = obj._data if hasattr(obj, "_data") else obj.get_data()
        return Image.open(io.BytesIO(raw))

    data = obj.get_data()
    if gray or len(data) == w * h:
        img = Image.frombytes("L", (w, h), data[: w * h])
    elif len(data) >= w * h * 3:
        img = Image.frombytes("RGB", (w, h), data[: w * h * 3])
    else:
        raise ValueError(f"cannot map {len(data)} bytes onto {w}x{h}")

    if obj.get("/Decode") == [1.0, 0.0]:
        img = ImageOps.invert(img)
    return img


def harvest(pdf_path):
    """{'p04_Im0': RGBA image} for every photograph in the catalogue."""
    reader = PdfReader(pdf_path)
    found = {}

    for pageno, page in enumerate(reader.pages, start=1):
        xobjects = page.get("/Resources", {}).get("/XObject", {})
        for key in list(xobjects.keys()):
            try:
                xo = xobjects[key].get_object()
            except Exception:
                continue
            if xo.get("/Subtype") != "/Image":
                continue
            if int(xo.get("/Width", 0)) * int(xo.get("/Height", 0)) < MIN_PIXELS:
                continue

            name = f"p{pageno:02d}_{str(key).strip('/')}"
            try:
                base = to_pil(xo).convert("RGB")
            except Exception as err:
                print(f"  {name}: {err}")
                continue

            out = base.convert("RGBA")
            smask = xo.get("/SMask")
            if smask is not None:
                try:
                    alpha = to_pil(smask.get_object(), gray=True).convert("L")
                    if alpha.size != base.size:
                        alpha = alpha.resize(base.size, Image.LANCZOS)
                    out.putalpha(alpha)
                except Exception as err:
                    print(f"  {name}: mask ignored ({err})")

            found[name] = out
    return found


# ------------------------------------------------------------------ treatment


def drop_white_background(img, thresh=26):
    """Flood-fill the studio white inwards from the four corners."""
    rgb = img.convert("RGB")
    work = rgb.copy()
    w, h = work.size
    seeds = ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1))
    for seed in seeds:
        if sum(rgb.getpixel(seed)) < 3 * 225:
            continue  # that spot is product, not background
        ImageDraw.floodfill(work, seed, SENTINEL, thresh=thresh)

    repainted = ImageChops.difference(work, rgb).convert("L")
    alpha = repainted.point(lambda v: 0 if v > 8 else 255)
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def trim_border(img):
    """Crop a uniform border away, transparent or flat-coloured."""
    if img.mode == "RGBA" and img.getchannel("A").getextrema()[0] < 250:
        box = img.getchannel("A").getbbox()
    else:
        rgb = img.convert("RGB")
        flat = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
        box = (
            ImageChops.difference(rgb, flat)
            .convert("L")
            .point(lambda v: 255 if v > 10 else 0)
            .getbbox()
        )
    return img.crop(box) if box else img


def pad(img):
    """A little air, so nothing touches the edge of the panel."""
    m = int(max(img.size) * PAD)
    out = Image.new("RGBA", (img.width + 2 * m, img.height + 2 * m), (0, 0, 0, 0))
    out.paste(img, (m, m))
    return out


def frame(img, aspect):
    """Centre the product on a transparent canvas of the given aspect."""
    if aspect is None:
        return img
    aw, ah = aspect
    want = aw / ah
    have = img.width / img.height
    if abs(want - have) < 0.01:
        return img
    if have > want:
        w, h = img.width, round(img.width / want)
    else:
        w, h = round(img.height * want), img.height
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(img, ((w - img.width) // 2, (h - img.height) // 2))
    return out


def fit(img):
    if max(img.size) <= MAX_EDGE:
        return img
    scale = MAX_EDGE / max(img.size)
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, help="path to the catalogue PDF")
    args = parser.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    sources = harvest(args.pdf)
    print(f"{len(sources)} photographs in the catalogue")

    written, total = 0, 0
    for key, name, treatment, aspect, *rest in MANIFEST:
        img = sources.get(key)
        if img is None:
            print(f"MISSING {key} -> {name}")
            continue

        if treatment == "cutout":
            img = pad(trim_border(drop_white_background(img, *rest)))
        elif treatment == "keep":
            img = pad(trim_border(img))
        else:
            img = trim_border(img).convert("RGB")

        img = fit(frame(img, aspect))
        target = OUT / f"{name}.webp"
        img.save(target, "WEBP", quality=82, method=6)

        size = target.stat().st_size
        written += 1
        total += size
        print(f"{size / 1024:7.1f} KB  {img.width:>5}x{img.height:<5}  {name}.webp")

    print(f"\n{written} images, {total / 1024:.0f} KB into public/gallery")


if __name__ == "__main__":
    main()
