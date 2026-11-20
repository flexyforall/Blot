# Quick viewport render (playblast) of the open splash previs v3 scene to the Desktop.
# Open blot_splash_v3.blend (or run blot_splash_v3.py first), then run this in the Text Editor
# or paste it into the Python Console. Uses the scene camera, not your viewport view.
import os
import bpy

sc = bpy.context.scene
ims = sc.render.image_settings
if hasattr(ims, "media_type"):          # Blender 5.x
    ims.media_type = 'VIDEO'
ims.file_format = 'FFMPEG'
sc.render.ffmpeg.format = 'MPEG4'
sc.render.ffmpeg.codec = 'H264'
sc.render.filepath = os.path.join(os.path.expanduser('~'), 'Desktop', 'splash_previz.mp4')
bpy.ops.render.opengl(animation=True, view_context=False)
