"""
Render the Blot splash previs v3 to an MP4.

Inside Blender: Scripting tab -> Open this file -> Run Script.
    If the open file is not the v3 scene yet, blot_splash_v3.py (same folder) builds it first.
    The render opens in its own window and shows progress; Esc stops it.
From a terminal:
    blender -b -P render_splash_v3.py
    blender -b -P render_splash_v3.py -- --scale 100 --samples 32 --out ~/Desktop/splash.mp4
    blender -b -P render_splash_v3.py -- --frames 1 60      (only part of the shot)

Settings below are the defaults; terminal options override them.
"""

import os
import runpy
import sys

import bpy

# ---------------------------------------------------------------- settings
RES_PERCENT = 50        # % of 1920x1080 (50 = 960x540, 100 = full HD)
SAMPLES = 16            # EEVEE samples: 8 = quick draft, 64 = final look
OUT_FILE = ""           # empty = splash_v3_preview.mp4 next to the .blend (or this script)
FRAMES = None           # None = the whole shot (1-210); or e.g. (1, 60)

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if "--scale" in argv:
    RES_PERCENT = int(argv[argv.index("--scale") + 1])
if "--samples" in argv:
    SAMPLES = int(argv[argv.index("--samples") + 1])
if "--out" in argv:
    OUT_FILE = os.path.expanduser(argv[argv.index("--out") + 1])
if "--frames" in argv:
    i = argv.index("--frames")
    FRAMES = (int(argv[i + 1]), int(argv[i + 2]))
IN_UI = not bpy.app.background


def script_dir():
    cands = []
    try:
        cands.append(os.path.dirname(os.path.abspath(__file__)))
    except NameError:
        pass
    for t in bpy.data.texts:            # in the Text Editor __file__ is only the text's name
        if t.filepath and os.path.basename(t.filepath).startswith("render_splash"):
            cands.append(os.path.dirname(bpy.path.abspath(t.filepath)))
    for d in cands:
        if d and os.path.isdir(os.path.join(d)) and os.path.isfile(os.path.join(d, "blot_splash_v3.py")):
            return d
    return ""


# ---------------------------------------------------------------- the scene
if bpy.data.objects.get("BOSS") is None or bpy.data.objects.get("FaceLight_Don") is None:
    here = script_dir()
    builder = os.path.join(here, "blot_splash_v3.py") if here else ""
    if not builder or not os.path.isfile(builder):
        raise RuntimeError("Open blot_splash_v3.blend first, or keep blot_splash_v3.py in the same "
                           "folder as this script so it can build the scene.")
    print("Building the scene with", builder)
    saved_argv = sys.argv
    sys.argv = [builder]                 # build only: no --render / --stills
    try:
        runpy.run_path(builder, run_name="__main__")
    finally:
        sys.argv = saved_argv

scene = bpy.context.scene

# ---------------------------------------------------------------- output
if not OUT_FILE:
    base = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else (script_dir() or os.path.expanduser("~"))
    if not os.access(base, os.W_OK):
        base = os.path.expanduser("~")
    OUT_FILE = os.path.join(base, "splash_v3_preview.mp4")
if not OUT_FILE.lower().endswith(".mp4"):
    OUT_FILE += ".mp4"
os.makedirs(os.path.dirname(os.path.abspath(OUT_FILE)), exist_ok=True)

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = RES_PERCENT
try:
    scene.eevee.taa_render_samples = SAMPLES
except AttributeError:
    pass
if FRAMES:
    scene.frame_start, scene.frame_end = FRAMES

ims = scene.render.image_settings
if hasattr(ims, "media_type"):          # Blender 5.x
    ims.media_type = "VIDEO"
ims.file_format = "FFMPEG"
ff = scene.render.ffmpeg
ff.format = "MPEG4"
ff.codec = "H264"
ff.constant_rate_factor = "HIGH"
ff.audio_codec = "NONE"
scene.render.use_file_extension = False
scene.render.filepath = os.path.abspath(OUT_FILE)

w = scene.render.resolution_x * RES_PERCENT // 100
h = scene.render.resolution_y * RES_PERCENT // 100
print("Rendering frames %d-%d at %dx%d, %d samples -> %s"
      % (scene.frame_start, scene.frame_end, w, h, SAMPLES, scene.render.filepath))

if IN_UI:
    # Opens the render window with a progress bar; Blender stays responsive, Esc cancels.
    bpy.ops.render.render("INVOKE_DEFAULT", animation=True)
else:
    bpy.ops.render.render(animation=True)
    print("Rendered", scene.render.filepath)
