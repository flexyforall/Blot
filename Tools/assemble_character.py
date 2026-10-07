"""Assemble a layered character (PSD for Unity's PSD Importer) from ChatGPT images.

Inputs in Art/Source/<Name>/ (see Art/Source/README.md):
  <Name>_Full.png    the whole character: defines the canvas and every position
  <Name>_Torso.png   the character without arms, clothing painted under them
  part sheets        pieces on a transparent background (head, hands, hat...)

How layers are made:
  * Torso and the pieces listed in PLACE are matched against Full with SIFT features and
    placed with a similarity transform (scale, rotation, shift).
  * The arms (and Billy's hat) are cut straight out of Full: everything Full shows that the
    Torso doesn't and no placed piece covers. Each blob goes to the nearest anchor in CUT.
  * Pieces listed in ALT are alternative poses (hands for gestures). They are put over the
    piece they replace and hidden; Unity swaps them in with a Sprite Resolver.

Output: Assets/Art/Characters/<Name>.psd for Unity, and in Art/Build/<Name>/ one PNG per
layer, preview.png (Full on the left, assembled layers on the right) and report.txt.

Usage: python3 Tools/assemble_character.py Marco [Laura Billy Knight]
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Art" / "Source"
OUT = ROOT / "Art" / "Build"
UNITY = ROOT / "Assets" / "Art" / "Characters"

# PLACE: (sheet, piece index left to right, layer name), drawn above the arms, bottom to top.
# ALT:   (sheet, piece index, layer name, layer it replaces)
CHARACTERS = {
    "Marco": {
        "place": [("Marco_ArmRight", 2, "HandR_Cigar"), ("Marco_ArmLeft", 2, "HandL_Cyber"),
                  ("Marco_Head", 0, "Head")],
        "alt": [("Marco_ArmLeft", 3, "HandL_Cyber_FingersUp", "HandL_Cyber")],
        "cut": {"ArmR": (.15, .6), "ArmL": (.8, .65)},
    },
    "Laura": {
        "place": [("Laura_Arms", -1, "Hands_Clasped"), ("Laura_Head", 0, "Hair_Back"),
                  ("Laura_Head", 1, "Head")],
        "alt": [("Laura_Hands", 0, "HandR_Open", "Hands_Clasped"),
                ("Laura_Hands", 1, "HandR_Tapping", "Hands_Clasped"),
                ("Laura_Hands", 2, "HandL_HairTouch", "Hands_Clasped")],
        "cut": {"ArmL": (.55, .35), "ArmR": (.55, .85)},
    },
    "Billy": {
        "place": [("Billy_Arms", -1, "Hands_Clasped")],
        "alt": [("Billy_Hands", 0, "HandR_Scratch", "Hands_Clasped"),
                ("Billy_Hands", 1, "HandR_HatBrim", "Hands_Clasped"),
                ("Billy_Hands", 2, "HandR_Open", "Hands_Clasped")],
        # Billy_Head.png and Billy_Hat.png are drawn from another angle: the hat is cut from Full,
        # the head under it comes from the torso.
        "cut": {"ArmL": (.15, .45), "Hat": (.65, .15), "ArmR": (.6, .85)},
    },
    "Knight": {
        "place": [("Knight_Arms", -1, "Gauntlets_Clasped"), ("Knight_Helmet", 0, "Helmet")],
        "alt": [("Knight_Gauntlets", 0, "GauntletR_Drum", "Gauntlets_Clasped"),
                ("Knight_Gauntlets", 1, "GauntletR_Flat", "Gauntlets_Clasped"),
                ("Knight_Gauntlets", 2, "GauntletL_Flat", "Gauntlets_Clasped")],
        "cut": {"ArmL": (.25, .35), "ArmR": (.75, .35)},
    },
}

MIN_PIECE_AREA = 0.004   # of a sheet: smaller blobs are specks
MIN_INLIERS = 12

sift = cv2.SIFT_create(nfeatures=8000)


def load(path):
    im = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3:
        im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    return im


def pieces(sheet):
    alpha = (sheet[:, :, 3] > 20).astype(np.uint8)
    closed = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(closed)
    out = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < MIN_PIECE_AREA * alpha.size:
            continue
        p = sheet.copy()
        p[labels != i] = 0
        out.append((x, p[y:y + h, x:x + w]))
    out.sort(key=lambda t: t[0])
    return [p for _, p in out]


def features(rgba):
    gray = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_BGR2GRAY)
    return sift.detectAndCompute(gray, (rgba[:, :, 3] > 128).astype(np.uint8) * 255)


def match(piece, fkp, fdes):
    kp, des = features(piece)
    if des is None or len(kp) < 6:
        return None, 0
    pairs = cv2.BFMatcher().knnMatch(des, fdes, k=2)
    good = [p[0] for p in pairs if len(p) == 2 and p[0].distance < .75 * p[1].distance]
    if len(good) < 6:
        return None, len(good)
    src = np.float32([kp[m.queryIdx].pt for m in good])
    dst = np.float32([fkp[m.trainIdx].pt for m in good])
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=6)
    n = int(inl.sum()) if inl is not None else 0
    if M is None or n < MIN_INLIERS or not .2 < np.hypot(*M[0, :2]) < 5:
        return None, n
    return M, n


def warp(piece, M, W, H):
    return cv2.warpAffine(piece, M, (W, H), flags=cv2.INTER_LANCZOS4, borderValue=(0, 0, 0, 0))


def describe(M):
    return f"scale {np.hypot(*M[0, :2]):.2f}, rot {np.degrees(np.arctan2(M[1, 0], M[0, 0])):+.1f}°"


def over(dst, src):
    a = src[:, :, 3:4].astype(np.float32) / 255
    out = dst.astype(np.float32)
    out[:, :, :3] = src[:, :, :3] * a + out[:, :, :3] * (1 - a)
    out[:, :, 3:4] = 255 * (a + out[:, :, 3:4] / 255 * (1 - a))
    return out.astype(np.uint8)


def cut_from_full(full, torso, placed, anchors):
    """Pixels Full has that the Torso lacks (or shows differently), minus placed pieces.
    Each big blob goes to the nearest anchor (normalized x, y) and becomes that layer."""
    H, W = full.shape[:2]
    fa = full[:, :, 3] > 128
    ta = torso[:, :, 3] > 128
    diff = np.abs(full[:, :, :3].astype(int) - torso[:, :, :3].astype(int)).sum(2)
    diff = cv2.GaussianBlur(diff.astype(np.float32), (0, 0), 3)
    mask = fa & (~ta | (diff > 90))
    covered = np.zeros_like(mask)
    for layer in placed:
        covered |= layer[:, :, 3] > 200
    # shrink so the cut layer tucks a few pixels under the piece above it: no seam
    covered = cv2.erode(covered.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    mask &= ~covered
    mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    n, labels, stats, cents = cv2.connectedComponentsWithStats(mask)
    groups = {name: np.zeros((H, W), np.uint8) for name in anchors}
    for i in range(1, n):
        if stats[i, 4] < .003 * mask.size:
            continue
        cx, cy = cents[i][0] / W, cents[i][1] / H
        name = min(anchors, key=lambda k: (anchors[k][0] - cx) ** 2 + (anchors[k][1] - cy) ** 2)
        groups[name] |= (labels == i).astype(np.uint8)
    out = []
    for name, m in groups.items():
        if not m.any():
            continue
        m = cv2.dilate(m, np.ones((5, 5), np.uint8))           # grow back under the soft edge
        soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.5)
        layer = full.copy()
        layer[:, :, 3] = (full[:, :, 3] * np.clip(soft, 0, 1)).astype(np.uint8)
        out.append((name, layer))
    return out


def build(name):
    cfg = CHARACTERS[name]
    src = SRC / name
    full = load(src / f"{name}_Full.png")
    H, W = full.shape[:2]
    fkp, fdes = features(full)
    out = OUT / name
    out.mkdir(parents=True, exist_ok=True)
    report = [f"{name}: canvas {W}x{H}"]

    torso_piece = pieces(load(src / f"{name}_Torso.png"))[0]
    M, n = match(torso_piece, fkp, fdes)
    if M is None:
        report.append(f"Torso: NOT MATCHED ({n} inliers) — cannot build, regenerate the torso")
        print("\n".join(report))
        return report
    torso = warp(torso_piece, M, W, H)
    report.append(f"Torso: placed, {n} inliers, {describe(M)}")

    placed, placed_M = [], {}
    for sheet, idx, layer in cfg["place"]:
        ps = pieces(load(src / f"{sheet}.png"))
        if idx >= len(ps):
            report.append(f"{layer}: sheet {sheet} has {len(ps)} pieces, expected {idx + 1}+ — SKIPPED")
            continue
        M, n = match(ps[idx], fkp, fdes)
        if M is None:
            report.append(f"{layer}: NOT MATCHED ({n} inliers) — left out, place it by hand")
            continue
        placed.append((layer, warp(ps[idx], M, W, H)))
        placed_M[layer] = (M, ps[idx].shape)
        report.append(f"{layer}: placed, {n} inliers, {describe(M)}")

    arms = cut_from_full(full, torso, [l for _, l in placed], cfg["cut"])
    report.append(f"Cut from Full: {', '.join(a for a, _ in arms) or 'nothing found'}")

    alts = []
    for sheet, idx, layer, replaces in cfg["alt"]:
        ps = pieces(load(src / f"{sheet}.png"))
        if idx >= len(ps) or replaces not in placed_M:
            report.append(f"{layer}: SKIPPED (no piece or nothing to replace)")
            continue
        M0, shape0 = placed_M[replaces]
        h0, w0 = shape0[:2]
        p = ps[idx]
        s = np.hypot(*M0[0, :2])
        c0 = M0 @ np.array([w0 / 2, h0 / 2, 1])
        M = np.float32([[s, 0, c0[0] - s * p.shape[1] / 2], [0, s, c0[1] - s * p.shape[0] / 2]])
        alts.append((layer, warp(p, M, W, H)))
        report.append(f"{layer}: alternative for {replaces}, hidden")

    on_top = [a for a in arms if a[0] == "Hat"]
    visible = [("Torso", torso)] + [a for a in arms if a[0] != "Hat"] + placed + on_top
    comp = np.zeros((H, W, 4), np.uint8)
    for _, l in visible:
        comp = over(comp, l)

    alt_names = {a for a, _ in alts}
    psd = PSDImage.new("RGBA", (W, H))
    for lname, l in visible + alts:
        cv2.imwrite(str(out / f"{lname}.png"), l)
        ys, xs = np.nonzero(l[:, :, 3])
        if len(xs) == 0:
            continue
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        crop = Image.fromarray(cv2.cvtColor(l[y0:y1, x0:x1], cv2.COLOR_BGRA2RGBA))
        layer = PixelLayer.frompil(crop, psd, lname, int(y0), int(x0))
        layer.visible = lname not in alt_names
        psd.append(layer)
    UNITY.mkdir(parents=True, exist_ok=True)
    psd.save(str(UNITY / f"{name}.psd"))

    checker = np.full((H, W, 4), 255, np.uint8)
    checker[((np.indices((H, W)).sum(0) // 24) % 2) == 0, :3] = 205
    cv2.imwrite(str(out / "preview.png"), np.hstack([over(checker, full), over(checker, comp)]))
    (out / "report.txt").write_text("\n".join(report) + "\n")
    print("\n".join(report))
    return report


if __name__ == "__main__":
    for n in sys.argv[1:] or CHARACTERS:
        build(n)
        print()
