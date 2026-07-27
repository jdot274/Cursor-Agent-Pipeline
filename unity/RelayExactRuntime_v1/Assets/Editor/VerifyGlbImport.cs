using System.Linq;
using UnityEditor;
using UnityEngine;

public static class VerifyGlbImport
{
    const string GlbPath = "Assets/RelayDerivatives/BlueSphereShader_v1/BlueSphereShader_v1_bake.glb";

    public static void Run()
    {
        AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);

        var main = AssetDatabase.LoadMainAssetAtPath(GlbPath);
        var all = AssetDatabase.LoadAllAssetsAtPath(GlbPath);
        var meshes = all.OfType<Mesh>().ToArray();
        var materials = all.OfType<Material>().ToArray();
        var textures = all.OfType<Texture>().ToArray();

        if (main == null || meshes.Length == 0)
        {
            Debug.LogError($"[RELAY_GLB_IMPORT] FAIL path={GlbPath} main={(main == null ? "null" : main.name)} meshes={meshes.Length}");
            EditorApplication.Exit(1);
            return;
        }

        var mesh = meshes[0];
        Debug.Log(
            $"[RELAY_GLB_IMPORT] PASS path={GlbPath} main={main.name} " +
            $"meshes={meshes.Length} verts={mesh.vertexCount} tris={mesh.triangles.Length / 3} " +
            $"materials={materials.Length} textures={textures.Length}");
        EditorApplication.Exit(0);
    }
}
