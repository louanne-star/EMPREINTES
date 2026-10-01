# Prépare le loriquet généré avec Meshy : battement d'ailes, textures allégées, export .glb.
# Usage : /Applications/Blender.app/Contents/MacOS/Blender -b --python outils/loriquet-animer.py -- \
#           models/originaux/Meshy_AI_Character_output.glb models/loriquet.glb dossier_apercus
# Ajoute un battement d'ailes au loriquet Meshy, allège les textures et exporte en .glb.
# Usage : Blender -b --python animer.py -- entree.glb sortie.glb dossier_apercus
import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
src, dst, out = argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
scene = bpy.context.scene
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
mesh = next(o for o in scene.objects if o.type == 'MESH' and o.name == 'Mesh_0')
# Objets parasites créés à l'import (forme d'affichage des os)
for o in list(scene.objects):
    if o not in (arm, mesh) and o.type == 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)

FPS, BEAT = 24, 12                     # un battement = 12 images = 0,5 s
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 0, BEAT

# Chaîne de chaque aile : épaule → bras → pointe. side = +1 aile droite (x > 0), -1 gauche.
WINGS = {+1: ['Bone_018', 'Bone_017', 'Bone_016'], -1: ['Bone_015', 'Bone_014', 'Bone_013']}
AXIS = mathutils.Vector((0, 1, 0))     # axe du corps (tête vers -Y dans Blender)
# Angles (degrés) au fil du battement : épaule (descente), bras et pointe (souplesse)
KEYS = {          # image : (épaule, bras, pointe)
    0:  (0,   0,   0),
    3:  (45, -12, -12),   # descente : la pointe traîne vers le haut
    6:  (80,  10,  12),   # bas du battement
    9:  (40,  25,  22),   # remontée : la pointe se replie vers le bas
    12: (0,   0,   0),
}

def rot_pose(pb, angle_deg, side):
    """Rotation autour de l'axe du corps, exprimée dans le repère de repos de l'os."""
    rest = pb.bone.matrix_local.to_quaternion()
    q = mathutils.Quaternion(AXIS, math.radians(angle_deg) * side)
    return rest.inverted() @ q @ rest

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
for pb in arm.pose.bones:
    pb.rotation_mode = 'QUATERNION'
for frame, angles in KEYS.items():
    for side, chain in WINGS.items():
        for name, a in zip(chain, angles):
            pb = arm.pose.bones[name]
            pb.rotation_quaternion = rot_pose(pb, a, side)
            pb.keyframe_insert('rotation_quaternion', frame=frame)
bpy.ops.object.mode_set(mode='OBJECT')
act = arm.animation_data.action
act.name = 'vol'

# Maillage allégé pour le téléphone (50 000 → ~12 000 sommets), avant le squelette
dec = mesh.modifiers.new('allege', 'DECIMATE')
dec.ratio = 0.25
mesh.modifiers.move(mesh.modifiers.find(dec.name), 0)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.modifier_apply(modifier=dec.name)
print('SOMMETS', len(mesh.data.vertices))

# Textures : 2048 → 1024 pour le téléphone
for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)

# Aperçus : ailes en haut (0), à mi-descente (3), en bas (6), en remontée (9)
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.render.resolution_x = scene.render.resolution_y = 500
cam_data = bpy.data.cameras.new('cam'); cam_data.type = 'ORTHO'; cam_data.ortho_scale = 2.6
cam = bpy.data.objects.new('cam', cam_data); scene.collection.objects.link(cam); scene.camera = cam
target = mathutils.Vector((0, 0, 0.9))
for vname, p in {'3q': (3.5, -3.5, 2.0), 'face': (0, -5, 0.9)}.items():
    cam.location = p
    cam.rotation_euler = (target - mathutils.Vector(p)).to_track_quat('-Z', 'Y').to_euler()
    for f in (0, 3, 6, 9):
        scene.frame_set(f)
        scene.render.filepath = f'{out}/vol_{vname}_{f:02d}.png'
        bpy.ops.render.render(write_still=True)
scene.frame_set(0)
cam_obj = cam
bpy.data.objects.remove(cam_obj, do_unlink=True)

bpy.ops.export_scene.gltf(
    filepath=dst, export_format='GLB', export_animations=True,
    export_image_format='JPEG', export_jpeg_quality=85,
    export_apply=False, export_yup=True,
)
print('EXPORT OK', dst)
