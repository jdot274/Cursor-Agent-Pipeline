using System.IO;
using UnityEditor;
using UnityEngine;

public static class RenderGlbPreview
{
    const string GlbPath = "Assets/RelayDerivatives/BlueSphereShader_v1/BlueSphereShader_v1_bake.glb";
    const string OutPath = "relay-glb-unity-preview-v1.png";

    public static void Run()
    {
        var prefab = AssetDatabase.LoadMainAssetAtPath(GlbPath) as GameObject;
        if (prefab == null)
        {
            Debug.LogError("[RELAY_GLB_PREVIEW] FAIL prefab null");
            EditorApplication.Exit(1);
            return;
        }

        var instance = (GameObject)Object.Instantiate(prefab, Vector3.zero, Quaternion.identity);

        var camGo = new GameObject("PreviewCamera");
        var cam = camGo.AddComponent<Camera>();
        cam.transform.position = new Vector3(0, 0, -3.2f);
        cam.transform.LookAt(Vector3.zero);
        cam.fieldOfView = 42f;
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.012f, 0.016f, 0.031f);

        var lightGo = new GameObject("PreviewLight");
        var light = lightGo.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1.1f;
        lightGo.transform.rotation = Quaternion.Euler(35f, -30f, 0f);

        const int w = 1280, h = 720;
        var rt = new RenderTexture(w, h, 24);
        cam.targetTexture = rt;
        cam.Render();

        RenderTexture.active = rt;
        var tex = new Texture2D(w, h, TextureFormat.RGB24, false);
        tex.ReadPixels(new Rect(0, 0, w, h), 0, 0);
        tex.Apply();
        RenderTexture.active = null;

        File.WriteAllBytes(OutPath, tex.EncodeToPNG());
        Debug.Log($"[RELAY_GLB_PREVIEW] PASS out={Path.GetFullPath(OutPath)} bytes={new FileInfo(OutPath).Length}");

        Object.DestroyImmediate(instance);
        Object.DestroyImmediate(camGo);
        Object.DestroyImmediate(lightGo);
        EditorApplication.Exit(0);
    }
}
